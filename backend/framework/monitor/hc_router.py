"""
健康检查路由模块，用于监控和健康检查的端点
"""
from fastapi import APIRouter, Query, Request, status
from fastapi.responses import HTMLResponse, JSONResponse
from typing import Dict, Any, Optional
from framework.router.router_decorator import router_controller
from pydantic import BaseModel, Field
from framework.model.common import BaseResponse
from framework.database.db_factory import check_db_connection, get_pool_status
from framework.util.logger import setup_logger

logger = setup_logger(__name__)

# 定义健康检查响应模型
class HealthResponse(BaseModel):
    status: str = Field(..., description="服务状态，'ok'表示正常运行")
    version: str = Field("1.0.0", description="API版本")
    database: Dict[str, Any] = Field(default_factory=dict, description="数据库状态信息")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "ok",
                "version": "1.0.0",
                "database": {
                    "connected": True,
                    "pool_status": {
                        "pool_size": 10,
                        "checked_in": 8,
                        "checked_out": 2,
                        "overflow": 0,
                        "invalid": 0
                    }
                }
            }
        }

# 定义数据库状态响应模型
class DatabaseStatusResponse(BaseModel):
    connected: bool = Field(..., description="数据库连接状态")
    pool_status: Dict[str, Any] = Field(..., description="连接池状态")
    connection_test: bool = Field(..., description="连接测试结果")
    
    class Config:
        json_schema_extra = {
            "example": {
                "connected": True,
                "pool_status": {
                    "pool_size": 10,
                    "checked_in": 8,
                    "checked_out": 2,
                    "overflow": 0,
                    "invalid": 0
                },
                "connection_test": True
            }
        }

@router_controller(prefix="/hc", tags=["健康检查"])
def hc_controller(router: APIRouter):

    @router.get(
        "/health", 
        response_model=BaseResponse[HealthResponse],
        summary="系统健康检查",
        description="用于监控和健康检查的端点，返回系统当前运行状态",
        status_code=status.HTTP_200_OK,
        responses={
            200: {
                "description": "系统正常运行",
                "model": BaseResponse[HealthResponse]
            },
            503: {
                "description": "系统不可用",
                "content": {
                    "application/json": {
                        "example": {
                            "code": 503,
                            "message": "服务不可用",
                            "data": {"status": "error", "version": "1.0.0"}
                        }
                    }
                }
            }
        }
    )
    async def health_check(
        print_log: Optional[bool] = Query(default=False, description="是否需要打印日志")
    ):
        """
        健康检查端点
        
        用于监控系统是否正常运行的API端点。返回系统状态信息，
        包括当前运行状态、API版本和数据库连接状态。此端点用于监控工具检测服务可用性。
        
        返回:
            BaseResponse[HealthResponse]: 包含状态、版本和数据库信息的响应
        """
        # 检查数据库连接
        db_connected = check_db_connection()
        pool_status = get_pool_status()
        
        # 记录连接池状态
        if print_log:
            logger.info(f"健康检查 - 数据库连接状态: {db_connected}, 连接池状态: {pool_status}")
        
        # 如果数据库连接失败，返回503状态
        if not db_connected:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content=BaseResponse(
                    code=503,
                    message="数据库连接失败",
                    data=HealthResponse(
                        status="error", 
                        version="1.0.0",
                        database={
                            "connected": False,
                            "pool_status": pool_status
                        }
                    ).dict()
                ).dict()
            )
        
        return BaseResponse(
            code=0,
            message="success",
            data=HealthResponse(
                status="ok", 
                version="1.0.0",
                database={
                    "connected": True,
                    "pool_status": pool_status
                }
            )
        )

    @router.get(
        "/database", 
        response_model=BaseResponse[DatabaseStatusResponse],
        summary="数据库连接状态检查",
        description="专门用于检查数据库连接状态和连接池信息的端点",
        status_code=status.HTTP_200_OK
    )
    async def database_status():
        """
        数据库状态检查端点
        
        专门用于检查数据库连接状态和连接池信息的API端点。
        返回详细的数据库连接信息和连接池状态。
        
        返回:
            BaseResponse[DatabaseStatusResponse]: 包含数据库状态信息的响应
        """
        # 检查数据库连接
        db_connected = check_db_connection()
        pool_status = get_pool_status()
        
        # 记录详细信息
        logger.info(f"数据库状态检查 - 连接状态: {db_connected}")
        logger.info(f"数据库状态检查 - 连接池状态: {pool_status}")
        
        return BaseResponse(
            code=0,
            message="success",
            data=DatabaseStatusResponse(
                connected=db_connected,
                pool_status=pool_status,
                connection_test=db_connected
            )
        )
    
    return router