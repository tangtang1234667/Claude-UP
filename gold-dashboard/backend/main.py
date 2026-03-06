"""
FastAPI backend for Gold Investment Dashboard.
"""
import json
import logging
import sys
from contextlib import asynccontextmanager
from datetime import date, datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from config import DB_PATH, ANTHROPIC_API_KEY
from models import get_conn, init_db
from scheduler import run_daily_tasks, save_snapshot, start_scheduler, stop_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing Gold Dashboard...")
    init_db()
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Gold Investment Dashboard API",
    version="1.0.0",
    description="AI-powered gold investment dashboard for bank 积存金 products",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Models ───────────────────────────────────────────────────────────

class PositionCreate(BaseModel):
    bank: str
    product: str = "积存金"
    open_date: str
    open_price: float
    grams: float
    amount_cny: float
    fee_cny: float = 0.0
    notes: Optional[str] = None


class PositionClose(BaseModel):
    close_date: str
    close_price: float


class TradingPlanCreate(BaseModel):
    title: str
    plan_type: str   # buy|sell|stop_loss|take_profit
    bank: Optional[str] = None
    target_price: float
    target_grams: Optional[float] = None
    target_amount: Optional[float] = None
    condition: Optional[str] = None
    notes: Optional[str] = None


class AlertCreate(BaseModel):
    alert_type: str   # above|below
    price_type: str   # domestic|international|bank_icbc|...
    threshold: float
    message: Optional[str] = None


class ReviewCreate(BaseModel):
    review_date: str
    title: Optional[str] = None
    content: str
    mood: Optional[str] = None
    action_taken: Optional[str] = None


class CalendarEventCreate(BaseModel):
    event_date: str
    event_time: Optional[str] = None
    country: Optional[str] = None
    event_name: str
    importance: str = "medium"
    forecast: Optional[str] = None
    previous: Optional[str] = None


# ── Price / Market Data ───────────────────────────────────────────────────────

@app.get("/api/prices/latest")
def get_latest_price():
    """Get the most recent price snapshot."""
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM price_snapshots ORDER BY ts DESC LIMIT 1"
        ).fetchone()
        if not row:
            return {"data": None, "message": "No price data yet. Click 'Refresh' to fetch."}
        data = dict(row)
        # Don't send raw_json to frontend (too large)
        data.pop("raw_json", None)
        return {"data": data}
    finally:
        conn.close()


@app.get("/api/prices/history")
def get_price_history(days: int = 30):
    """Get price history for charting."""
    conn = get_conn()
    try:
        rows = conn.execute(
            """SELECT ts, intl_usd_oz, intl_cny_g, domestic_cny_g,
                      spread_cny_g, usd_cny_rate, dxy, us10y_yield
               FROM price_snapshots
               WHERE ts >= datetime('now', ?)
               ORDER BY ts ASC""",
            (f"-{days} days",)
        ).fetchall()
        return {"data": [dict(r) for r in rows]}
    finally:
        conn.close()


@app.post("/api/prices/refresh")
async def refresh_prices(background_tasks: BackgroundTasks):
    """Manually trigger a price refresh."""
    background_tasks.add_task(_refresh_prices_task)
    return {"message": "Price refresh started in background"}


async def _refresh_prices_task():
    from data_fetcher import build_snapshot
    try:
        snap = build_snapshot()
        save_snapshot(snap)
        logger.info(f"Manual refresh done: {snap.get('intl_usd_oz')} USD/oz")
    except Exception as e:
        logger.error(f"Manual refresh failed: {e}")


# ── Daily Brief ───────────────────────────────────────────────────────────────

@app.get("/api/brief/today")
def get_today_brief():
    """Get today's AI-generated brief."""
    today = date.today().isoformat()
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM daily_briefs WHERE date=?", (today,)
        ).fetchone()
        if not row:
            return {"data": None, "message": "今日简报尚未生成。请点击"生成简报"按钮。"}
        data = dict(row)
        # Parse key_risks JSON
        try:
            data["key_risks"] = json.loads(data.get("key_risks") or "[]")
        except Exception:
            data["key_risks"] = []
        return {"data": data}
    finally:
        conn.close()


