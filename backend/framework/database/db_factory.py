"""
数据库模块，提供数据库配置、会话工厂和会话上下文管理
"""
from contextvars import ContextVar
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from framework.config.config import settings
import json
from framework.util.logger import setup_logger
import logging
import time

logger = setup_logger(__name__)

# 创建专门的SQL日志记录器
sql_logger = logging.getLogger('sqlalchemy.engine')
sql_logger.setLevel(logging.INFO)

# 自定义JSON编码器，保持中文字符
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        return super().default(obj)
    
    def encode(self, obj):
        return super().encode(obj).encode('utf-8').decode('utf-8')

# 数据库引擎和会话工厂
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI, 
    echo=settings.SQL_ECHO,  # 使用配置控制是否打印SQL语句
    future=True,
    # 连接池配置 - 解决连接意外关闭问题
    pool_size=10,  # 连接池大小
    max_overflow=20,  # 超出pool_size后最多可以创建的连接数
    pool_timeout=30,  # 连接池获取连接的超时时间
    pool_recycle=3600,  # 连接在连接池中的回收时间（秒），1小时
    pool_pre_ping=True,  # 每次连接前ping一下，确保连接有效
    pool_reset_on_return='commit',  # 连接返回时重置状态
    # JSON序列化配置
    json_serializer=lambda obj: json.dumps(obj, ensure_ascii=False, cls=CustomJSONEncoder),
    json_deserializer=lambda obj: json.loads(obj)
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 会话上下文管理
db_session_context: ContextVar[Session] = ContextVar('db_session', default=None)
is_outer_session_context: ContextVar[bool] = ContextVar('is_outer_session', default=False)

def get_db_session() -> Session:
    """
    从上下文中获取数据库会话
    
    Returns:
        Session: 数据库会话对象
    """
    return db_session_context.get()

def set_db_session(session: Session, is_outer: bool = False) -> None:
    """
    设置数据库会话到上下文中
    
    Args:
        session: 数据库会话
        is_outer: 是否是外层装饰器创建的会话
    """
    db_session_context.set(session)
    is_outer_session_context.set(is_outer)

def is_outer_session() -> bool:
    """
    判断当前会话是否是外层装饰器创建的
    
    Returns:
        bool: 是否是外层会话
    """
    return is_outer_session_context.get()

def clear_db_session() -> None:
    """
    清除上下文中的数据库会话
    """
    db_session_context.set(None)
    is_outer_session_context.set(False)

def check_db_connection() -> bool:
    """
    检查数据库连接是否正常
    
    Returns:
        bool: 连接是否正常
    """
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            result.fetchone()
            return True
    except Exception as e:
        logger.error(f"数据库连接检查失败: {str(e)}")
        return False

def get_pool_status() -> dict:
    """
    获取连接池状态信息
    
    Returns:
        dict: 连接池状态
    """
    pool = engine.pool
    return {
        "pool_size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "invalid": 0  # SQLAlchemy 2.0 中移除了 invalid() 方法
    }

def log_pool_status():
    """
    记录连接池状态日志
    """
    status = get_pool_status()
    logger.info(f"连接池状态: {status}")