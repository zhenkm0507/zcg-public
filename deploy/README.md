# 斩词阁 Docker 部署指南

## 详细部署步骤（推荐最佳实践）

1. **初始化配置文件**
   ```bash
   cd deploy/scripts
   ./init-config.sh
   # 修改 ../../backend/.env 和 ../../frontend/.env
   ```
2. **构建镜像（本地开发/测试/首次部署）**
   ```bash
   # 可选：设置镜像仓库和版本
   export REGISTRY=your-registry.com
   export VERSION=v1.0.0
   ENV=prod ./build-images.sh
   # 按提示 export BACKEND_IMAGE/FRONTEND_IMAGE 环境变量
   ```
3. **推送镜像（如需远程部署）**
   ```bash
   ./push-images.sh
   ```
4. **部署服务**
   - **本地开发/测试**
     ```bash
     ./deploy.sh -e dev -b   # 开发环境并强制本地构建
     ./deploy.sh -e simple   # 简化环境
     ```
   - **生产环境（本地构建）**
     ```bash
     ./deploy.sh -b         # 强制本地构建并部署
     ```
   - **生产环境（远程镜像）**
     ```bash
     export BACKEND_IMAGE=your-registry.com/zcg-backend:v1.0.0
     export FRONTEND_IMAGE=your-registry.com/zcg-frontend:v1.0.0
     ./deploy.sh -p         # 拉取远程镜像并部署
     ```
5. **服务管理**
   ```bash
   # 查看服务状态
   docker-compose -f ../configs/docker-compose.yaml ps
   # 查看日志
   docker-compose -f ../configs/docker-compose.yaml logs -f
   # 停止服务
   docker-compose -f ../configs/docker-compose.yaml down
   ```

---

## 项目概述

斩词阁是一个基于 Next.js 前端和 FastAPI 后端的词汇学习应用。本文档介绍如何使用 Docker 进行部署。

**注意**: 本部署方案不包含 PostgreSQL 数据库容器，应用将连接到已存在的 PostgreSQL 数据库实例。

## 项目结构

```
zcg/
├── deploy/                    # 部署根目录
│   ├── configs/              # 配置文件
│   │   ├── docker-compose.yaml          # 生产环境配置（含Nginx）
│   │   ├── docker-compose.dev.yaml      # 开发环境配置
│   │   ├── docker-compose.simple.yaml   # 简化版配置（无Nginx）
│   │   └── nginx/            # Nginx配置
│   │       ├── nginx.conf
│   │       └── conf.d/
│   │           └── default.conf
│   ├── images/               # 镜像构建
│   │   ├── Dockerfile.backend
│   │   └── Dockerfile.frontend
│   ├── scripts/              # 部署脚本
│   │   ├── init-config.sh    # 配置文件初始化
│   │   ├── deploy.sh         # 部署脚本
│   │   ├── build-images.sh   # 镜像构建脚本
│   │   ├── push-images.sh    # 镜像推送脚本
│   │   └── test-db-connection.sh # 数据库连接测试
│   └── README.md             # 本文档
├── frontend/                 # 前端项目 (Next.js)
│   ├── .env                 # 前端配置文件
│   └── env.example          # 前端配置模板
├── backend/                  # 后端项目 (FastAPI)
│   ├── .env                 # 后端配置文件
│   └── env.example          # 后端配置模板
├── logs/                     # 日志目录
├── dictionary/               # 词典目录
└── ssl/                      # SSL证书目录
```

## 配置文件结构

### 前端配置文件
- **`frontend/.env`** - 前端配置文件
- **`frontend/env.example`** - 配置模板

### 后端配置文件
- **`backend/.env`** - 后端配置文件
- **`backend/env.example`** - 配置模板

### 关键配置项

#### 后端数据库配置
```bash
# backend/.env
DB_HOST=your_postgresql_host  # PostgreSQL服务器地址
DB_PORT=5432                  # PostgreSQL端口
DB_DATABASE=zcg_prod          # 数据库名称
DB_USER=zcg_user             # 数据库用户名
DB_PASSWORD=your_password     # 数据库密码
```

#### 前端API配置
```bash
# frontend/.env
NEXT_PUBLIC_API_URL=https://your-domain.com  # 前端API地址
NEXT_PUBLIC_APP_NAME=斩词阁                   # 应用名称
NEXT_PUBLIC_ENV=production                   # 环境标识
```

