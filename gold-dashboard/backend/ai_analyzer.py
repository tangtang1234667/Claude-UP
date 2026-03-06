"""
AI analysis module using Claude API.
Generates daily gold market briefs and personalized investment recommendations.
"""
import json
import logging
from datetime import datetime, date
from typing import Optional

import anthropic

from config import ANTHROPIC_API_KEY, CLAUDE_MODEL

logger = logging.getLogger(__name__)


def get_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def generate_daily_brief(
    snapshot: dict,
    positions: list,
    recent_news: list,
    macro_events: list,
    economic_calendar: list,
    prev_brief: Optional[dict] = None,
) -> dict:
    """
    Use Claude to generate a comprehensive daily gold market brief
    with personalized holding recommendations.

    Returns a dict with keys:
        market_summary, price_analysis, recommendation, rec_reason,
        price_range_low, price_range_high, key_risks, full_brief
    """
    # Build position context
    position_context = _build_position_context(positions)

    # Build market data context
    market_context = _build_market_context(snapshot)

    # Build news context
    news_context = _build_news_context(recent_news, macro_events)

    # Build calendar context
    calendar_context = _build_calendar_context(economic_calendar)

    # Previous brief context for continuity
    prev_context = ""
    if prev_brief:
        prev_context = f"""
## 昨日简报回顾
- 昨日建议: {prev_brief.get('recommendation', 'N/A')}
- 昨日判断: {prev_brief.get('market_summary', 'N/A')}
- 昨日价格区间预测: {prev_brief.get('price_range_low', 'N/A')} - {prev_brief.get('price_range_high', 'N/A')} CNY/g
"""

    today = date.today().strftime("%Y年%m月%d日")

    system_prompt = """你是一位专业的黄金投资分析师，专注于中国银行积存金（定投黄金）市场。
你的分析风格：严谨、客观、数据驱动，同时能用通俗语言解释复杂金融概念。
你深度理解：
- 国际黄金市场（伦敦现货、COMEX期货）与国内上海黄金交易所的联动
- 人民币汇率对国内金价的影响
- 美联储政策、美元指数、实际利率与黄金价格的关系
- 银行积存金产品特性：无杠杆、长期定投、适合普通投资者
- 地缘政治、央行购金、ETF资金流向等影响因素

重要原则：
1. 建议必须匹配投资者的实际持仓成本和持仓规模
2. 对于银行积存金，考虑其流动性较低、适合中长期持有的特点
3. 提示关键风险，但不制造恐慌
4. 价格区间要合理，基于技术面和基本面综合判断"""

    user_prompt = f"""请生成{today}的黄金市场日报。

{market_context}

{position_context}

{news_context}

{calendar_context}

{prev_context}

请按以下JSON格式输出（确保是合法JSON）：
{{
    "market_summary": "市场环境概述（2-3句话，说明当前是牛市/震荡/熊市阶段及主要驱动力）",
    "price_analysis": "今日涨跌分析（3-5句话，解释价格变动原因，引用具体数据）",
    "recommendation": "HOLD|BUY|SELL|WAIT（四选一，大写英文）",
    "rec_reason": "建议理由（结合我的持仓成本，3-5句话）",
    "price_range_low": 数字（未来5-7个交易日国内金价CNY/g下沿，不加引号）,
    "price_range_high": 数字（未来5-7个交易日国内金价CNY/g上沿，不加引号）,
    "key_risks": ["风险1", "风险2", "风险3"],
    "full_brief": "完整日报正文（Markdown格式，包含：市场概览、涨跌原因、宏观面分析、技术面简析、持仓建议、风险提示、明日关注事项）"
}}

注意：
- recommendation字段仅限 HOLD/BUY/SELL/WAIT 四个值
- BUY = 建议分批买入积存金
- SELL = 建议分批减仓
- HOLD = 建议持有不动
- WAIT = 建议观望等待更好时机
- price_range_low 和 price_range_high 必须是纯数字（CNY/g）"""

    try:
        client = get_client()
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        content = response.content[0].text.strip()

        # Extract JSON from response
        result = _extract_json(content)
        if result:
            result["model_used"] = CLAUDE_MODEL
            result["generated_at"] = datetime.utcnow().isoformat()
            # Ensure full_brief is populated even if parsing issues
            if "full_brief" not in result:
                result["full_brief"] = content
            return result
        else:
            # Return raw content as fallback
            return {
                "market_summary": "AI生成失败，请查看完整简报",
                "price_analysis": "",
                "recommendation": "WAIT",
                "rec_reason": "数据解析异常，建议观望",
                "price_range_low": None,
                "price_range_high": None,
                "key_risks": ["AI分析服务异常"],
                "full_brief": content,
                "model_used": CLAUDE_MODEL,
                "generated_at": datetime.utcnow().isoformat(),
            }
    except Exception as e:
        logger.error(f"Claude API error: {e}")
        raise


