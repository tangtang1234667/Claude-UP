"""
Data fetcher for gold prices, FX rates, macro indicators, and news.

Sources used (all free / no API key required by default):
  - yfinance          : GC=F (COMEX gold futures), CNY=X, DXY, ^TNX, ^GSPC
  - investpy / pandas : economic calendar (optional)
  - requests          : public JSON endpoints for SGE / bank quotes
  - feedparser        : RSS news for macro/geopolitical headlines
"""
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Optional

import requests

logger = logging.getLogger(__name__)

# ─── Constants ────────────────────────────────────────────────────────────────
TROY_OZ_TO_GRAM = 31.1035  # 1 troy oz = 31.1035 g

# Public endpoints (no API key, best-effort)
YAHOO_QUERY_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=5d"
# Metals API (free tier) - returns latest XAU price in various currencies
# Fallback public gold price endpoint
GOLD_PRICE_API = "https://data-asg.goldprice.org/dbXRates/USD"

# SGE (上海黄金交易所) public price feed (best-effort scrape)
SGE_URL = "https://www.sge.com.cn/sjzx/mrhqsj"  # May require browser headers


def fetch_yahoo(symbol: str) -> Optional[dict]:
    """Fetch latest OHLCV from Yahoo Finance."""
    url = YAHOO_QUERY_URL.format(symbol=symbol)
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; GoldDashboard/1.0)",
        "Accept": "application/json",
    }
    try:
        r = requests.get(url, headers=headers, timeout=15)
        r.raise_for_status()
        data = r.json()
        result = data["chart"]["result"][0]
        meta = result["meta"]
        return {
            "symbol": symbol,
            "price": meta.get("regularMarketPrice") or meta.get("previousClose"),
            "currency": meta.get("currency", "USD"),
            "exchange": meta.get("exchangeName", ""),
            "ts": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.warning(f"Yahoo fetch failed for {symbol}: {e}")
        return None


def fetch_gold_price_api() -> Optional[dict]:
    """
    Fetch spot gold price from goldprice.org data API.
    Returns price in USD/oz and CNY.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
            "Referer": "https://goldprice.org/",
        }
        r = requests.get(GOLD_PRICE_API, headers=headers, timeout=15)
        r.raise_for_status()
        data = r.json()
        # Structure: {"ts":..., "tsj":..., "date":..., "items":[{"curr":"USD","xauPrice":...,"xagPrice":...,"chgXau":...},...]}
        items = {i["curr"]: i for i in data.get("items", [])}
        usd_item = items.get("USD", {})
        cny_item = items.get("CNY", {})
        return {
            "xau_usd_oz": usd_item.get("xauPrice"),
            "xau_cny_oz": cny_item.get("xauPrice"),
            "usd_change_pct": usd_item.get("chgXau"),
            "ts": datetime.utcnow().isoformat(),
            "source": "goldprice.org",
        }
    except Exception as e:
        logger.warning(f"goldprice.org fetch failed: {e}")
        return None


def fetch_fx_rate() -> Optional[float]:
    """
    Fetch USD/CNY exchange rate from Yahoo Finance (CNY=X).
    Returns float CNY per 1 USD.
    """
    result = fetch_yahoo("CNY=X")
    if result and result.get("price"):
        return result["price"]
    # Fallback: open exchange rates (free, no key for latest may be limited)
    try:
        r = requests.get(
            "https://open.er-api.com/v6/latest/USD",
            timeout=10,
        )
        data = r.json()
        return data["rates"].get("CNY")
    except Exception as e:
        logger.warning(f"FX rate fallback failed: {e}")
        return None


def build_snapshot() -> dict:
    """
    Fetch all price data and return a unified snapshot dict.
    """
    ts = datetime.utcnow().isoformat()
    snapshot = {"ts": ts, "source": "multi", "raw_json": {}}

    # 1. International gold spot (USD/oz) ─ try goldprice.org first
    gold_data = fetch_gold_price_api()
    intl_usd_oz = None
    if gold_data:
        intl_usd_oz = gold_data.get("xau_usd_oz")
        snapshot["raw_json"]["gold_api"] = gold_data

    # Fallback: Yahoo Finance GC=F futures
    if not intl_usd_oz:
        gc = fetch_yahoo("GC=F")
        if gc:
            intl_usd_oz = gc.get("price")
            snapshot["raw_json"]["gc_futures"] = gc

    snapshot["intl_usd_oz"] = intl_usd_oz

    # 2. USD/CNY exchange rate
    usd_cny = fetch_fx_rate()
    snapshot["usd_cny_rate"] = usd_cny

    # 3. Calculate international gold in CNY/g
    if intl_usd_oz and usd_cny:
        intl_cny_g = round(intl_usd_oz * usd_cny / TROY_OZ_TO_GRAM, 2)
    else:
        intl_cny_g = None
    snapshot["intl_cny_g"] = intl_cny_g

    # 4. Domestic gold price (CNY/g) — SGE AU9999
    #    Best-effort: try to get from a public source
    domestic_cny_g = fetch_sge_price(intl_cny_g)
    snapshot["domestic_cny_g"] = domestic_cny_g

    # 5. Price spread
    if domestic_cny_g and intl_cny_g:
        snapshot["spread_cny_g"] = round(domestic_cny_g - intl_cny_g, 2)
    else:
        snapshot["spread_cny_g"] = None

    # 6. Bank 积存金 quotes (estimated from domestic + spread)
    bank_quotes = estimate_bank_quotes(domestic_cny_g)
    snapshot.update(bank_quotes)

    # 7. Macro: DXY, US10Y, SPX
    macro = fetch_macro_indicators()
    snapshot.update(macro)
    snapshot["raw_json"]["macro"] = macro

    snapshot["raw_json"] = json.dumps(snapshot["raw_json"], ensure_ascii=False)
    return snapshot


def fetch_sge_price(intl_cny_g: Optional[float]) -> Optional[float]:
    """
    Attempt to fetch SGE AU9999 spot price.
    Falls back to: international price + typical domestic premium (~8-15 CNY/g).
    """
    # Try the Sina Finance API which provides domestic gold prices
    try:
        url = "https://hq.sinajs.cn/list=Au9999"
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://finance.sina.com.cn/",
        }
        r = requests.get(url, headers=headers, timeout=10)
        # Response format: var hq_str_Au9999="Au9999,xxx,yyy,..."
        text = r.text
        if "Au9999" in text:
            parts = text.split('"')[1].split(",")
            if len(parts) > 2:
                price = float(parts[1])  # current price CNY/g
                if price > 100:  # sanity check
                    return round(price, 2)
    except Exception as e:
        logger.debug(f"SGE Sina fetch failed: {e}")

    # Fallback: use international + typical premium
    if intl_cny_g:
        # Typical SGE domestic premium: 5-20 CNY/g (uses 10 as default)
        return round(intl_cny_g + 10.0, 2)
    return None


def estimate_bank_quotes(domestic_cny_g: Optional[float]) -> dict:
    """
    Estimate bank 积存金 buy prices based on domestic spot + bank spread.
    Real bank quotes require scraping individual bank apps/sites.
    These are typical spreads observed in practice.
    """
    if not domestic_cny_g:
        return {k: None for k in ["icbc_buy", "ccb_buy", "boc_buy", "abc_buy", "cmb_buy"]}

    # Typical 积存金 buy price = domestic spot + spread
    # Spreads vary: usually 5-20 CNY/g above SGE spot
    spreads = {
        "icbc_buy": 6.0,   # 工商银行
        "ccb_buy":  5.5,   # 建设银行
        "boc_buy":  6.5,   # 中国银行
        "abc_buy":  7.0,   # 农业银行
        "cmb_buy":  8.0,   # 招商银行
    }
    return {k: round(domestic_cny_g + v, 2) for k, v in spreads.items()}


def fetch_macro_indicators() -> dict:
    """Fetch DXY, US 10Y yield, S&P 500 from Yahoo Finance."""
    indicators = {}

    mappings = {
        "dxy": "DX-Y.NYB",
        "us10y_yield": "^TNX",
        "spx": "^GSPC",
    }
    for key, symbol in mappings.items():
        result = fetch_yahoo(symbol)
        if result:
            indicators[key] = result.get("price")
        else:
            indicators[key] = None
        time.sleep(0.3)  # gentle rate limit

    return indicators


def fetch_economic_calendar_events(days_ahead: int = 7) -> list:
    """
    Fetch upcoming high-impact economic events.
    Uses investing.com RSS or a simple public API.
    """
    events = []

    # Try investing.com economic calendar RSS
    rss_feeds = [
        "https://www.forexfactory.com/rss/feeds/calendar.xml",
        "https://rss.investing.com/rss/economic_calendar",
    ]

    for feed_url in rss_feeds:
        try:
            import feedparser
            feed = feedparser.parse(feed_url)
            for entry in feed.entries[:20]:
                events.append({
                    "title": entry.get("title", ""),
                    "published": entry.get("published", ""),
                    "summary": entry.get("summary", "")[:300],
                    "link": entry.get("link", ""),
                    "source": feed_url,
                })
            if events:
                break
        except Exception as e:
            logger.debug(f"RSS feed {feed_url} failed: {e}")

    return events


def fetch_news_headlines() -> list:
    """
    Fetch gold/macro related news from public RSS feeds.
    """
    headlines = []
    feeds = [
        ("Reuters Gold", "https://feeds.reuters.com/reuters/businessNews"),
        ("Kitco News",   "https://www.kitco.com/rss/kitcoNewsAll.xml"),
        ("FX Street",    "https://www.fxstreet.com/rss"),
    ]

    for name, url in feeds:
        try:
            import feedparser
            feed = feedparser.parse(url)
            for entry in feed.entries[:5]:
                title = entry.get("title", "")
                # Filter for gold/macro relevant
                keywords = ["gold", "黄金", "Fed", "inflation", "CPI", "dollar",
                            "central bank", "geopolit", "treasury", "yield"]
                if any(kw.lower() in title.lower() for kw in keywords):
                    headlines.append({
                        "source": name,
                        "title": title,
                        "published": entry.get("published", ""),
                        "summary": entry.get("summary", "")[:400],
                        "link": entry.get("link", ""),
                    })
        except Exception as e:
            logger.debug(f"News feed {name} failed: {e}")

    return headlines[:20]


def fetch_central_bank_data() -> list:
    """
    Fetch central bank gold reserve data from World Gold Council
    or public sources.
    """
    events = []
    # WGC publishes data but requires scraping; use a simplified approach
    try:
        # IMF Data (public)
        r = requests.get(
            "https://www.imf.org/en/About/Factsheets/RSS",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=10,
        )
        # Parse any relevant info
        if "gold" in r.text.lower():
            events.append({
                "category": "central_bank",
                "title": "IMF Gold Reserve Update",
                "source": "imf.org",
                "ts": datetime.utcnow().isoformat(),
            })
    except Exception:
        pass
    return events


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    print("Fetching price snapshot...")
    snap = build_snapshot()
    for k, v in snap.items():
        if k != "raw_json":
            print(f"  {k}: {v}")
