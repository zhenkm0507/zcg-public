"""
实体转换工具模块，用于 SQLAlchemy ORM 实体对象与 Pydantic DTO 模型之间的互相转换
"""
from typing import TypeVar, Type, List, Dict, Any, Optional, Union, Generic
from pydantic import BaseModel
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import inspect

# 类型变量定义
T = TypeVar('T', bound=BaseModel)  # Pydantic 模型类型
E = TypeVar('E', bound=DeclarativeBase)  # SQLAlchemy 实体类型

def orm_to_dto(orm_obj: Any, dto_class: Type[T]) -> T:
    """
    将单个 SQLAlchemy ORM 对象转换为 Pydantic DTO 模型
    
    Args:
        orm_obj: SQLAlchemy ORM 对象
        dto_class: Pydantic DTO 模型类
        
    Returns:
        转换后的 Pydantic DTO 模型实例
    """
    # 获取对象的字典表示
    if hasattr(orm_obj, '__dict__'):
        # 过滤掉 SQLAlchemy 内部属性
        orm_dict = {k: v for k, v in vars(orm_obj).items() if not k.startswith('_')}
    else:
        # 如果对象没有 __dict__ 属性，尝试将其转换为字典
        orm_dict = dict(orm_obj) if hasattr(orm_obj, 'items') else {}
    
    # 检查并处理列表类型的字段，将None值转换为空列表
    for field_name, field in dto_class.__annotations__.items():
        # 检查字段是否存在于orm_dict中
        if field_name in orm_dict:
            field_value = orm_dict[field_name]
            # 检查字段类型是否为List
            field_type = str(field)
            if 'list' in field_type.lower() or field_type.startswith('List'):
                # 如果值为None，转换为空列表
                if field_value is None:
                    orm_dict[field_name] = []
                # 如果值已经是列表，确保列表中的元素都是字符串（对于List[str]类型）
                elif isinstance(field_value, list) and 'str' in field_type.lower():
                    # 确保列表中的每个元素都是字符串
                    orm_dict[field_name] = [str(item) for item in field_value]
        
    # 使用 Pydantic 的 model_validate 方法从字典创建 DTO
    return dto_class.model_validate(orm_dict)

def orm_to_dto_list(orm_list: List[Any], dto_class: Type[T]) -> List[T]:
    """
    将 SQLAlchemy ORM 对象列表转换为 Pydantic DTO 模型列表
    
    Args:
        orm_list: SQLAlchemy ORM 对象列表
        dto_class: Pydantic DTO 模型类
        
    Returns:
        转换后的 Pydantic DTO 模型实例列表
    """
    return [orm_to_dto(orm_obj, dto_class) for orm_obj in orm_list]

def dto_to_orm(dto_obj: T, orm_class: Type[E], existing_orm_obj: Optional[E] = None) -> E:
    """
    将 Pydantic DTO 模型转换为 SQLAlchemy ORM 实体对象
    
    Args:
        dto_obj: Pydantic DTO 模型实例
        orm_class: SQLAlchemy ORM 实体类
        existing_orm_obj: 可选的现有 ORM 对象，用于更新而非创建新对象
        
    Returns:
        转换后的 SQLAlchemy ORM 实体对象
    """
    # 将 DTO 对象转换为字典
    dto_dict = dto_obj.model_dump()
    
    # 获取 ORM 类的字段列表
    if existing_orm_obj is not None:
        # 更新现有对象
        orm_obj = existing_orm_obj
        # 获取 ORM 类的字段列表
        mapper = inspect(orm_class)
        orm_columns = [column.key for column in mapper.columns]
        
        # 只更新 ORM 对象中存在的字段
        for key, value in dto_dict.items():
            if key in orm_columns and hasattr(orm_obj, key):
                setattr(orm_obj, key, value)
    else:
        # 创建新对象
        # 过滤掉 ORM 类中不存在的字段
        mapper = inspect(orm_class)
        orm_columns = [column.key for column in mapper.columns]
        filtered_dict = {k: v for k, v in dto_dict.items() if k in orm_columns}
        
        # 创建 ORM 对象
        orm_obj = orm_class(**filtered_dict)
    
    return orm_obj

def dto_to_orm_list(dto_list: List[T], orm_class: Type[E]) -> List[E]:
    """
    将 Pydantic DTO 模型列表转换为 SQLAlchemy ORM 实体对象列表
    
    Args:
        dto_list: Pydantic DTO 模型实例列表
        orm_class: SQLAlchemy ORM 实体类
        
    Returns:
        转换后的 SQLAlchemy ORM 实体对象列表
    """
    return [dto_to_orm(dto_obj, orm_class) for dto_obj in dto_list] 