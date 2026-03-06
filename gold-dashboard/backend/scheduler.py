"""
Daily scheduler for automatic data refresh and AI brief generation.
Runs as a background thread or standalone process.
"""
import logging
import sqlite3
import threading
import time
from datetime import datetime, date, timedelta

from config import DB_PATH, DAILY_BRIEF_HOUR, DAILY_BRIEF_MINUTE
from data_fetcher import build_snapshot, fetch_news_headlines, fetch_economic_calendar_events
from models import get_conn

logger = logging.getLogger(__name__)

_scheduler_thread: threading.Thread | None = None
_stop_event = threading.Event()


def run_daily_tasks():
    """Execute all daily refresh tasks."""
    logger.info("[Scheduler] Starting daily tasks...")

    # 1. Fetch and store price snapshot
    try:
        from data_fetcher import build_snapshot
        snapshot = build_snapshot()
        save_snapshot(snapshot)
        logger.info(f"[Scheduler] Snapshot saved: intl={snapshot.get('intl_usd_oz')} USD/oz")
    except Exception as e:
        logger.error(f"[Scheduler] Snapshot fetch failed: {e}")
        snapshot = {}

    # 2. Fetch news headlines
    try:
        news = fetch_news_headlines()
        logger.info(f"[Scheduler] Fetched {len(news)} news headlines")
    except Exception as e:
        logger.warning(f"[Scheduler] News fetch failed: {e}")
        news = []

    # 3. Fetch economic calendar
    try:
        calendar = fetch_economic_calendar_events(days_ahead=7)
        save_calendar_events(calendar)
        logger.info(f"[Scheduler] Fetched {len(calendar)} calendar events")
    except Exception as e:
        logger.warning(f"[Scheduler] Calendar fetch failed: {e}")
        calendar = []

    # 4. Generate AI brief (only if API key is configured)
    from config import ANTHROPIC_API_KEY
    if ANTHROPIC_API_KEY:
        try:
            generate_and_save_brief(snapshot, news, calendar)
        except Exception as e:
            logger.error(f"[Scheduler] AI brief generation failed: {e}")
    else:
        logger.info("[Scheduler] Skipping AI brief (no ANTHROPIC_API_KEY set)")

    # 5. Check price alerts
    check_and_trigger_alerts(snapshot)

    logger.info("[Scheduler] Daily tasks completed.")


def save_snapshot(snapshot: dict) -> int:
    """Persist a price snapshot to the database. Returns row id."""
    import json
    conn = get_conn()
    try:
        c = conn.cursor()
        c.execute("""
            INSERT INTO price_snapshots
            (ts, intl_usd_oz, intl_cny_g, domestic_cny_g, spread_cny_g, usd_cny_rate,
             icbc_buy, ccb_buy, boc_buy, abc_buy, cmb_buy,
             dxy, us10y_yield, spx, source, raw_json)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            snapshot.get("ts"),
            snapshot.get("intl_usd_oz"),
            snapshot.get("intl_cny_g"),
            snapshot.get("domestic_cny_g"),
            snapshot.get("spread_cny_g"),
            snapshot.get("usd_cny_rate"),
            snapshot.get("icbc_buy"),
            snapshot.get("ccb_buy"),
            snapshot.get("boc_buy"),
            snapshot.get("abc_buy"),
            snapshot.get("cmb_buy"),
            snapshot.get("dxy"),
            snapshot.get("us10y_yield"),
            snapshot.get("spx"),
            snapshot.get("source"),
            snapshot.get("raw_json") if isinstance(snapshot.get("raw_json"), str)
            else json.dumps(snapshot.get("raw_json", {})),
        ))
        conn.commit()
        return c.lastrowid
    finally:
        conn.close()


def generate_and_save_brief(snapshot: dict, news: list, calendar: list):
    """Generate AI brief and save to DB."""
    from ai_analyzer import generate_daily_brief
    import json

    today = date.today().isoformat()

    # Get open positions
    conn = get_conn()
    try:
        positions = [dict(r) for r in conn.execute(
            "SELECT * FROM positions WHERE status='open'"
        ).fetchall()]

        # Get previous brief
        prev = conn.execute(
            "SELECT * FROM daily_briefs WHERE date < ? ORDER BY date DESC LIMIT 1",
            (today,)
        ).fetchone()
        prev_brief = dict(prev) if prev else None
    finally:
        conn.close()

    # Generate
    brief = generate_daily_brief(
        snapshot=snapshot,
        positions=positions,
        recent_news=news,
        macro_events=[],
        economic_calendar=calendar,
        prev_brief=prev_brief,
    )

    # Save
    conn = get_conn()
    try:
        conn.execute("""
            INSERT OR REPLACE INTO daily_briefs
            (date, generated_at, market_summary, price_analysis, recommendation,
             rec_reason, price_range_low, price_range_high, key_risks, full_brief, model_used)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (
            today,
            brief.get("generated_at"),
            brief.get("market_summary"),
            brief.get("price_analysis"),
            brief.get("recommendation"),
            brief.get("rec_reason"),
            brief.get("price_range_low"),
            brief.get("price_range_high"),
            json.dumps(brief.get("key_risks", []), ensure_ascii=False),
            brief.get("full_brief"),
            brief.get("model_used"),
        ))
        conn.commit()
        logger.info(f"[Scheduler] Daily brief saved for {today}: {brief.get('recommendation')}")
    finally:
        conn.close()


