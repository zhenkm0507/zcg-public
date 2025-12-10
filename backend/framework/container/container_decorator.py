"""
依赖注入容器装饰器
"""
from typing import Type, TypeVar, Dict, Any, Optional, get_type_hints
from enum import Enum
import inspect

T = TypeVar('T')

class Scope(str, Enum):
    """服务的作用域类型"""
    SINGLETON = "singleton"  # 单例，全局唯一实例
    FACTORY = "factory"      # 工厂，每次请求创建新实例
    REQUEST = "request"      # 请求作用域，每个请求内唯一

# 存储所有标记为服务的类信息
_services: Dict[str, Dict[str, Any]] = {}

def injectable(cls: Type[T] = None, *, scope: Scope = Scope.SINGLETON, name: Optional[str] = None) -> Type[T]:
    """
    类装饰器，标记一个类为服务，会被自动注册到容器中
    
    Args:
        cls: 要注册的服务类
        scope: 服务的作用域，默认为单例
        name: 服务名称，默认为类名首字母小写
    
    使用方式:
    @injectable
    class MyService:
        def __init__(self, config: Settings):
            self.config = config
            
    @injectable(scope=Scope.FACTORY)
    class MyFactoryService:
        def __init__(self):
            pass
    """
    def decorator(cls: Type[T]) -> Type[T]:
        # 获取类名作为服务名
        service_name = name or f"{cls.__name__[0].lower()}{cls.__name__[1:]}"
        
        # 提取依赖信息
        dependencies = _extract_dependencies(cls)
        
        # 记录服务信息
        _services[service_name] = {
            "cls": cls,
            "scope": scope,
            "dependencies": dependencies
        }
        
        # 标记类，方便识别
        cls.__di_registered__ = True
        cls.__di_scope__ = scope
        cls.__di_name__ = service_name
        
        return cls
    
    # 支持无参数调用和有参数调用
    if cls is None:
        return decorator
    return decorator(cls)

def _extract_dependencies(cls):
    """提取类初始化方法的依赖"""
    dependencies = {}
    
    try:
        # 获取构造函数的类型注解
        type_hints = get_type_hints(cls.__init__)
        
        # 获取构造函数的参数
        signature = inspect.signature(cls.__init__)
        
        # 遍历所有参数
        for param_name, param in signature.parameters.items():
            if param_name not in ["self", "args", "kwargs", "return"]:
                # 如果参数有类型注解，则添加到依赖列表
                if param_name in type_hints:
                    dependencies[param_name] = type_hints[param_name]
    except (AttributeError, TypeError):
        # 有些类可能没有__init__方法或不是常规类
        pass
    
    return dependencies

def get_services():
    """获取所有注册的服务信息"""
    return _services.copy() 