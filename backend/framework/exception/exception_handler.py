"""
异常处理模块，定义全局异常处理器和自定义异常类
"""
from fastapi import Request, FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from framework.exception.custom_exception import BusinessException, UnauthorizedException
from framework.util.logger import setup_logger
import traceback
import sys

# 创建logger实例
logger = setup_logger(__name__)

def register_exception_handlers(app: FastAPI) -> None:
    """
    注册所有全局异常处理器
    Args:
        app: FastAPI应用实例
    """
    # 处理验证错误
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        exc_type, exc_value, exc_traceback = sys.exc_info()
        stack_trace = traceback.format_exception(exc_type, exc_value, exc_traceback)
        stack_trace_str = "".join(stack_trace)
        logger.warning(f"请求验证错误: {exc.errors()}")
        return JSONResponse(
            status_code=422,
            content={
                "code": 422,
                "message": "请求参数验证失败",
                "data": exc.errors()
            }
        )

    # 处理HTTP异常
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        exc_type, exc_value, exc_traceback = sys.exc_info()
        stack_trace = traceback.format_exception(exc_type, exc_value, exc_traceback)
        stack_trace_str = "".join(stack_trace)
        logger.warning(f"{exc.__class__.__name__} - URL: {request.url} - {exc.status_code} {exc.detail}\n堆栈信息:\n{stack_trace_str}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "code": exc.status_code,
                "message": exc.detail
            }
        )

    # 合并处理BusinessException和UnauthorizedException
    @app.exception_handler(BusinessException)
    @app.exception_handler(UnauthorizedException)
    async def custom_exception_handler(request: Request, exc: Exception):
        exc_type, exc_value, exc_traceback = sys.exc_info()
        stack_trace = traceback.format_exception(exc_type, exc_value, exc_traceback)
        stack_trace_str = "".join(stack_trace)
        logger.warning(f"{exc.__class__.__name__}: {getattr(exc, 'code', 500)} {getattr(exc, 'detail', str(exc))}")
        return JSONResponse(
            status_code=exc.code,
            content={
                "code": exc.code,
                "message": exc.detail
            }
        )

    # 处理其他未预期的异常
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        exc_type, exc_value, exc_traceback = sys.exc_info()
        stack_trace = traceback.format_exception(exc_type, exc_value, exc_traceback)
        stack_trace_str = "".join(stack_trace)
        logger.error(f"未处理的异常: {str(exc)}\n堆栈信息:\n{stack_trace_str}")
        return JSONResponse(
            status_code=500,
            content={
                "code": 500,
                "message": "服务器内部错误"
            }
        )

    logger.info("异常处理器注册完成")
