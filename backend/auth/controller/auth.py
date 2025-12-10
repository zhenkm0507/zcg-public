"""
用户认证控制器模块，处理用户登录请求
"""
from fastapi import APIRouter, Depends
from auth.dto.auth_dto import LoginRequest, LoginResponse
from auth.application.auth_app_service import AuthAppService
from framework.util.logger import setup_logger
from framework.container.container import get_service
from functools import partial
from framework.model.common import BaseResponse
from framework.router.router_decorator import router_controller

# 创建logger实例
logger = setup_logger(__name__)

@router_controller(prefix="/auth", tags=["用户认证"])
def auth_controller(router: APIRouter):
    """用户认证控制器"""
    
    @router.post(
        "/login",
        response_model=BaseResponse[LoginResponse],
        summary="用户登录处理",
        description="处理用户登录请求，验证用户名和密码，成功后返回用户信息和访问令牌，失败返回401"
    )
    async def login(
        user_data: LoginRequest,
        auth_app_service: AuthAppService = Depends(partial(get_service, AuthAppService))
    ):
        logger.info(f"尝试登录用户: {user_data.username}")
        token_response,is_need_select_word_bank = auth_app_service.authenticate_user(user_data)
        return BaseResponse(
            code=0,
            message="登录成功",
            data=LoginResponse(
                username=user_data.username,
                level="1",
                welcome_message="欢迎登录斩词阁",
                token=token_response.access_token,
                token_type=token_response.token_type,
                is_need_select_word_bank=is_need_select_word_bank
            )
        )
        
    return router