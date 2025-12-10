#!/bin/bash

# 获取脚本自身目录和项目根目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/../.."

# 部署脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认环境
ENV=${ENV:-prod}

# 默认镜像配置
export BACKEND_IMAGE=${BACKEND_IMAGE:-"registry.cn-hangzhou.aliyuncs.com/zhenkm0507/zcg:backend-latest"}
export FRONTEND_IMAGE=${FRONTEND_IMAGE:-"registry.cn-hangzhou.aliyuncs.com/zhenkm0507/zcg:frontend-latest"}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}斩词阁部署脚本${NC}"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -e, --env ENV     指定环境 (dev|prod|simple) [默认: prod]"
    echo "  -b, --build       强制重新构建镜像"
    echo "  -p, --pull        拉取远程镜像（如果设置了BACKEND_IMAGE/FRONTEND_IMAGE）"
    echo "  -h, --help        显示此帮助信息"
    echo ""
    echo "环境说明:"
    echo "  dev     开发环境 (热重载，调试模式)"
    echo "  prod    生产环境 (含Nginx，优化模式)"
    echo "  simple  简化环境 (无Nginx，快速部署)"
    echo ""
    echo "镜像管理:"
    echo "  默认镜像: BACKEND_IMAGE=zcg-backend:latest, FRONTEND_IMAGE=zcg-frontend:latest"
    echo "  可通过环境变量覆盖默认镜像"
    echo "  远程镜像格式: registry/repository:tag (如: docker.io/zcg/backend:latest)"
    echo "  本地镜像格式: name:tag (如: zcg-backend:latest)"
    echo ""
    echo "示例:"
    echo "  $0                    # 生产环境部署"
    echo "  $0 -e dev            # 开发环境部署"
    echo "  $0 --env simple      # 简化环境部署"
    echo "  $0 -b                # 强制重新构建镜像"
    echo "  $0 -p                # 拉取远程镜像"
}

# 解析命令行参数
BUILD_IMAGES=false
PULL_IMAGES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENV="$2"
            shift 2
            ;;
        -b|--build)
            BUILD_IMAGES=true
            shift
            ;;
        -p|--pull)
            PULL_IMAGES=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}未知选项: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# 验证环境参数
case $ENV in
    dev|prod|simple)
        ;;
    *)
        echo -e "${RED}错误: 无效的环境参数 '$ENV'${NC}"
        echo "支持的环境: dev, prod, simple"
        exit 1
        ;;
esac

echo -e "${GREEN}开始部署斩词阁 (环境: $ENV)${NC}"

# 检查镜像配置
echo -e "${BLUE}镜像配置:${NC}"
echo -e "  BACKEND_IMAGE: $BACKEND_IMAGE"
echo -e "  FRONTEND_IMAGE: $FRONTEND_IMAGE"

# 检查是否为远程镜像（包含 / 或 : 但不以 . 开头）
if [[ "$BACKEND_IMAGE" =~ ^[^/]*/[^/]+ ]] || [[ "$FRONTEND_IMAGE" =~ ^[^/]*/[^/]+ ]]; then
    echo -e "${BLUE}检测到远程镜像${NC}"
    
    if [ "$PULL_IMAGES" = true ]; then
        echo -e "${BLUE}拉取远程镜像...${NC}"
        if [[ "$BACKEND_IMAGE" =~ ^[^/]*/[^/]+ ]]; then
            docker pull "$BACKEND_IMAGE"
        fi
        if [[ "$FRONTEND_IMAGE" =~ ^[^/]*/[^/]+ ]]; then
            docker pull "$FRONTEND_IMAGE"
        fi
    fi
else
    echo -e "${BLUE}使用本地镜像${NC}"
fi

# 检查配置文件
echo -e "${BLUE}检查配置文件...${NC}"

if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
    echo -e "${YELLOW}后端配置文件不存在，正在初始化...${NC}"
    if [ ! -f "$PROJECT_ROOT/backend/env.example" ]; then
        echo -e "${RED}错误: 后端配置模板文件 $PROJECT_ROOT/backend/env.example 不存在${NC}"
        exit 1
    fi
    cp "$PROJECT_ROOT/backend/env.example" "$PROJECT_ROOT/backend/.env"
    echo -e "${GREEN}✓ 已创建 $PROJECT_ROOT/backend/.env${NC}"
    echo -e "${YELLOW}请修改 $PROJECT_ROOT/backend/.env 文件中的配置项${NC}"
