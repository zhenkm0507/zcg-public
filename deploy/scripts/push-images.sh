#!/bin/bash

# Docker镜像推送脚本
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
    echo -e "  -t, --target <target>    指定推送目标 (frontend|backend|both)"
    echo -e "  -v, --version <version>  指定版本号 (默认: v1.0.0)"
    echo -e "  -r, --registry <registry> 指定镜像仓库"
    echo -e "  -h, --help               显示此帮助信息"
    echo -e ""
    echo -e "${BLUE}示例:${NC}"
    echo -e "  $0 -t frontend            # 只推送前端镜像"
    echo -e "  $0 -t backend             # 只推送后端镜像"
    echo -e "  $0 -t both                # 推送前端和后端镜像"
    echo -e "  $0 -t both -v v2.0.0      # 推送指定版本的前后端镜像"
    echo -e "  $0 --target frontend      # 推送前端镜像"
}

# 解析命令行参数
TARGET="both"  # 默认推送两者
VERSION=${VERSION:-"v1.0.0"}
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

PROJECT_NAME="zcg"

echo -e "${GREEN}开始推送Docker镜像...${NC}"
echo -e "${YELLOW}推送目标: ${TARGET}${NC}"
echo -e "${YELLOW}镜像仓库: ${REGISTRY}${NC}"
echo -e "${YELLOW}项目名称: ${PROJECT_NAME}${NC}"
echo -e "${YELLOW}版本: ${VERSION}${NC}"

# 检查是否已登录到镜像仓库
echo -e "${YELLOW}检查Docker登录状态...${NC}"
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Docker 未运行或无法连接${NC}"
    exit 1
fi

# 推送前端镜像
if [[ "$TARGET" == "frontend" || "$TARGET" == "both" ]]; then
    echo -e "${GREEN}推送前端镜像...${NC}"
    docker push ${REGISTRY}:frontend-${VERSION}
    docker push ${REGISTRY}:frontend-latest
    echo -e "${GREEN}前端镜像推送完成${NC}"
fi

# 推送后端镜像
if [[ "$TARGET" == "backend" || "$TARGET" == "both" ]]; then
    echo -e "${GREEN}推送后端镜像...${NC}"
    docker push ${REGISTRY}:backend-${VERSION}
    docker push ${REGISTRY}:backend-latest
    echo -e "${GREEN}后端镜像推送完成${NC}"
fi

echo -e "${GREEN}镜像推送完成！${NC}" 