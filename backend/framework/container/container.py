"""
依赖注入容器模块，扫描所有被@injectable装饰的类，并自动注册到容器中
"""
from typing import Type, TypeVar, Optional, Dict, Any, List
from dependency_injector import containers, providers
import sys
from pathlib import Path

from framework.container.container_decorator import get_services, Scope
from framework.util.logger import setup_logger
from framework.config.config import settings
from framework.util.scan_modules import scan_modules as scan_modules_util

T = TypeVar('T')

# 全局容器实例，内部使用
_container = None

# 创建logger实例
logger = setup_logger(__name__)

class Container(containers.DeclarativeContainer):
    """
    应用依赖注入容器
    用于管理应用的依赖项，包括配置和服务。
    所有服务都通过 @injectable 装饰器自动注册。
    """
    pass

def scan_modules(packages: List[str]):
    """
    扫描指定包中的所有模块，确保所有标记为服务的类都被导入
    
    Args:
        packages: 要扫描的包名列表，支持模糊匹配，如 "*.application" 表示任意父包下的 application 包及其子包
    """
    def process_module(module):
        """处理模块，只需导入即可，不需要做其他操作"""
        pass  # 模块已经被导入，依赖注入装饰器会自动注册服务
    
    # 使用公共扫描模块扫描所有包
    scan_modules_util(packages, process_module)
    logger.info(f"扫描模块完成: {packages}")

def auto_register_services(container: Container):
    """
    自动注册所有标记为服务的类到容器中
    
    Args:
        container: 依赖注入容器实例
    """
    logger.info("开始注册服务...")
    
    # 获取所有服务信息
    services = get_services()
    logger.info(f"找到 {len(services)} 个服务")
    
    # 注册所有服务
    for service_name, service_info in services.items():
        cls = service_info["cls"]
        scope = service_info["scope"]
        dependencies = service_info["dependencies"]
        
        # 使用全限定名作为服务标识符，避免不同包中同名服务的冲突
        # 格式: package_path_ClassName, 例如: app_services_user_UserService
        # 将点替换为下划线
        package_path = cls.__module__.replace('.', '_')
        class_name = cls.__name__
        qualified_service_name = f"{package_path}_{class_name}"
        
        logger.info(f"注册服务: {qualified_service_name} (原名: {service_name}), 依赖: {dependencies}")
        
        # 检查依赖是否都已满足
        kwargs = {}
        all_deps_met = True
        
        for param_name, param_type in dependencies.items():
            # 尝试找到依赖
            dependency_found = False
            
            # 1. 按参数名查找
            if hasattr(container, param_name):
                kwargs[param_name] = getattr(container, param_name)
                dependency_found = True
                
            # 2. 按类型名查找
            elif hasattr(param_type, "__name__"):
                # 尝试获取类型名
                type_name = param_type.__name__
                
                # 使用原始类名
                service_name_by_type = type_name
                
                if hasattr(container, service_name_by_type):
                    kwargs[param_name] = getattr(container, service_name_by_type)
                    dependency_found = True
                    
                # 也尝试搜索全限定名格式的依赖
                else:
                    # 尝试所有可能的模块名
                    for potential_service_name in dir(container):
                        if not potential_service_name.startswith('_') and potential_service_name.endswith(f"_{service_name_by_type}"):
                            kwargs[param_name] = getattr(container, potential_service_name)
                            dependency_found = True
                            logger.info(f"    找到依赖: {param_name} -> {potential_service_name}")
                            break
            
            # 3. 检查是否是Settings类型
            elif param_type.__name__ == "Settings":
                kwargs[param_name] = settings
                dependency_found = True
            
            if not dependency_found:
                all_deps_met = False
                logger.warning(f"  缺少依赖: {param_name}: {param_type.__name__ if hasattr(param_type, '__name__') else str(param_type)}")
        
        # 如果所有依赖都已满足，则注册服务
        if all_deps_met:
            provider = _create_provider(cls, scope, **kwargs)
            setattr(container, qualified_service_name, provider)
            
            # 为了向后兼容，同时注册原始名称 (可选,如果确定没有冲突)
            # 使用原始类名
            original_service_name = class_name
            if not hasattr(container, original_service_name):
                setattr(container, original_service_name, provider)
                logger.info(f"  同时注册服务别名: {original_service_name}")
                
            logger.info(f"  成功注册服务: {qualified_service_name}")
        else:
            logger.warning(f"  无法注册服务: {qualified_service_name}, 缺少依赖")

