"""
全局统一配置模块
"""
from pydantic_settings import BaseSettings
from pydantic import Field
import os
from typing import Dict, List, Any
from dotenv import load_dotenv
from framework.util.logger import setup_logger
from pathlib import Path
import secrets

# 创建logger
logger = setup_logger(__name__)

# 确定环境变量文件路径
# env_name = os.getenv('ENV', 'dev')
# env_file = Path(f'.env.{env_name}')
env_file = Path(f'.env')
logger.info(f"当前工作目录: {os.getcwd()}")
logger.info(f"尝试加载环境变量文件: {env_file.absolute()}")
# 加载环境变量文件
logger.info(f"尝试加载环境变量文件: {env_file}")

if env_file.exists():
    logger.info(f"找到环境变量文件: {env_file}")
    load_dotenv(dotenv_path=env_file)
    # 添加调试日志
    logger.info(f"环境变量文件内容: {env_file.read_text()}")
else:
    logger.warning(f"环境变量文件不存在: {env_file}，将使用默认值")

class Settings(BaseSettings):
    """
    应用程序设置
    """
    # 基本配置
    DEBUG: bool = Field(default=False)
    APP_NAME: str = Field(default="斩词阁")
    # 服务扫描配置
    CONTAINER_SCAN_PACKAGES: List[str] = Field(default=["*.application", "*.domain.service"])
    ROUTER_SCAN_PACKAGES: List[str] = Field(default=["*.controller"])

    # 日志配置
    LOG_LEVEL: str = Field(default="INFO")
    LOG_DIR: str = Field(default="logs")  # 日志目录
    LOG_FILE: str = Field(default="app.log")  # 日志文件名
    LOG_MAX_BYTES: int = Field(default=10485760)  # 日志文件最大字节数，默认 10MB
    LOG_BACKUP_COUNT: int = Field(default=5)  # 日志文件备份数量
    
    # CORS配置
    CORS_ORIGINS: List[str] = Field(
        default=["http://192.168.0.101:3000","http://192.168.0.101:8000"]
    )
    CORS_ALLOW_METHODS: List[str] = Field(default=["*"])
    CORS_ALLOW_HEADERS: List[str] = Field(default=["*"])
    CORS_ALLOW_CREDENTIALS: bool = Field(default=True, description="是否允许包含凭证")

    # 数据库配置 
    DB_HOST: str = Field(default="localhost")
    DB_PORT: int = Field(default=5432)
    DB_DATABASE: str = Field(default="postgres")
    DB_USER: str = Field(default="user")
    DB_PASSWORD: str = Field(default="password")
    SQL_ECHO: bool = Field(default=False, description="是否打印SQL语句")  # 临时改为True用于调试

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return (
            f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_DATABASE}"
        )

    # JWT配置
    JWT_SECRET_KEY: str = Field(default=secrets.token_urlsafe(32))
    JWT_ALGORITHM: str = Field(default="HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60 * 24)  # 24小时
    JWT_WHITE_LIST: List[str] = Field(
        default=["/api/v1/health", "/docs", "/redoc", "/api/v1/auth/login"],
        env="JWT_WHITE_LIST"
    )
    # 业务
    USER_LEVEL: str = Field(default="C")  # 默认用户等级
    DICTIONARY_PATH: str = Field(default="/Users/yangzhao/work/一本词汇")  # 词库路径
    DIFY_API_URL: str = Field(default="app-xxxxxxxx")  # dify api
    DIFY_API_KEY: Dict[str, str] = Field(default={"app-xxxxxxxx": "app-xxxxxxxx"})  # dify api key
    DIFY_USER: str = Field(default="user")  # dify user
    NLTK_DATA_DIR: str = Field(default="~/nltk_data")  # nltk data dir
    
    class Config:
        env_file = str(env_file) if env_file.exists() else None
        env_file_encoding = "utf-8"
        extra = "ignore"  # 忽略额外的属性
        case_sensitive = True  # 区分大小写
        validate_assignment = True  # 赋值时验证

# 创建全局Settings实例
logger.info("开始创建 Settings 实例")
settings = Settings()
logger.info("Settings 实例创建完成")