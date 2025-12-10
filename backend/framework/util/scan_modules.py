"""
模块扫描工具
提供通用的包扫描、模块加载功能
"""
import importlib
import pkgutil
import os
import inspect
from pathlib import Path
from typing import List, Callable, Any, Dict, Set, Optional
from framework.util.logger import setup_logger

logger = setup_logger(__name__)

def is_package_match(package_name: str, pattern: str) -> bool:
    """
    检查包名是否匹配模式
    
    Args:
        package_name: 包名
        pattern: 匹配模式，如 "*.controller"
        
    Returns:
        是否匹配
    """
    if pattern == "*":
        return True
    if pattern.startswith("*."):
        # 处理 *.xxx 模式
        suffix = pattern[2:]  # 去掉 *. 前缀
        # 检查包名是否包含 .xxx. 或是否以 .xxx 结尾
        return f".{suffix}." in f".{package_name}." or package_name.endswith(f".{suffix}")
    return package_name == pattern

def find_matching_packages(start_package: str, pattern: str) -> List[str]:
    """
    递归查找匹配的包
    
    Args:
        start_package: 起始包名
        pattern: 匹配模式
        
    Returns:
        匹配的包名列表
    """
    matching_packages = []
    try:
        package = importlib.import_module(start_package)
        if hasattr(package, "__path__"):
            for _, name, is_pkg in pkgutil.iter_modules(package.__path__, package.__name__ + '.'):
                if is_pkg:
                    if is_package_match(name, pattern):
                        matching_packages.append(name)
                    # 递归搜索子包
                    matching_packages.extend(find_matching_packages(name, pattern))
    except (ImportError, AttributeError) as e:
        logger.error(f"扫描包 {start_package} 时出错: {e}")
    return matching_packages

def scan_modules(
    packages: List[str], 
    process_module: Callable[[Any], None],
    process_package: Optional[Callable[[Any], None]] = None,
    include_modules: bool = True,
    include_packages: bool = True
):
    """
    扫描指定包中的所有模块和子包，对每个模块和包调用指定的处理函数
    
    Args:
        packages: 要扫描的包名列表，支持模糊匹配，如 "*.controller" 表示任意父包下的 controller 包及其子包
        process_module: 处理模块的回调函数，接收模块对象作为参数
        process_package: 处理包的回调函数，接收包对象作为参数，如果为None则不处理包
        include_modules: 是否包含模块
        include_packages: 是否包含包
    """
    # 记录已处理过的模块，避免重复处理
    processed_modules: Set[str] = set()
    
    def process_single_module(module):
        """处理单个模块"""
        if module.__name__ in processed_modules:
            return
        processed_modules.add(module.__name__)
        
        if process_module and include_modules and not is_package(module):
            process_module(module)
        
        if process_package and include_packages and is_package(module):
            process_package(module)
    
    def is_package(module):
        """判断一个模块是否是包"""
        return hasattr(module, "__path__")
    
    # 处理每个包模式
    for package_pattern in packages:
        if package_pattern.startswith("*."):
            # 模糊匹配模式，从根包开始搜索
            backend_dir = Path('.')
            logger.info(f"使用backend目录: {backend_dir}")
            
            # 找出所有根包
            root_packages = []
            for item in os.listdir(backend_dir):
                item_path = os.path.join(backend_dir, item)
                if os.path.isdir(item_path) and not item.startswith('__') and not item.startswith('.'):
                    root_packages.append(item)
            logger.info(f"自动发现的根包: {root_packages}")
            
            # 在每个根包中查找匹配的包
            for root_package in root_packages:
                matching_packages = find_matching_packages(root_package, package_pattern)
                for package_name in matching_packages:
                    try:
                        # 导入匹配的包
                        package = importlib.import_module(package_name)
                        logger.info(f"导入匹配的包: {package_name}")
                        
                        # 处理包
                        process_single_module(package)
                        
                        # 递归扫描子包和模块
                        if is_package(package):
                            for _, name, is_pkg in pkgutil.iter_modules(package.__path__, package.__name__ + '.'):
                                try:
                                    module = importlib.import_module(name)
                                    process_single_module(module)
                                except ImportError as e:
                                    logger.error(f"导入模块 {name} 时出错: {e}")
                    except ImportError as e:
                        logger.error(f"导入模块 {package_name} 时出错: {e}")
        else:
            # 精确匹配模式
            try:
                package = importlib.import_module(package_pattern)
                process_single_module(package)
                
                if is_package(package):
                    for _, name, is_pkg in pkgutil.iter_modules(package.__path__, package.__name__ + '.'):
                        try:
                            module = importlib.import_module(name)
                            process_single_module(module)
                        except ImportError as e:
                            logger.error(f"导入模块 {name} 时出错: {e}")
            except (ImportError, AttributeError) as e:
                logger.error(f"扫描包 {package_pattern} 时出错: {e}")

def find_classes_in_module(
    module: Any, 
    predicate: Callable[[Any], bool]
) -> Dict[str, Any]:
    """
    在模块中查找符合条件的类
    
    Args:
        module: 模块对象
        predicate: 判断函数，接收类对象，返回是否符合条件
        
    Returns:
        字典，键为类名，值为类对象
    """
    result = {}
    for name, obj in inspect.getmembers(module, inspect.isclass):
        if predicate(obj):
            result[name] = obj
    return result

def find_modules_with_classes(
    packages: List[str], 
    class_predicate: Callable[[Any], bool]
) -> Dict[str, Dict[str, Any]]:
    """
    查找包含符合条件类的所有模块
    
    Args:
        packages: 要扫描的包名列表
        class_predicate: 判断类是否符合条件的函数
        
    Returns:
        字典，键为模块名，值为该模块中符合条件的类的字典
    """
    result = {}
    
    def process_module(module):
        classes = find_classes_in_module(module, class_predicate)
        if classes:
            result[module.__name__] = classes
    
    scan_modules(packages, process_module, include_packages=False)
    return result 