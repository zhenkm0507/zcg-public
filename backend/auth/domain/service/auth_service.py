"""
用户认证服务模块，处理用户登录认证逻辑
"""
from typing import Optional
from user.application.user_app_service import UserAppService
from user.domain.entity.user import User
from framework.config.config import settings
from auth.dto.auth_dto import LoginRequest
from framework.util.logger import setup_logger
from framework.container.container_decorator import injectable
from framework.util.jwt import create_access_token

logger = setup_logger(__name__)

@injectable
class AuthService:
    """
    用户登录认证类
    """
    def __init__(self, user_app_service: UserAppService):
        self.user_app_service = user_app_service

    def authenticate_user(self, user_data: LoginRequest) -> Optional[User]:
        """
        简单的用户认证逻辑，实际项目中应连接数据库验证
        
        注意：这里为了演示，任何用户名密码都会通过验证
        生产环境中应使用安全的认证逻辑
        """
        logger.info(f"正在验证用户: {user_data.username}")
        user = self.user_app_service.get_user_by_username(user_data.username)
        is_authenticated = True if user and user.passwd == user_data.password else False
        if is_authenticated:
            logger.info(f"用户 {user_data.username} 验证通过")
            return user
        else:
            logger.warning(f"用户 {user_data.username} 验证失败")
            return None
    
    def create_token(self, user: User) -> str:
        # 生成JWT token
        token_data = {
            "sub": user.username,
            "sub_id": user.id,
            "type": "access"
        }
        return create_access_token(token_data)