@app.get("/api/brief/history")
def get_brief_history(limit: int = 30):
    """Get recent daily briefs."""
    conn = get_conn()
    try:
        rows = conn.execute(
            """SELECT date, recommendation, market_summary, price_range_low,
                      price_range_high, generated_at
               FROM daily_briefs ORDER BY date DESC LIMIT ?""",
            (limit,)
        ).fetchall()
        return {"data": [dict(r) for r in rows]}
    finally:
        conn.close()


@app.post("/api/brief/generate")
async def generate_brief(background_tasks: BackgroundTasks):
    """Manually trigger AI brief generation for today."""
    if not ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=400,
            detail="ANTHROPIC_API_KEY 未配置。请在 .env 文件中设置 API Key。"
        )
    background_tasks.add_task(_generate_brief_task)
    return {"message": "AI 简报生成中，请稍后刷新..."}


async def _generate_brief_task():
    from data_fetcher import build_snapshot, fetch_news_headlines, fetch_economic_calendar_events
    from scheduler import generate_and_save_brief
    try:
        snap = build_snapshot()
        save_snapshot(snap)
        news = fetch_news_headlines()
        calendar = fetch_economic_calendar_events()
        generate_and_save_brief(snap, news, calendar)
    except Exception as e:
        logger.error(f"Brief generation task failed: {e}")


# ── Positions ─────────────────────────────────────────────────────────────────

@app.get("/api/positions")
def get_positions():
    conn = get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM positions ORDER BY open_date DESC"
        ).fetchall()
        positions = [dict(r) for r in rows]

        # Calculate floating P&L
        latest = conn.execute(
            "SELECT domestic_cny_g FROM price_snapshots ORDER BY ts DESC LIMIT 1"
        ).fetchone()
        current_price = latest["domestic_cny_g"] if latest else None

        total_grams = 0
        total_cost = 0
        total_value = 0
        for p in positions:
            if p["status"] == "open":
                total_grams += p["grams"]
                total_cost += p["amount_cny"]
                if current_price:
                    p["current_value"] = round(p["grams"] * current_price, 2)
                    p["floating_pnl"] = round(p["current_value"] - p["amount_cny"], 2)
                    p["floating_pnl_pct"] = round(
                        (p["current_value"] - p["amount_cny"]) / p["amount_cny"] * 100, 2
                    )
                    total_value += p["current_value"]

        avg_cost = total_cost / total_grams if total_grams > 0 else 0
        summary = {
            "total_grams": round(total_grams, 4),
            "total_cost_cny": round(total_cost, 2),
            "avg_cost_per_gram": round(avg_cost, 2),
            "current_price": current_price,
            "total_value": round(total_value, 2) if total_value else None,
            "total_pnl": round(total_value - total_cost, 2) if total_value else None,
            "total_pnl_pct": round((total_value - total_cost) / total_cost * 100, 2)
                             if total_value and total_cost else None,
        }
        return {"data": positions, "summary": summary}
    finally:
        conn.close()


@app.post("/api/positions")
def add_position(pos: PositionCreate):
    conn = get_conn()
    try:
        c = conn.cursor()
        c.execute("""
            INSERT INTO positions
            (bank, product, open_date, open_price, grams, amount_cny, fee_cny, notes)
            VALUES (?,?,?,?,?,?,?,?)
        """, (pos.bank, pos.product, pos.open_date, pos.open_price,
              pos.grams, pos.amount_cny, pos.fee_cny, pos.notes))
        conn.commit()
        return {"id": c.lastrowid, "message": "持仓添加成功"}
    finally:
        conn.close()


