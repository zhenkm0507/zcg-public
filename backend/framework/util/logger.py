"""
日志模块，用于设置和返回一个配置好的logger实例
"""
import logging
import sys
import os
from pathlib import Path
from logging.handlers import RotatingFileHandler

# 创建一个基本的默认配置
DEFAULT_LOG_LEVEL = "INFO"
DEFAULT_LOG_DIR = "logs"
DEFAULT_LOG_FILE = "app.log"
DEFAULT_LOG_MAX_BYTES = 10485760  # 10MB
DEFAULT_LOG_BACKUP_COUNT = 5

def setup_logger(name: str) -> logging.Logger:
    """
    设置并返回一个配置好的logger实例
    
    Args:
        name: logger的名称，通常使用 __name__
    
    Returns:
        配置好的logger实例
    """
    logger = logging.getLogger(name)
    
    # 避免重复添加处理器
    if logger.handlers:
        return logger
    
    # 获取配置
    log_level = os.getenv("LOG_LEVEL", DEFAULT_LOG_LEVEL)
    log_dir = os.getenv("LOG_DIR", DEFAULT_LOG_DIR)
    log_file = os.getenv("LOG_FILE", DEFAULT_LOG_FILE)
    log_max_bytes = int(os.getenv("LOG_MAX_BYTES", DEFAULT_LOG_MAX_BYTES))
    log_backup_count = int(os.getenv("LOG_BACKUP_COUNT", DEFAULT_LOG_BACKUP_COUNT))
    
    # 创建日志目录
    log_dir_path = Path(log_dir)
    log_dir_path.mkdir(parents=True, exist_ok=True)
    
    # 日志格式
    log_format = logging.Formatter(
       '%(asctime)s - %(name)s - [%(process)d:%(thread)d] - %(levelname)s - %(message)s'
    )
    
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    
    # 控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(log_format)
    logger.addHandler(console_handler)
    
    # 文件处理器
    file_handler = RotatingFileHandler(
        filename=log_dir_path/log_file,
        maxBytes=log_max_bytes,
        backupCount=log_backup_count,
        encoding='utf-8'
    )
    file_handler.setFormatter(log_format)
    logger.addHandler(file_handler)
    
    return logger 