## 快速开始

### 1. 初始化配置文件

```bash
# 1. 进入部署脚本目录
cd deploy/scripts

# 2. 初始化配置文件（如果不存在）
./init-config.sh

# 3. 确保配置文件存在
ls ../../backend/.env
ls ../../frontend/.env

# 4. 修改配置文件（特别是数据库密码和JWT密钥）
vim ../../backend/.env
vim ../../frontend/.env
```

### 2. 开发环境部署

```bash
# 进入部署脚本目录
cd deploy/scripts

# 启动开发环境
./deploy.sh -e dev
```

### 3. 生产环境部署

```bash
# 进入部署脚本目录
cd deploy/scripts

# 启动生产环境
./deploy.sh
```

### 4. 简化环境部署

```bash
# 进入部署脚本目录
cd deploy/scripts

# 启动简化环境（无Nginx）
./deploy.sh -e simple
```

## 部署方案对比

### 有Nginx方案 (`deploy/configs/docker-compose.yaml`)
- **适用场景**: 生产环境
- **特点**: 完整功能，SSL支持，反向代理，缓存优化
- **访问方式**: `https://your-domain.com`

### 无Nginx方案 (`deploy/configs/docker-compose.simple.yaml`)
- **适用场景**: 开发/测试环境
- **特点**: 简单直接，快速部署
- **访问方式**: `http://localhost:3000` (前端), `http://localhost:8000` (后端)

### 开发环境方案 (`deploy/configs/docker-compose.dev.yaml`)
- **适用场景**: 开发调试
- **特点**: 热重载，源码挂载，开发工具
- **访问方式**: `http://localhost:3000` (前端), `http://localhost:8000` (后端)

## 镜像构建和推送

### 1. 构建镜像

```bash
# 进入部署脚本目录
cd deploy/scripts

# 设置镜像仓库地址
export REGISTRY=your-registry.com
export VERSION=v1.0.0

# 构建镜像
./build-images.sh
```

### 2. 推送镜像

```bash
# 进入部署脚本目录
cd deploy/scripts

# 登录到镜像仓库
docker login your-registry.com

# 推送镜像
./push-images.sh
```

## 服务管理

### 1. 启动服务

```bash
# 生产环境（有Nginx）
docker-compose -f deploy/configs/docker-compose.yaml up -d

# 开发环境
docker-compose -f deploy/configs/docker-compose.dev.yaml up -d

# 简化版（无Nginx）
docker-compose -f deploy/configs/docker-compose.simple.yaml up -d
```

### 2. 停止服务

```bash
# 生产环境
docker-compose -f deploy/configs/docker-compose.yaml down

# 开发环境
docker-compose -f deploy/configs/docker-compose.dev.yaml down

# 简化版
docker-compose -f deploy/configs/docker-compose.simple.yaml down
```

### 3. 查看日志

```bash
# 查看所有服务日志
docker-compose -f deploy/configs/docker-compose.yaml logs -f

# 查看特定服务日志
docker-compose -f deploy/configs/docker-compose.yaml logs -f backend
docker-compose -f deploy/configs/docker-compose.yaml logs -f frontend
```

## 数据库连接

### 1. 数据库要求

应用需要连接到一个已存在的 PostgreSQL 数据库实例：

- **数据库版本**: PostgreSQL 12+
- **字符集**: UTF-8
- **时区**: UTC 或本地时区

### 2. 数据库初始化

在部署应用之前，需要确保数据库已创建并初始化：

```bash
# 连接到PostgreSQL
psql -h your_postgresql_host -U your_user -d your_database

# 执行初始化脚本
\i backend/scripts/database/create_db.sql
\i backend/scripts/database/create_table.sql
\i backend/scripts/database/functions.sql
\i backend/scripts/database/init_data.sql
```

### 3. 测试数据库连接

```bash
# 进入部署脚本目录
cd deploy/scripts

# 测试数据库连接
./test-db-connection.sh
```

## 健康检查

服务包含健康检查机制：

- **Backend**: 检查 `/api/v1/health` 端点
- **Frontend**: 检查根路径响应

## 应用数据

- 日志文件: `./logs/`
- 词典文件: `./dictionary/`

## SSL 配置

### 1. 自签名证书（开发环境）

部署脚本会自动生成自签名证书。

### 2. 正式证书（生产环境）

将正式的 SSL 证书文件放置在 `ssl/` 目录下：