def _create_provider(cls, scope, **kwargs):
    """
    根据服务作用域创建相应的提供者
    
    Args:
        cls: 服务类
        scope: 服务作用域
        **kwargs: 依赖参数
    
    Returns:
        创建的提供者实例
    """
    if scope == Scope.SINGLETON:
        return providers.Singleton(cls, **kwargs)
    elif scope == Scope.FACTORY:
        return providers.Factory(cls, **kwargs)
    elif scope == Scope.REQUEST:
        # REQUEST作用域也使用Factory，在请求中间件中控制生命周期
        return providers.Factory(cls, **kwargs)
    else:
        raise ValueError(f"不支持的作用域类型: {scope}")

def initialize_container(container: Optional[Container] = None, container_scan_packages: Optional[List[str]] = None) -> Container:
    """
    初始化依赖注入容器，包括创建容器、扫描包、注册服务和连接容器
    
    Args:
        container: 可选的依赖注入容器实例，如果不提供则创建新的
        container_scan_packages: 要扫描的包列表，默认扫描core和services
        
    Returns:
        配置好的容器实例
    """
    global _container
    
    # 如果没有提供容器，则创建一个新的
    if container is None:
        container = Container()
    
    # 默认扫描的包
    if container_scan_packages is None:
        container_scan_packages = ["core", "services"]
    
    # 扫描所有模块以确保服务类被导入
    logger.info(f"扫描模块: {container_scan_packages}")
    scan_modules(container_scan_packages)
    
    # 自动注册所有标记为服务的类
    auto_register_services(container)
    
    # 记录提供者
    provider_names = [name for name in dir(container) if not name.startswith("_")]
    logger.info(f"容器中的提供者: {provider_names}")
    
    # 存储全局容器引用
    _container = container
    logger.info("容器初始化完成")
    
    return container

def get_service(service_type: Type[T]) -> T:
    """
    从全局容器中获取服务实例
    
    Args:
        service_type: 服务类型
        
    Returns:
        服务实例
        
    Raises:
        ValueError: 如果全局容器未初始化
        ValueError: 如果服务未注册
        
    Example:
        from core.container import get_service
        from services.user_service import UserService
        
        user_service = get_service(UserService)
    """
    global _container
    
    if _container is None:
        raise ValueError("全局依赖注入容器尚未初始化。请先调用 initialize_container() 函数。")
    
    # 使用原始类名
    service_name = service_type.__name__
    
    # 尝试获取全限定名
    package_path = service_type.__module__.replace('.', '_')
    qualified_service_name = f"{package_path}_{service_name}"
    
    # 首先按全限定名查找
    if hasattr(_container, qualified_service_name):
        provider = getattr(_container, qualified_service_name)
        return provider()
    
    # 然后尝试按简单名称查找（向后兼容）
    if hasattr(_container, service_name):
        provider = getattr(_container, service_name)
        return provider()
    
    # 如果找不到服务，尝试查找所有可能的限定名
    potential_providers = [
        name for name in dir(_container) 
        if not name.startswith('_') and name.endswith(f"_{service_name}")
    ]
    
    if potential_providers:
        if len(potential_providers) > 1:
            logger.warning(f"发现多个匹配的服务: {potential_providers}, 使用第一个: {potential_providers[0]}")
        provider = getattr(_container, potential_providers[0])
        return provider()
    
    # 最后，如果仍然找不到服务，则抛出异常
    raise ValueError(f"服务 {service_type.__name__} 未注册到容器中。尝试查找名称: {service_name}, {qualified_service_name}")

# 在模块导入时自动初始化容器
_container = initialize_container(container_scan_packages=settings.CONTAINER_SCAN_PACKAGES)

# 对外暴露的容器实例
container = _container
    