"""
用户应用服务模块，处理用户相关的业务逻辑
"""
from typing import List
from framework.database.db_decorator import readonly, transactional
from framework.exception.custom_exception import BusinessException
from framework.util.oo_converter import dto_to_orm, orm_to_dto
from user.dto.user_dto import UserDto
from user.domain.service.user_service import UserService
from framework.util.logger import setup_logger
from framework.container.container_decorator import injectable
from user.domain.entity.user import User

logger = setup_logger(__name__)

@injectable
class UserAppService:
    """
    用户服务类，处理用户相关的业务逻辑
    """
    def __init__(self, user_service: UserService):
        self.user_service = user_service
    
    def get_user_by_username(self, username: str) -> UserDto:
        """
        根据用户名查询用户实体
        """
        user =  self.user_service.get_user_by_username(username)
        if not user:
            raise BusinessException(detail="用户不存在")
        return orm_to_dto(user, UserDto)
    
    @transactional
    def update_user_current_word_bank_id(self, user_id: int, word_bank_id: int) -> None:
        """
        更新用户当前词库ID
        """
        self.user_service.update_user_current_word_bank_id(user_id, word_bank_id)

    def get_user_by_username(self, username: str) -> User:
        """
        根据用户名查询用户实体
        """
        return self.user_service.get_user_by_username(username)
    
    def get_user_by_id(self, id: int) -> UserDto:
        """
        根据用户ID查询用户实体
        """
        user =  self.user_service.get_user_by_id(id)
        return orm_to_dto(user, UserDto)
    
    def update_user_info(self,user:UserDto) -> None:
        """
        更新用户信息
        """
        self.user_service.update_user_info(dto_to_orm(user, User))

    def get_user_custorm_flags(self, user_id: int) -> List[str]:
        """
        获取用户自定义标签列表
        """
        return self.user_service.get_user_custorm_flags(user_id)