@app.put("/api/positions/{position_id}/close")
def close_position(position_id: int, data: PositionClose):
    conn = get_conn()
    try:
        row = conn.execute("SELECT * FROM positions WHERE id=?", (position_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="持仓不存在")
        pos = dict(row)
        pnl = round((data.close_price - pos["open_price"]) * pos["grams"] - pos["fee_cny"], 2)
        conn.execute("""
            UPDATE positions SET status='closed', close_date=?, close_price=?, pnl_cny=?
            WHERE id=?
        """, (data.close_date, data.close_price, pnl, position_id))
        conn.commit()
        return {"message": "持仓已平仓", "pnl_cny": pnl}
    finally:
        conn.close()


@app.delete("/api/positions/{position_id}")
def delete_position(position_id: int):
    conn = get_conn()
    try:
        conn.execute("DELETE FROM positions WHERE id=?", (position_id,))
        conn.commit()
        return {"message": "持仓已删除"}
    finally:
        conn.close()


# ── Trading Plans ──────────────────────────────────────────────────────────────

@app.get("/api/plans")
def get_plans():
    conn = get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM trading_plans ORDER BY created_at DESC"
        ).fetchall()
        return {"data": [dict(r) for r in rows]}
    finally:
        conn.close()


@app.post("/api/plans")
def create_plan(plan: TradingPlanCreate):
    conn = get_conn()
    try:
        c = conn.cursor()
        c.execute("""
            INSERT INTO trading_plans
            (title, plan_type, bank, target_price, target_grams, target_amount, condition, notes)
            VALUES (?,?,?,?,?,?,?,?)
        """, (plan.title, plan.plan_type, plan.bank, plan.target_price,
              plan.target_grams, plan.target_amount, plan.condition, plan.notes))
        conn.commit()
        return {"id": c.lastrowid, "message": "交易计划已创建"}
    finally:
        conn.close()


@app.put("/api/plans/{plan_id}/status")
def update_plan_status(plan_id: int, status: str):
    valid = {"active", "triggered", "cancelled", "completed"}
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"状态必须是: {valid}")
    conn = get_conn()
    try:
        conn.execute("UPDATE trading_plans SET status=? WHERE id=?", (status, plan_id))
        conn.commit()
        return {"message": "状态已更新"}
    finally:
        conn.close()


@app.delete("/api/plans/{plan_id}")
def delete_plan(plan_id: int):
    conn = get_conn()
    try:
        conn.execute("DELETE FROM trading_plans WHERE id=?", (plan_id,))
        conn.commit()
        return {"message": "交易计划已删除"}
    finally:
        conn.close()


# ── Price Alerts ───────────────────────────────────────────────────────────────

@app.get("/api/alerts")
def get_alerts():
    conn = get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM price_alerts ORDER BY created_at DESC"
        ).fetchall()
        return {"data": [dict(r) for r in rows]}
    finally:
        conn.close()


@app.post("/api/alerts")
def create_alert(alert: AlertCreate):
    conn = get_conn()
    try:
        c = conn.cursor()
        c.execute("""
            INSERT INTO price_alerts (alert_type, price_type, threshold, message)
            VALUES (?,?,?,?)
        """, (alert.alert_type, alert.price_type, alert.threshold, alert.message))
        conn.commit()
        return {"id": c.lastrowid, "message": "价格预警已创建"}
    finally:
        conn.close()


@app.delete("/api/alerts/{alert_id}")
def delete_alert(alert_id: int):
    conn = get_conn()
    try:
        conn.execute("DELETE FROM price_alerts WHERE id=?", (alert_id,))
        conn.commit()
        return {"message": "预警已删除"}
    finally:
        conn.close()


# ── Strategy Reviews ────────────────────────────────────────────────────────────

@app.get("/api/reviews")
def get_reviews(limit: int = 30):
    conn = get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM strategy_reviews ORDER BY review_date DESC LIMIT ?", (limit,)
        ).fetchall()
        return {"data": [dict(r) for r in rows]}
    finally:
        conn.close()


