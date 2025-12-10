"""
应用启动管理器，用于在应用启动时自动初始化需要启动时初始化的服务
"""
from typing import List, Type, Callable, Any
from framework.util.logger import setup_logger

logger = setup_logger(__name__)

class StartupManager:
    """应用启动管理器"""
    
    def __init__(self):
        self._startup_services: List[str] = []  # 存储服务类名而不是类对象
        self._startup_functions: List[Callable] = []
    
    def register_startup_service(self, service_type: Type):
        """注册需要在启动时初始化的服务"""
        # 存储服务的模块路径和类名
        service_path = f"{service_type.__module__}.{service_type.__name__}"
        self._startup_services.append(service_path)
        return self
    
    def register_startup_function(self, func: Callable):
        """注册需要在启动时执行的函数"""
        self._startup_functions.append(func)
        return self
    
    def initialize_all(self):
        """初始化所有注册的服务和函数"""
        logger.info("开始执行启动时初始化...")
        
        # 初始化服务
        for service_path in self._startup_services:
            try:
                # 动态导入服务类
                module_name, class_name = service_path.rsplit('.', 1)
                module = __import__(module_name, fromlist=[class_name])
                service_type = getattr(module, class_name)
                
                # 获取服务实例
                from framework.container.container import get_service
                service = get_service(service_type)
                logger.info(f"启动时服务初始化成功: {class_name}")
            except Exception as e:
                logger.warning(f"启动时服务初始化失败 {service_path}: {e}")
        
        # 执行启动函数
        for func in self._startup_functions:
            try:
                func()
                logger.info(f"启动时函数执行成功: {func.__name__}")
            except Exception as e:
                logger.warning(f"启动时函数执行失败 {func.__name__}: {e}")
        
        logger.info("启动时初始化完成")

# 全局启动管理器实例
startup_manager = StartupManager()

def register_startup_service(service_type: Type):
    """装饰器：注册需要在启动时初始化的服务"""
    startup_manager.register_startup_service(service_type)
    return service_type

def register_startup_function(func: Callable):
    """装饰器：注册需要在启动时执行的函数"""
    startup_manager.register_startup_function(func)
    return func 