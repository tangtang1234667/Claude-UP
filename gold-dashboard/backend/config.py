"""
Configuration settings for Gold Investment Dashboard.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent

# Database
DB_PATH = BASE_DIR / "data" / "gold_dashboard.db"

# API Keys (set via environment variables or .env file)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Claude model
CLAUDE_MODEL = "claude-sonnet-4-6"

# Gold price data sources (free, no API key needed)
GOLD_API_SOURCES = {
    # Yahoo Finance via yfinance
    "international_spot": "GC=F",          # COMEX Gold Futures (USD/oz)
    "international_spot_etf": "GLD",        # SPDR Gold ETF as proxy
    # China domestic via public endpoints
    "cny_usd_pair": "CNYUSD=X",
}

# Scheduler
DAILY_BRIEF_HOUR = 8     # 8:00 AM
DAILY_BRIEF_MINUTE = 30

# Price alert thresholds (percentage)
ALERT_THRESHOLD_PCT = 1.0  # Alert if price moves >1% from target

# Supported banks for 积存金 (gold accumulation) quotes
BANK_ACCUMULATION_PRODUCTS = [
    {"bank": "工商银行", "code": "ICBC", "product": "积存金"},
    {"bank": "建设银行", "code": "CCB",  "product": "龙鼎金"},
    {"bank": "中国银行", "code": "BOC",  "product": "积存金"},
    {"bank": "农业银行", "code": "ABC",  "product": "金钥匙·积存金"},
    {"bank": "招商银行", "code": "CMB",  "product": "招财金"},
]

# Geopolitical / macro data keywords for news scraping
MACRO_KEYWORDS = [
    "Fed interest rate", "美联储 利率",
    "US inflation CPI", "美国通胀",
    "Dollar index DXY", "美元指数",
    "Central bank gold reserve", "央行购金",
    "Gold ETF holdings", "黄金ETF持仓",
    "Geopolitical risk", "地缘政治",
    "US Treasury yield", "美债收益率",
    "China gold price", "国内金价",
]