@app.post("/api/reviews")
def create_review(review: ReviewCreate):
    conn = get_conn()
    try:
        c = conn.cursor()
        c.execute("""
            INSERT INTO strategy_reviews
            (review_date, title, content, mood, action_taken)
            VALUES (?,?,?,?,?)
        """, (review.review_date, review.title, review.content,
              review.mood, review.action_taken))
        conn.commit()
        return {"id": c.lastrowid, "message": "复盘记录已保存"}
    finally:
        conn.close()


@app.delete("/api/reviews/{review_id}")
def delete_review(review_id: int):
    conn = get_conn()
    try:
        conn.execute("DELETE FROM strategy_reviews WHERE id=?", (review_id,))
        conn.commit()
        return {"message": "复盘记录已删除"}
    finally:
        conn.close()


# ── Economic Calendar ─────────────────────────────────────────────────────────

@app.get("/api/calendar")
def get_calendar(days: int = 7):
    conn = get_conn()
    try:
        rows = conn.execute(
            """SELECT * FROM economic_calendar
               WHERE event_date >= date('now')
               AND event_date <= date('now', ?)
               ORDER BY event_date ASC, importance DESC""",
            (f"+{days} days",)
        ).fetchall()
        return {"data": [dict(r) for r in rows]}
    finally:
        conn.close()


@app.post("/api/calendar")
def add_calendar_event(event: CalendarEventCreate):
    conn = get_conn()
    try:
        c = conn.cursor()
        c.execute("""
            INSERT INTO economic_calendar
            (event_date, event_time, country, event_name, importance, forecast, previous)
            VALUES (?,?,?,?,?,?,?)
        """, (event.event_date, event.event_time, event.country, event.event_name,
              event.importance, event.forecast, event.previous))
        conn.commit()
        return {"id": c.lastrowid, "message": "事件已添加"}
    finally:
        conn.close()


# ── AI Analysis ────────────────────────────────────────────────────────────────

@app.post("/api/ai/position-analysis")
async def analyze_positions():
    """Generate AI analysis of current positions."""
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=400, detail="ANTHROPIC_API_KEY 未配置")

    conn = get_conn()
    try:
        positions = [dict(r) for r in conn.execute(
            "SELECT * FROM positions WHERE status='open'"
        ).fetchall()]
        latest = conn.execute(
            "SELECT domestic_cny_g FROM price_snapshots ORDER BY ts DESC LIMIT 1"
        ).fetchone()
    finally:
        conn.close()

    current_price = latest["domestic_cny_g"] if latest else 0

    from ai_analyzer import generate_position_analysis
    analysis = generate_position_analysis(positions, current_price)
    return {"analysis": analysis}


# ── System Status ─────────────────────────────────────────────────────────────

@app.get("/api/status")
def get_status():
    conn = get_conn()
    try:
        snapshot_count = conn.execute("SELECT COUNT(*) FROM price_snapshots").fetchone()[0]
        brief_count = conn.execute("SELECT COUNT(*) FROM daily_briefs").fetchone()[0]
        position_count = conn.execute(
            "SELECT COUNT(*) FROM positions WHERE status='open'"
        ).fetchone()[0]
        latest_ts = conn.execute(
            "SELECT ts FROM price_snapshots ORDER BY ts DESC LIMIT 1"
        ).fetchone()
        return {
            "status": "ok",
            "api_key_configured": bool(ANTHROPIC_API_KEY),
            "db_path": str(DB_PATH),
            "snapshot_count": snapshot_count,
            "brief_count": brief_count,
            "open_positions": position_count,
            "latest_data_ts": latest_ts[0] if latest_ts else None,
        }
    finally:
        conn.close()


# ── Static Files ──────────────────────────────────────────────────────────────

import os
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="static")

    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
