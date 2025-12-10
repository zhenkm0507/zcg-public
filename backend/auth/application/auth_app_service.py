"""
用户认证服务模块，处理用户登录认证逻辑
"""
from typing import Tuple
from auth.domain.service.auth_service import AuthService
from framework.exception.custom_exception import BusinessException
from auth.dto.auth_dto import LoginRequest, TokenResponse
from framework.util.logger import setup_logger
from framework.container.container_decorator import injectable

logger = setup_logger(__name__)

@injectable
class AuthAppService:
    """
    用户登录认证类
    """
    def __init__(self, auth_service: AuthService):
        self.auth_service = auth_service

    def authenticate_user(self, user_data: LoginRequest) -> Tuple[TokenResponse,bool]:
        user = self.auth_service.authenticate_user(user_data)
        if not user:
          logger.warning(f"用户 {user_data} 登录失败")
          raise BusinessException(code=401, detail="登录失败，用户名或密码错误")
        
        is_need_select_word_bank = user.current_word_bank_id is None
        return TokenResponse(access_token=self.auth_service.create_token(user)),is_need_select_word_bank
        