```bash
ssl/
├── cert.pem    # 证书文件
└── key.pem     # 私钥文件
```

## 性能优化

### 1. 前端优化

- 使用多阶段构建减少镜像大小
- 启用 Gzip 压缩
- 静态资源缓存

### 2. 后端优化

- 使用 Alpine Linux 基础镜像
- 健康检查机制
- 日志轮转

### 3. Nginx 优化

- 反向代理
- 负载均衡
- 静态文件缓存
- SSL 终止

## 故障排除

### 1. 常见问题

#### 配置文件不存在
```bash
# 检查配置文件
ls backend/.env
ls frontend/.env

# 创建配置文件模板
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env
```

#### 数据库连接失败
```bash
# 检查数据库连接
psql -h your_postgresql_host -U your_user -d your_database -c "SELECT 1;"

# 检查网络连接
docker-compose exec backend ping your_postgresql_host

# 查看后端日志
docker-compose logs backend
```

#### 前端无法访问后端API
```bash
# 检查 CORS 配置
# 检查网络连接
docker-compose exec frontend ping backend
```

### 2. 日志查看

```bash
# 查看所有服务日志
docker-compose -f deploy/configs/docker-compose.yaml logs

# 实时查看日志
docker-compose -f deploy/configs/docker-compose.yaml logs -f

# 查看特定服务的错误日志
docker-compose -f deploy/configs/docker-compose.yaml logs --tail=100 backend | grep ERROR
```

### 3. 进入容器调试

```bash
# 进入后端容器
docker-compose -f deploy/configs/docker-compose.yaml exec backend bash

# 进入前端容器
docker-compose -f deploy/configs/docker-compose.yaml exec frontend sh

# 连接到数据库
psql -h your_postgresql_host -U zcg_user -d zcg_prod
```

## 监控和维护

### 1. 资源监控

```bash
# 查看容器资源使用情况
docker stats

# 查看磁盘使用情况
docker system df
```

### 2. 清理资源

```bash
# 清理未使用的镜像
docker image prune

# 清理未使用的容器
docker container prune

# 清理未使用的网络
docker network prune

# 清理所有未使用的资源
docker system prune
```

### 3. 备份和恢复

#### 数据库备份
```bash
# 备份数据库
pg_dump -h your_postgresql_host -U zcg_user zcg_prod > backup.sql

# 恢复数据库
psql -h your_postgresql_host -U zcg_user zcg_prod < backup.sql
```

## 安全建议

1. **环境变量**: 不要在代码中硬编码敏感信息
2. **镜像安全**: 定期更新基础镜像
3. **网络隔离**: 使用 Docker 网络隔离服务
4. **权限控制**: 容器内使用非 root 用户
5. **SSL 证书**: 生产环境使用正式的 SSL 证书
6. **配置文件**: 确保配置文件权限正确，不要提交到版本控制

## 主要使用方式

### 资源使用
1. 前端的images、icons、videos、audios文件都同步到了阿里云OSS上，前端通过.env里的配置，控制是访问阿里云OSS，还是访问本地资源。

### 部署步骤
1. 本地打镜像：deploy/scripts/build-images.sh (-t backend|frontend|both)
     注：frontend目录下的.env参与打镜像，并且其内容起作用，后续容器启动后，再通过挂载文件的方式，是不起作用的。
        build-images.sh自动完成.env.prod到.env文件的覆盖。
2. 上传镜像：deploy/scripts/push-images.sh (-t backend|frontend|both)
3. 服务器上部署
   - 后端挂载目录的权限  chmod 777 /app/zcg/logs
   - 拷贝nltk数据到服务器 /app/nltk_data
   - deploy/scripts/deploy.sh -e simple -p
4. postgresql的部署：
   - 挂载目录的权限：chown -R 1000:1000 /app/postgre
   - 启动镜像
      docker run -d --user 1000:1000  --name zcg-db \
        -e PGUSER=postgres \
        -e POSTGRES_PASSWORD=root \
        -p 5433:5432 \
        -v /app/postgre/data:/var/lib/postgresql/data \
        postgres:latest
   - 修改 postgresql.conf 文件里的  timezone、log_timezone，值为 Asia/Shanghai    
   - 数据库的备份：
      - 备份脚本：backend/scripts/backup_database.sh
      - 备份周期：每天凌晨2点，通过crontab配置

