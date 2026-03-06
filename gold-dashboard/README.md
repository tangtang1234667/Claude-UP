# 黄金积存金投资看板

一个面向**银行积存金**产品的 AI 智能投资数据看板，基于 Claude AI 每日生成黄金市场简报，提供持仓管理、交易计划和价格预警功能。

## 功能特性

### 📊 市场数据看板
- **国际金价**（COMEX 期货、现货，USD/oz 与 CNY/g 双显）
- **国内金价**（上海黄金交易所 AU9999 实时报价）
- **银行积存金报价**（工、建、中、农、招商银行买入价）
- **内外价差**（国内溢价实时计算）
- **宏观指标**：美元指数 DXY、美10年期国债收益率、标普500
- **历史走势图**（7/30/90天折线图）

### 🤖 AI 黄金日报（Claude Sonnet）
每日自动生成，包含：
- 市场环境判断（牛市/震荡/熊市）
- 涨跌原因解析（数据驱动）
- **个性化建议**：结合您的持仓成本给出 **持有 / 分批买入 / 分批减仓 / 观望** 四档建议
- 未来5-7日价格区间预测
- 关键风险事件提示
- 完整 Markdown 格式简报

### 💼 持仓管理
- 多银行、多产品持仓记录（积存金、龙鼎金、招财金等）
- 实时浮盈亏计算（按当前国内金价）
- 综合持仓成本与总收益统计
- AI 一键分析持仓

### 📋 交易计划
- 创建分批买入/减仓/止损/止盈计划
- 设置目标价格与触发条件
- 计划状态跟踪（进行中/已触发/完成/取消）

### 🔔 价格预警
- 国内现货、国际金价、各银行积存金价格预警
- 高于/低于目标价自动触发
- 与每次数据刷新同步检查

### 📅 经济日历
- 重大经济事件录入（美联储议息、CPI、非农数据等）
- 重要性分级显示（高/中/低）
- 预测值与实际值对比

### 📝 策略复盘
- Markdown 格式日记
- 操作记录与心态追踪
- 历史复盘浏览

## 快速启动

### 环境要求
- Python 3.9+
- 现代浏览器

### 安装步骤

```bash
# 1. 进入项目目录
cd gold-dashboard

# 2. 配置 API Key（AI 功能需要）
cp .env.example .env
# 编辑 .env，填入 ANTHROPIC_API_KEY

# 3. 一键启动
chmod +x start.sh
./start.sh
```

浏览器访问: **http://localhost:8000**

### 手动安装

```bash
cd gold-dashboard
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cd backend
python -c "from models import init_db; init_db()"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 配置说明

`.env` 文件配置项：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `ANTHROPIC_API_KEY` | Claude API Key（必填，AI功能） | — |
| `HOST` | 服务监听地址 | `0.0.0.0` |
| `PORT` | 服务端口 | `8000` |
| `DAILY_BRIEF_HOUR` | 每日简报生成时间（时） | `8` |
| `DAILY_BRIEF_MINUTE` | 每日简报生成时间（分） | `30` |

## 数据来源

| 数据 | 来源 | 备注 |
|------|------|------|
| 国际金价 | goldprice.org / Yahoo Finance | 免费，无需 API Key |
| 美元/人民币汇率 | Yahoo Finance / Open Exchange Rates | 免费 |
| 国内金价 AU9999 | 新浪财经 / 估算 | 实时抓取或基于国际价格估算 |
| 宏观指标 DXY/US10Y/SPX | Yahoo Finance | 免费 |
| 银行积存金报价 | 基于 SGE 现货 + 典型点差估算 | 实际银行报价建议手动校对 |
| AI 分析 | Claude Sonnet (claude-sonnet-4-6) | 需要 API Key |

> **注意**：银行积存金报价采用典型点差估算（约5-8元/克），实际报价以各银行 App 为准。如需精确报价，建议定期手动更新。

## 项目结构

```
gold-dashboard/
├── backend/
│   ├── main.py          # FastAPI 应用入口
│   ├── models.py        # SQLite 数据库模型
│   ├── data_fetcher.py  # 价格数据抓取模块
│   ├── ai_analyzer.py   # Claude AI 分析模块
│   ├── scheduler.py     # 定时任务调度器
│   └── config.py        # 配置管理
├── frontend/
│   ├── index.html       # 单页面应用
│   └── assets/
│       ├── style.css    # 深色金融主题样式
│       └── app.js       # 前端交互逻辑
├── data/                # SQLite 数据库（自动创建）
├── requirements.txt     # Python 依赖
├── .env.example         # 环境变量模板
├── start.sh             # 一键启动脚本
└── README.md
```

## API 接口文档

启动服务后访问: **http://localhost:8000/docs**

主要接口：
- `GET  /api/prices/latest` — 最新价格快照
- `GET  /api/prices/history` — 历史价格数据
- `POST /api/prices/refresh` — 手动刷新数据
- `GET  /api/brief/today` — 今日 AI 日报
- `POST /api/brief/generate` — 手动触发日报生成
- `GET/POST /api/positions` — 持仓管理
- `GET/POST /api/plans` — 交易计划
- `GET/POST /api/alerts` — 价格预警
- `GET/POST /api/reviews` — 策略复盘
- `GET/POST /api/calendar` — 经济日历
