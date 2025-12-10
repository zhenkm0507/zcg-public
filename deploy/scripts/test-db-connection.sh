#!/bin/bash

# 数据库连接测试脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 从环境变量文件加载配置
ENV=${ENV:-"production"}

if [ "$ENV" = "dev" ]; then
    if [ -f "backend/.env.dev" ]; then
        echo -e "${GREEN}加载后端开发环境配置文件: backend/.env.dev${NC}"
        source backend/.env.dev
    else
        echo -e "${RED}后端开发环境配置文件 backend/.env.dev 不存在${NC}"
        exit 1
    fi
else
    if [ -f "backend/.env.prod" ]; then
        echo -e "${GREEN}加载后端生产环境配置文件: backend/.env.prod${NC}"
        source backend/.env.prod
    else
        echo -e "${RED}后端生产环境配置文件 backend/.env.prod 不存在${NC}"
        exit 1
    fi
fi

# 数据库连接参数
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_DATABASE=${DB_DATABASE:-postgres}
DB_USER=${DB_USER:-user}
DB_PASSWORD=${DB_PASSWORD:-password}

echo -e "${GREEN}测试数据库连接...${NC}"
echo -e "${YELLOW}主机: ${DB_HOST}${NC}"
echo -e "${YELLOW}端口: ${DB_PORT}${NC}"
echo -e "${YELLOW}数据库: ${DB_DATABASE}${NC}"
echo -e "${YELLOW}用户: ${DB_USER}${NC}"

# 检查psql命令是否可用
if ! command -v psql &> /dev/null; then
    echo -e "${RED}错误: psql 命令未找到，请安装 PostgreSQL 客户端${NC}"
    exit 1
fi

# 设置密码环境变量
export PGPASSWORD=$DB_PASSWORD

# 测试连接
echo -e "${GREEN}正在测试数据库连接...${NC}"
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_DATABASE -c "SELECT version();" &> /dev/null; then
    echo -e "${GREEN}✓ 数据库连接成功！${NC}"
    
    # 获取数据库版本
    VERSION=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_DATABASE -t -c "SELECT version();" | head -1)
    echo -e "${GREEN}数据库版本: ${VERSION}${NC}"
    
    # 检查必要的表是否存在
    echo -e "${GREEN}检查数据库表结构...${NC}"
    TABLES=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_DATABASE -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
    
    if echo "$TABLES" | grep -q "users"; then
        echo -e "${GREEN}✓ users 表存在${NC}"
    else
        echo -e "${YELLOW}⚠ users 表不存在${NC}"
    fi
    
    if echo "$TABLES" | grep -q "words"; then
        echo -e "${GREEN}✓ words 表存在${NC}"
    else
        echo -e "${YELLOW}⚠ words 表不存在${NC}"
    fi
    
    if echo "$TABLES" | grep -q "study_records"; then
        echo -e "${GREEN}✓ study_records 表存在${NC}"
    else
        echo -e "${YELLOW}⚠ study_records 表不存在${NC}"
    fi
    
    echo -e "${GREEN}数据库连接测试完成！${NC}"
else
    echo -e "${RED}✗ 数据库连接失败！${NC}"
    echo -e "${YELLOW}请检查以下项目:${NC}"
    echo -e "  1. 数据库服务器是否运行"
    echo -e "  2. 主机地址和端口是否正确"
    echo -e "  3. 用户名和密码是否正确"
    echo -e "  4. 数据库是否存在"
    echo -e "  5. 防火墙设置是否允许连接"
    exit 1
fi

# 清理环境变量
unset PGPASSWORD 