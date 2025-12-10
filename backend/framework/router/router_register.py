from fastapi import APIRouter
from framework.util.logger import setup_logger
from framework.config.config import settings
from framework.util.scan_modules import scan_modules
from framework.router.router_decorator import get_all_routers

logger = setup_logger(__name__)

def register_routers(main_router: APIRouter):
    """
    自动注册路由
    :param main_router: 要注册路由的APIRouter实例
    """
    logger.info("开始注册路由")
    
    # 扫描指定包中的所有模块并注册路由
    def process_module(module):
        """处理单个模块，用于确保模块被导入"""
        # 导入模块就足够了，路由会通过装饰器自动注册
        pass
    
    # 使用公共扫描模块扫描所有包
    scan_modules(settings.ROUTER_SCAN_PACKAGES, process_module)
    
    # 获取所有已注册的路由器并添加到主路由器
    routers = get_all_routers()
    
    for module_name, router in routers.items():
        main_router.include_router(router)
        logger.info(f"注册路由模块: {module_name}")
    
    logger.info(f"路由注册完成，共注册 {len(routers)} 个路由模块") 