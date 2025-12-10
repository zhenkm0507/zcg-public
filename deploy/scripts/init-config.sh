#!/bin/bash

# 配置文件初始化脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}初始化配置文件...${NC}"

# 检查模板文件是否存在
if [ ! -f "../../backend/env.example" ]; then
    echo -e "${RED}错误: 后端配置模板文件 ../../backend/env.example 不存在${NC}"
    exit 1
fi

if [ ! -f "../../frontend/env.example" ]; then
    echo -e "${RED}错误: 前端配置模板文件 ../../frontend/env.example 不存在${NC}"
    exit 1
fi

# 创建后端配置文件
echo -e "${GREEN}创建后端配置文件...${NC}"

if [ ! -f "../../backend/.env" ]; then
    cp ../../backend/env.example ../../backend/.env
    echo -e "${GREEN}✓ 创建 ../../backend/.env${NC}"
else
    echo -e "${YELLOW}⚠ ../../backend/.env 已存在，跳过${NC}"
fi

# 创建前端配置文件
echo -e "${GREEN}创建前端配置文件...${NC}"

if [ ! -f "../../frontend/.env" ]; then
    cp ../../frontend/env.example ../../frontend/.env
    echo -e "${GREEN}✓ 创建 ../../frontend/.env${NC}"
else
    echo -e "${YELLOW}⚠ ../../frontend/.env 已存在，跳过${NC}"
fi

echo -e "${GREEN}配置文件初始化完成！${NC}"
echo -e "${YELLOW}请根据您的环境修改以下配置文件:${NC}"
echo -e "  - ../../backend/.env (后端配置)"
echo -e "  - ../../frontend/.env (前端配置)"
echo -e ""
echo -e "${YELLOW}特别注意修改以下配置项:${NC}"
echo -e "  - DB_HOST, DB_USER, DB_PASSWORD (数据库连接)"
echo -e "  - JWT_SECRET_KEY (JWT密钥)"
echo -e "  - NEXT_PUBLIC_API_URL (前端API地址)"
echo -e "  - CORS_ORIGINS (CORS允许的域名)"
echo -e ""
echo -e "${GREEN}部署说明:${NC}"
echo -e "  1. 修改配置文件后，直接运行 docker-compose 命令即可"
echo -e "  2. 不同环境使用不同的 docker-compose 文件:"
echo -e "     - 生产环境: docker-compose -f deploy/configs/docker-compose.yaml up -d"
echo -e "     - 开发环境: docker-compose -f deploy/configs/docker-compose.dev.yaml up -d"
echo -e "     - 简化环境: docker-compose -f deploy/configs/docker-compose.simple.yaml up -d" 