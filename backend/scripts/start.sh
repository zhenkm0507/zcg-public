#!/bin/bash

# 生产环境启动脚本
# 默认环境为dev
DEFAULT_ENV="dev"
ENV=${1:-$DEFAULT_ENV}

# 设置工作目录
cd "$(dirname "$0")/.."

# 检查并杀死已存在的 gunicorn 进程（监听 8000 端口）
PIDS=$(lsof -i:8000 -t)
if [ -n "$PIDS" ]; then
  echo "检测到已有 gunicorn 进程（端口 8000），正在停止..."
  kill $PIDS
  sleep 2
  # 强制杀死未退出的进程
  PIDS2=$(lsof -i:8000 -t)
  if [ -n "$PIDS2" ]; then
    kill -9 $PIDS2
  fi
fi

# 启动服务
echo "正在启动 斩词阁 应用... (环境: $ENV)"
exec gunicorn main:app \
  --chdir backend \
  --workers 1 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --log-level info \
  --log-file ../logs/gunicorn.log \
  --access-logfile ../logs/access.log 