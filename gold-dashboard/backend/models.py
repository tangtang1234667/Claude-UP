"""
SQLite database models for Gold Investment Dashboard.
Uses plain sqlite3 for zero-dependency simplicity.
"""
import sqlite3
import json
from datetime import datetime
from config import DB_PATH


def get_conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_conn()
    c = conn.cursor()

    # ── Gold price snapshots ───────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS price_snapshots (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        ts            TEXT    NOT NULL,          -- ISO datetime
        intl_usd_oz   REAL,                      -- international spot USD/oz
        intl_cny_g    REAL,                      -- international spot CNY/g (converted)
        domestic_cny_g REAL,                     -- Shanghai Gold Exchange AU9999
        spread_cny_g  REAL,                      -- domestic - international (CNY/g)
        usd_cny_rate  REAL,                      -- USD/CNY exchange rate
        -- Bank 积存金 quotes (buy price CNY/g)
        icbc_buy      REAL,
        ccb_buy       REAL,
        boc_buy       REAL,
        abc_buy       REAL,
        cmb_buy       REAL,
        -- Macro indicators
        dxy           REAL,                      -- Dollar index
        us10y_yield   REAL,                      -- US 10-year Treasury yield %
        spx           REAL,                      -- S&P 500
        -- Data quality
        source        TEXT,
        raw_json      TEXT                       -- full raw payload for debugging
    )
    """)

    # ── Macro & sentiment data ────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS macro_data (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        ts         TEXT NOT NULL,
        category   TEXT NOT NULL,   -- 'central_bank','etf_flow','geopolitical','economic_calendar'
        title      TEXT NOT NULL,
        value      TEXT,            -- numeric value or descriptive text
        unit       TEXT,
        impact     TEXT,            -- 'bullish'|'bearish'|'neutral'
        source_url TEXT,
        raw_json   TEXT
    )
    """)

    # ── AI daily brief ────────────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS daily_briefs (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        date            TEXT NOT NULL UNIQUE,   -- YYYY-MM-DD
        generated_at    TEXT NOT NULL,
        market_summary  TEXT,                   -- overall market env
        price_analysis  TEXT,                   -- why prices moved
        recommendation  TEXT,                   -- HOLD|BUY|SELL|WAIT
        rec_reason      TEXT,
        price_range_low REAL,
        price_range_high REAL,
        key_risks       TEXT,                   -- JSON array of risk strings
        full_brief      TEXT,                   -- full markdown brief
        input_snapshot_id INTEGER,
        model_used      TEXT
    )
    """)

    # ── Personal positions (积存金持仓) ───────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS positions (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        bank         TEXT NOT NULL,
        product      TEXT NOT NULL,
        open_date    TEXT NOT NULL,
        open_price   REAL NOT NULL,   -- CNY/g at purchase
        grams        REAL NOT NULL,   -- grams purchased
        amount_cny   REAL NOT NULL,   -- total CNY invested
        fee_cny      REAL DEFAULT 0,
        notes        TEXT,
        status       TEXT DEFAULT 'open',  -- open|closed
        close_date   TEXT,
        close_price  REAL,
        pnl_cny      REAL,
        created_at   TEXT DEFAULT (datetime('now'))
    )
    """)

    # ── Trading plans ─────────────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS trading_plans (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        title         TEXT NOT NULL,
        plan_type     TEXT NOT NULL,    -- 'buy'|'sell'|'stop_loss'|'take_profit'
        bank          TEXT,
        target_price  REAL NOT NULL,   -- CNY/g trigger price
        target_grams  REAL,
        target_amount REAL,            -- CNY
        condition     TEXT,            -- plain-text condition description
        status        TEXT DEFAULT 'active',  -- active|triggered|cancelled|completed
        triggered_at  TEXT,
        notes         TEXT,
        created_at    TEXT DEFAULT (datetime('now'))
    )
    """)

    # ── Price alerts ─────────────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS price_alerts (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_type  TEXT NOT NULL,    -- 'above'|'below'|'change_pct'
        price_type  TEXT NOT NULL,    -- 'domestic'|'international'|'bank_icbc'|...
        threshold   REAL NOT NULL,
        message     TEXT,
        status      TEXT DEFAULT 'active',   -- active|triggered|snoozed|disabled
        triggered_at TEXT,
        created_at  TEXT DEFAULT (datetime('now'))
    )
    """)

    # ── Strategy review / journal ─────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS strategy_reviews (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        review_date TEXT NOT NULL,
        title       TEXT,
        content     TEXT NOT NULL,     -- markdown journal entry
        mood        TEXT,              -- 'confident'|'cautious'|'anxious'|'neutral'
        action_taken TEXT,             -- what trade if any was executed
        outcome     TEXT,              -- reflection after the fact
        created_at  TEXT DEFAULT (datetime('now'))
    )
    """)

    # ── Economic calendar events ──────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS economic_calendar (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        event_date   TEXT NOT NULL,
        event_time   TEXT,
        country      TEXT,
        event_name   TEXT NOT NULL,
        importance   TEXT,   -- 'high'|'medium'|'low'
        forecast     TEXT,
        previous     TEXT,
        actual       TEXT,
        impact       TEXT,   -- 'bullish'|'bearish'|'neutral' after release
        source       TEXT,
        created_at   TEXT DEFAULT (datetime('now'))
    )
    """)

    conn.commit()
    conn.close()
    print("[DB] Initialized successfully.")


if __name__ == "__main__":
    init_db()