def save_calendar_events(events: list):
    """Save economic calendar events to DB."""
    if not events:
        return
    conn = get_conn()
    try:
        for ev in events:
            try:
                conn.execute("""
                    INSERT OR IGNORE INTO economic_calendar
                    (event_date, event_time, country, event_name, importance, forecast, previous, source)
                    VALUES (?,?,?,?,?,?,?,?)
                """, (
                    ev.get("event_date", ev.get("published", "")),
                    ev.get("event_time", ""),
                    ev.get("country", ""),
                    ev.get("event_name", ev.get("title", "")),
                    ev.get("importance", "medium"),
                    ev.get("forecast", ""),
                    ev.get("previous", ""),
                    ev.get("source", ""),
                ))
            except Exception as e:
                logger.debug(f"Calendar insert error: {e}")
        conn.commit()
    finally:
        conn.close()


def check_and_trigger_alerts(snapshot: dict):
    """Check active price alerts and trigger them if conditions are met."""
    conn = get_conn()
    try:
        alerts = [dict(r) for r in conn.execute(
            "SELECT * FROM price_alerts WHERE status='active'"
        ).fetchall()]

        price_map = {
            "domestic":      snapshot.get("domestic_cny_g"),
            "international": snapshot.get("intl_cny_g"),
            "bank_icbc":     snapshot.get("icbc_buy"),
            "bank_ccb":      snapshot.get("ccb_buy"),
            "bank_boc":      snapshot.get("boc_buy"),
            "bank_abc":      snapshot.get("abc_buy"),
            "bank_cmb":      snapshot.get("cmb_buy"),
        }

        for alert in alerts:
            price_type = alert.get("price_type")
            current = price_map.get(price_type)
            if current is None:
                continue

            threshold = alert.get("threshold")
            alert_type = alert.get("alert_type")
            triggered = False

            if alert_type == "above" and current >= threshold:
                triggered = True
            elif alert_type == "below" and current <= threshold:
                triggered = True

            if triggered:
                conn.execute(
                    "UPDATE price_alerts SET status='triggered', triggered_at=? WHERE id=?",
                    (datetime.utcnow().isoformat(), alert["id"])
                )
                logger.info(
                    f"[Alert] Triggered: {price_type} {alert_type} {threshold} "
                    f"(current: {current})"
                )
        conn.commit()
    finally:
        conn.close()


def _scheduler_loop():
    """Background loop that runs daily tasks at the configured hour."""
    logger.info(f"[Scheduler] Started. Will run at {DAILY_BRIEF_HOUR:02d}:{DAILY_BRIEF_MINUTE:02d} daily.")
    last_run_date = None

    while not _stop_event.is_set():
        now = datetime.now()
        today = date.today()

        should_run = (
            now.hour == DAILY_BRIEF_HOUR
            and now.minute == DAILY_BRIEF_MINUTE
            and last_run_date != today
        )

        if should_run:
            last_run_date = today
            try:
                run_daily_tasks()
            except Exception as e:
                logger.error(f"[Scheduler] Daily tasks error: {e}")

        _stop_event.wait(timeout=30)  # check every 30 seconds


def start_scheduler():
    """Start the background scheduler thread."""
    global _scheduler_thread
    _stop_event.clear()
    _scheduler_thread = threading.Thread(target=_scheduler_loop, daemon=True, name="GoldScheduler")
    _scheduler_thread.start()
    logger.info("[Scheduler] Background scheduler started.")


def stop_scheduler():
    """Stop the background scheduler thread."""
    _stop_event.set()
    if _scheduler_thread:
        _scheduler_thread.join(timeout=5)
    logger.info("[Scheduler] Stopped.")