def generate_position_analysis(positions: list, current_price: float) -> str:
    """Generate a detailed position analysis for the portfolio."""
    if not positions:
        return "暂无持仓数据"

    position_context = _build_position_context(positions)

    prompt = f"""作为黄金投资顾问，请分析以下积存金持仓情况：

当前国内金价：{current_price} CNY/g

{position_context}

请用中文提供：
1. 持仓盈亏分析（每笔持仓的浮盈/浮亏）
2. 综合持仓成本与当前盈亏
3. 风险敞口评估
4. 简短建议（1-2句话）

格式：清晰、简洁，数据准确"""

    try:
        client = get_client()
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text.strip()
    except Exception as e:
        logger.error(f"Position analysis error: {e}")
        return f"分析生成失败: {str(e)}"


def generate_risk_event_summary(upcoming_events: list) -> str:
    """Summarize upcoming risk events and their potential impact on gold."""
    if not upcoming_events:
        return "未检测到重大风险事件"

    events_text = "\n".join([
        f"- {e.get('event_date','')} {e.get('event_name','')} (重要性: {e.get('importance','')})"
        for e in upcoming_events[:10]
    ])

    prompt = f"""请分析以下未来7天的重大经济事件对黄金价格的潜在影响：

{events_text}

请用中文简洁说明：
1. 哪些事件最可能影响金价（1-3个）
2. 可能的影响方向（利多/利空/不确定）
3. 建议关注的时间节点

保持简洁，总共不超过200字"""

    try:
        client = get_client()
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text.strip()
    except Exception as e:
        logger.error(f"Risk event analysis error: {e}")
        return "风险事件分析失败"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_market_context(snapshot: dict) -> str:
    domestic = snapshot.get("domestic_cny_g")
    intl_usd = snapshot.get("intl_usd_oz")
    intl_cny = snapshot.get("intl_cny_g")
    spread   = snapshot.get("spread_cny_g")
    usd_cny  = snapshot.get("usd_cny_rate")
    dxy      = snapshot.get("dxy")
    us10y    = snapshot.get("us10y_yield")
    spx      = snapshot.get("spx")

    return f"""## 当前市场数据（{snapshot.get('ts', '')[:10]}）

### 金价
- 国际金价: {intl_usd} USD/oz ({intl_cny} CNY/g)
- 国内现货(AU9999): {domestic} CNY/g
- 国内外价差: {spread} CNY/g
- 美元/人民币: {usd_cny}

### 银行积存金报价（买入价 CNY/g）
- 工商银行: {snapshot.get('icbc_buy')}
- 建设银行: {snapshot.get('ccb_buy')}
- 中国银行: {snapshot.get('boc_buy')}
- 农业银行: {snapshot.get('abc_buy')}
- 招商银行: {snapshot.get('cmb_buy')}

### 宏观指标
- 美元指数(DXY): {dxy}
- 美国10年期国债收益率: {us10y}%
- 标普500: {spx}"""


def _build_position_context(positions: list) -> str:
    if not positions:
        return "## 持仓情况\n暂无持仓记录"

    total_grams = sum(p.get("grams", 0) for p in positions if p.get("status") == "open")
    total_cost  = sum(p.get("amount_cny", 0) for p in positions if p.get("status") == "open")
    avg_cost    = total_cost / total_grams if total_grams > 0 else 0

    lines = ["## 我的持仓情况\n"]
    lines.append(f"综合持仓: {total_grams:.2f}g，总成本: {total_cost:.2f}元，平均成本: {avg_cost:.2f} CNY/g\n")
    lines.append("| 银行 | 克数 | 买入价 | 买入金额 | 日期 |")
    lines.append("|------|------|--------|---------|------|")
    for p in positions:
        if p.get("status") == "open":
            lines.append(
                f"| {p.get('bank','')} | {p.get('grams',0):.2f}g | "
                f"{p.get('open_price',0):.2f} | {p.get('amount_cny',0):.2f}元 | "
                f"{p.get('open_date','')} |"
            )
    return "\n".join(lines)


def _build_news_context(news: list, macro_events: list) -> str:
    if not news and not macro_events:
        return "## 最新资讯\n暂无最新资讯"

    lines = ["## 最新资讯（近24小时）"]
    for item in news[:8]:
        lines.append(f"- **{item.get('source','')}**: {item.get('title','')}")
        if item.get("summary"):
            lines.append(f"  > {item['summary'][:150]}")
    return "\n".join(lines)


def _build_calendar_context(events: list) -> str:
    if not events:
        return "## 经济日历\n近期暂无重大经济数据"

    lines = ["## 未来7天重大经济日历"]
    for e in events[:10]:
        importance = e.get("importance", "")
        star = "🔴" if importance == "high" else ("🟡" if importance == "medium" else "⚪")
        lines.append(
            f"- {star} {e.get('event_date','')} {e.get('event_name','')} "
            f"| 预期: {e.get('forecast','N/A')} | 前值: {e.get('previous','N/A')}"
        )
    return "\n".join(lines)


def _extract_json(text: str) -> Optional[dict]:
    """Extract JSON object from Claude's response text."""
    import re
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to find JSON block in markdown
    patterns = [
        r'```json\s*([\s\S]+?)\s*```',
        r'```\s*([\s\S]+?)\s*```',
        r'(\{[\s\S]+\})',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.MULTILINE)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                continue
    return None
