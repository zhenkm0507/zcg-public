from typing import Dict
from fastapi import APIRouter
from functools import wraps
from framework.util.logger import setup_logger

logger = setup_logger(__name__)

# 全局路由注册表
# 格式: {"module_name": router}
ROUTER_REGISTRY = {}

def router_controller(prefix: str = "", tags: list = None):
    """
    控制器注册装饰器，用于注册路由前缀和标签
    
    使用方式:
    @register_controller(prefix="/api", tags=["用户"])
    def user_router():
        router = APIRouter()
        
        @router.get("/users")
        def get_users():
            return {"users": []}
            
        return router
    
    :param prefix: 路由前缀
    :param tags: 路由标签
    :return: 装饰器函数
    """
    def decorator(func):
        # 创建路由器
        router = APIRouter(prefix=prefix, tags=tags or [])
        
        # 将路由器作为函数返回值
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 调用原始函数，可能会在函数内定义路由
            result = func(router, *args, **kwargs)
            
            # 获取模块名称
            module_name = func.__module__
            
            # 注册到全局路由注册表
            ROUTER_REGISTRY[module_name] = router
            
            logger.info(f"注册控制器: {module_name} 前缀={prefix} 标签={tags}")
            
            return result
        
        # 将路由器附加到函数
        wrapper.router = router
        
        # 立即执行包装函数，注册路由
        wrapper()
        
        return wrapper
    
    return decorator

def get_all_routers() -> Dict[str, APIRouter]:
    """
    获取所有已注册的路由器
    
    :return: 路由器字典，键为模块名称，值为路由器对象
    """
    result = {}
    for module_name, router in ROUTER_REGISTRY.items():
        result[module_name] = router
    return result 