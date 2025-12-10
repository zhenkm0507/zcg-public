from fastapi import APIRouter, FastAPI, Depends
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn
import os
from fastapi.middleware.cors import CORSMiddleware
from framework.config.config import settings
from framework.util.logger import setup_logger
from framework.container import container
from framework.startup.startup_manager import startup_manager
from framework.exception.exception_handler import register_exception_handlers
from framework.auth.auth import JWTBearer
from framework.router.router_register import register_routers
from framework.config.nltk_config import NLTKConfig

def create_app() -> FastAPI:
    """
    创建FastAPI应用
    """
    # 初始化 NLTK
    NLTKConfig.init_nltk()

    app = FastAPI(
        title=settings.APP_NAME,
        description="斩词阁API服务",
        version="1.0.0",
        debug=settings.DEBUG
    )

    # 创建认证中间件实例
    security = JWTBearer()

    # 配置CORS中间件
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=["*"],  # 允许所有请求头
        expose_headers=["Content-Disposition", "file-path"],  # 使用小写的file-path
        max_age=600,  # 预检请求结果缓存10分钟
    )

    class CharsetMiddleware(BaseHTTPMiddleware):
      async def dispatch(self, request, call_next):
        response = await call_next(request)
        content_type = response.headers.get("content-type", "")
        if content_type.startswith("application/json") and "charset" not in content_type:
            response.headers["content-type"] = "application/json; charset=utf-8"
        elif content_type.startswith("text/html") and "charset" not in content_type:
            response.headers["content-type"] = "text/html; charset=utf-8"
        return response

    # ...在app = FastAPI(...)之后添加：
    app.add_middleware(CharsetMiddleware)

    # 配置依赖注入容器
    app.container = container

    # 配置日志
    logger = setup_logger(__name__)

    # 注册异常处理器
    register_exception_handlers(app)

    # 创建API版本路由
    api_v1_router = APIRouter(prefix="/api/v1", dependencies=[Depends(security)])

    # 自动注册路由
    register_routers(api_v1_router)

    # 注册API版本路由到应用
    app.include_router(api_v1_router)

    # 执行启动时初始化
    startup_manager.initialize_all()

    logger.info("应用启动成功！！！")
    return app

# 创建应用实例
app = create_app()

if __name__ == "__main__":
    # 仅用于开发环境直接运行
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    ) 