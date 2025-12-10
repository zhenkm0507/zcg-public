"""
用户服务模块，处理用户相关的业务逻辑
"""
from typing import List
from framework.database.db_decorator import readonly, transactional
from framework.database.db_factory import get_db_session
from framework.util.logger import setup_logger
from framework.container.container_decorator import injectable
from user.domain.entity.user import User

logger = setup_logger(__name__)

@injectable
class UserService:
    """
    用户服务类，处理用户相关的业务逻辑
    """
    @readonly
    def get_user_by_username(self, username: str) -> User:
        """
        根据用户名查询用户实体
        """
        return get_db_session().query(User).filter(User.username == username).first()
    
    @transactional
    def update_user_current_word_bank_id(self, user_id: int, word_bank_id: int) -> None:
        """
        更新用户当前词库ID
        """
        user = get_db_session().query(User).filter(User.id == user_id).first()
        user.current_word_bank_id = word_bank_id
        get_db_session().add(user)

    @readonly
    def get_user_by_id(self, id: int) -> User:
        """
        根据用户ID查询用户实体
        """
        return get_db_session().query(User).filter(User.id == id).first()    
    
    @transactional
    def update_user_info(self,user:User) -> None:
        """
        更新用户信息
        """
        # 只更新特定字段
        update_dict = {
            'nick_name': user.nick_name,
            'word_flags': user.word_flags,
            'asura_word_threshold': user.asura_word_threshold
        }
        # 过滤掉None值
        update_dict = {k: v for k, v in update_dict.items() if v is not None}
        
        get_db_session().query(User).filter(User.id == user.id).update(update_dict)

    @readonly
    def get_user_custorm_flags(self, user_id: int) -> List[str]:
        """
        获取用户自定义标签列表
        """
        user = get_db_session().query(User).filter(User.id == user_id).first()
        return user.word_flags if user.word_flags else []