#!/bin/bash
# ── Gold Investment Dashboard Startup Script ─────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "══════════════════════════════════════════"
echo "  黄金积存金投资看板 · Gold Dashboard"
echo "══════════════════════════════════════════"

# Load .env if present
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
  echo "✓ 已加载 .env 配置"
else
  echo "⚠  未找到 .env 文件 (参考 .env.example)"
  echo "   AI 功能需要 ANTHROPIC_API_KEY"
fi

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "✗ 需要 Python 3.9+"
  exit 1
fi

# Create venv if needed
if [ ! -d "venv" ]; then
  echo "正在创建 Python 虚拟环境..."
  python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
echo "安装依赖包..."
pip install -q -r requirements.txt

# Initialize database
echo "初始化数据库..."
cd backend
python -c "from models import init_db; init_db()"

echo ""
echo "✓ 启动服务..."
echo "  地址: http://localhost:8000"
echo "  按 Ctrl+C 停止"
echo ""

# Start server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
