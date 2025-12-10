"""
数据库装饰器模块，定义用于DB操作的装饰器
"""
from functools import wraps
from framework.database.db_factory import (
    SessionLocal,
    get_db_session,
    set_db_session,
    is_outer_session,
    clear_db_session
)
from sqlalchemy import text
from framework.util.logger import setup_logger

logger = setup_logger(__name__)

def transactional(func=None, *, auto_commit=True):
    """
    事务管理装饰器，用于需要写操作的方法
    
    Args:
        func: 被装饰的函数
        auto_commit: 是否自动管理事务提交/回滚。如果为False，需要手动调用commit/rollback
        
    使用方式:
    @transactional  # 使用默认设置（auto_commit=True）
    def create_user(user_data: dict):
        # 自动提交事务
        pass
    
    @transactional(auto_commit=False)  # 手动控制事务
    def complex_operation(data: dict):
        # 需要手动调用 commit/rollback
        pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 检查是否在只读事务中
            current_session = get_db_session()
            if current_session is not None and not is_outer_session():
                logger.warning(f"Attempting to start a transaction inside a readonly context: {func.__name__}")
                raise RuntimeError("Cannot start a transaction inside a readonly context")

            # 尝试从上下文获取 db_session
            session = current_session
            is_outer = False
            
            # 如果上下文中没有 db_session，创建新的
            if session is None:
                session = SessionLocal()
                is_outer = True
                set_db_session(session, is_outer=True)
            
            try:
                # 移除 kwargs 中的 db_session，避免重复传递
                kwargs.pop('db_session', None)
                result = func(*args, **kwargs)
                
                # 根据 auto_commit 参数决定是否自动提交
                if is_outer and auto_commit:
                    session.commit()
                    logger.debug(f"Transaction committed for {func.__name__}")
                return result
            except Exception as e:
                if is_outer and auto_commit:
                    session.rollback()
                    logger.debug(f"Transaction rolled back for {func.__name__} due to: {str(e)}")
                raise e
            finally:
                # 只有外层装饰器才关闭 session
                if is_outer:
                    session.close()
                    clear_db_session()
                    logger.debug(f"Session closed for {func.__name__}")
        return wrapper
    
    # 支持@transactional和@transactional(auto_commit=False)两种用法
    if func is None:
        return decorator
    return decorator(func)

def readonly(func=None):
    """
    只读操作装饰器，用于不需要写操作的方法
    自动将会话设置为只读模式，优化性能
    
    使用方式:
    @readonly
    def get_user_by_id(user_id: int):
        # 只读操作...
        pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 尝试从上下文获取 db_session
            session = get_db_session()
            is_outer = False
            
            # 如果上下文中没有 db_session，创建新的
            if session is None:
                session = SessionLocal()
                is_outer = True
                set_db_session(session, is_outer=True)
                
                # 设置只读标记
                session.info['read_only'] = True
                # PostgreSQL支持设置事务为READ ONLY
                session.execute(text('SET TRANSACTION READ ONLY'))
            
            try:
                # 移除 kwargs 中的 db_session，避免重复传递
                kwargs.pop('db_session', None)
                return func(*args, **kwargs)
            finally:
                # 只有外层装饰器才关闭 session
                if is_outer:
                    session.close()
                    clear_db_session()
                    logger.debug(f"Readonly session closed for {func.__name__}")
        return wrapper
    
    # 支持@readonly直接使用
    if func is None:
        return decorator
    return decorator(func)