fi

if [ ! -f "$PROJECT_ROOT/frontend/.env" ]; then
    echo -e "${YELLOW}前端配置文件不存在，正在初始化...${NC}"
    if [ ! -f "$PROJECT_ROOT/frontend/env.example" ]; then
        echo -e "${RED}错误: 前端配置模板文件 $PROJECT_ROOT/frontend/env.example 不存在${NC}"
        exit 1
    fi
    cp "$PROJECT_ROOT/frontend/env.example" "$PROJECT_ROOT/frontend/.env"
    echo -e "${GREEN}✓ 已创建 $PROJECT_ROOT/frontend/.env${NC}"
    echo -e "${YELLOW}请修改 $PROJECT_ROOT/frontend/.env 文件中的配置项${NC}"
fi

# 根据环境选择docker-compose文件
case $ENV in
    dev)
        COMPOSE_FILE="$PROJECT_ROOT/deploy/configs/docker-compose.dev.yaml"
        echo -e "${BLUE}使用开发环境配置: $COMPOSE_FILE${NC}"
        ;;
    prod)
        COMPOSE_FILE="$PROJECT_ROOT/deploy/configs/docker-compose.yaml"
        echo -e "${BLUE}使用生产环境配置: $COMPOSE_FILE${NC}"
        ;;
    simple)
        COMPOSE_FILE="$PROJECT_ROOT/deploy/configs/docker-compose.simple.yaml"
        echo -e "${BLUE}使用简化环境配置: $COMPOSE_FILE${NC}"
        ;;
esac

# 检查docker-compose文件是否存在
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}错误: Docker Compose 文件不存在: $COMPOSE_FILE${NC}"
    exit 1
fi

# 停止现有服务
echo -e "${BLUE}停止现有服务...${NC}"
docker-compose -f "$COMPOSE_FILE" down --remove-orphans

# 构建镜像（如果需要）
if [ "$BUILD_IMAGES" = true ] || [[ ! "$BACKEND_IMAGE" =~ ^[^/]*/[^/]+ ]] || [[ ! "$FRONTEND_IMAGE" =~ ^[^/]*/[^/]+ ]]; then
    echo -e "${BLUE}构建Docker镜像...${NC}"
    docker-compose -f "$COMPOSE_FILE" build --no-cache
fi

# 启动服务
echo -e "${BLUE}启动服务...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d

# 等待服务启动
echo -e "${BLUE}等待服务启动...${NC}"
sleep 20

# 检查服务状态
echo -e "${BLUE}检查服务状态...${NC}"
docker-compose -f "$COMPOSE_FILE" ps

# 检查健康状态
echo -e "${BLUE}检查服务健康状态...${NC}"
sleep 5

# 检查后端健康状态
if curl -f http://localhost:8000/api/v1/hc/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端服务健康检查通过${NC}"
else
    echo -e "${YELLOW}⚠ 后端服务健康检查失败，请查看日志${NC}"
fi

# 检查前端健康状态
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 前端服务健康检查通过${NC}"
else
    echo -e "${YELLOW}⚠ 前端服务健康检查失败，请查看日志${NC}"
fi

echo -e "${GREEN}部署完成！${NC}"
echo ""
echo -e "${BLUE}服务访问地址:${NC}"
case $ENV in
    dev|simple)
        echo -e "  前端: http://localhost:3000"
        echo -e "  后端: http://localhost:8000"
        ;;
    prod)
        echo -e "  应用: https://your-domain.com (需要配置域名和SSL证书)"
        echo -e "  前端: http://localhost:3000"
        echo -e "  后端: http://localhost:8000"
        ;;
esac

echo ""
echo -e "${BLUE}常用命令:${NC}"
echo -e "  查看日志: docker-compose -f $COMPOSE_FILE logs -f"
echo -e "  停止服务: docker-compose -f $COMPOSE_FILE down"
echo -e "  重启服务: docker-compose -f $COMPOSE_FILE restart" 