#!/bin/bash

# Docker镜像构建脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示使用说明
show_usage() {
    echo -e "${BLUE}使用方法:${NC}"
    echo -e "  $0 [选项]"
    echo -e ""
    echo -e "${BLUE}选项:${NC}"
    echo -e "  -t, --target <target>    指定构建目标 (frontend|backend|both)"
    echo -e "  -v, --version <version>  指定版本号 (默认: v1.0.0)"
    echo -e "  -e, --env <env>          指定环境 (默认: prod)"
    echo -e "  -r, --registry <registry> 指定镜像仓库"
    echo -e "  -h, --help               显示此帮助信息"
    echo -e ""
    echo -e "${BLUE}示例:${NC}"
    echo -e "  $0 -t frontend            # 只构建前端镜像"
    echo -e "  $0 -t backend             # 只构建后端镜像"
    echo -e "  $0 -t both                # 构建前端和后端镜像"
    echo -e "  $0 -t both -v v2.0.0      # 构建指定版本的前后端镜像"
    echo -e "  $0 --target frontend --env dev  # 构建开发环境前端镜像"
}

# 解析命令行参数
TARGET="both"  # 默认构建两者
VERSION=${VERSION:-"v1.0.0"}
ENV=${ENV:-"prod"}
REGISTRY=${REGISTRY:-"registry.cn-hangzhou.aliyuncs.com/zhenkm0507/zcg"}

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--target)
            TARGET="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -e|--env)
            ENV="$2"
            shift 2
            ;;
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}未知参数: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# 验证目标参数
if [[ "$TARGET" != "frontend" && "$TARGET" != "backend" && "$TARGET" != "both" ]]; then
    echo -e "${RED}错误: 无效的目标 '$TARGET'。有效值: frontend, backend, both${NC}"
    exit 1
fi

PROJECT_NAME=${PROJECT_NAME:-"zcg"}

# 镜像名称
BACKEND_IMAGE="${REGISTRY}:backend-${VERSION}"
FRONTEND_IMAGE="${REGISTRY}:frontend-${VERSION}"

echo -e "${GREEN}开始构建Docker镜像...${NC}"
echo -e "${YELLOW}构建目标: ${TARGET}${NC}"
echo -e "${YELLOW}镜像仓库: ${REGISTRY}${NC}"
echo -e "${YELLOW}版本: ${VERSION}${NC}"
echo -e "${YELLOW}环境: ${ENV}${NC}"
echo -e "${YELLOW}后端镜像: ${BACKEND_IMAGE}${NC}"
echo -e "${YELLOW}前端镜像: ${FRONTEND_IMAGE}${NC}"

# 构建前端镜像
if [[ "$TARGET" == "frontend" || "$TARGET" == "both" ]]; then
    echo -e "${GREEN}构建前端镜像...${NC}"
    
    # 根据ENV替换前端环境配置文件
    echo -e "${GREEN}配置前端环境文件...${NC}"
    FRONTEND_ENV_FILE="frontend/.env.${ENV}"
    FRONTEND_ENV_TARGET="frontend/.env"

    if [ -f "$FRONTEND_ENV_FILE" ]; then
        echo -e "${YELLOW}复制 ${FRONTEND_ENV_FILE} 到 ${FRONTEND_ENV_TARGET}${NC}"
        cp "$FRONTEND_ENV_FILE" "$FRONTEND_ENV_TARGET"
        echo -e "${GREEN}前端环境文件配置完成${NC}"
    else
        echo -e "${RED}警告: 环境文件 ${FRONTEND_ENV_FILE} 不存在${NC}"
        if [ -f "$FRONTEND_ENV_TARGET" ]; then
            echo -e "${YELLOW}使用现有的 ${FRONTEND_ENV_TARGET}${NC}"
        else
            echo -e "${RED}错误: 前端环境文件不存在，构建可能失败${NC}"
            exit 1
        fi
    fi
    
    docker build -f deploy/images/Dockerfile.frontend -t ${FRONTEND_IMAGE} frontend
    docker tag ${FRONTEND_IMAGE} ${REGISTRY}:frontend-latest
    echo -e "${GREEN}前端镜像构建完成${NC}"
fi

# 构建后端镜像
if [[ "$TARGET" == "backend" || "$TARGET" == "both" ]]; then
    echo -e "${GREEN}构建后端镜像...${NC}"
    docker build -f deploy/images/Dockerfile.backend -t ${BACKEND_IMAGE} .
    docker tag ${BACKEND_IMAGE} ${REGISTRY}:backend-latest
    echo -e "${GREEN}后端镜像构建完成${NC}"
fi

echo -e "${GREEN}镜像构建完成！${NC}"

# 显示构建的镜像
echo -e "${YELLOW}构建的镜像列表:${NC}"
docker images | grep ${PROJECT_NAME}

# 输出环境变量设置命令
echo -e "${GREEN}环境变量设置命令:${NC}"
if [[ "$TARGET" == "backend" || "$TARGET" == "both" ]]; then
    echo -e "${YELLOW}export BACKEND_IMAGE=${BACKEND_IMAGE}${NC}"
fi
if [[ "$TARGET" == "frontend" || "$TARGET" == "both" ]]; then
    echo -e "${YELLOW}export FRONTEND_IMAGE=${FRONTEND_IMAGE}${NC}"
fi 