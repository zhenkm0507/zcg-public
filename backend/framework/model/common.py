from pydantic import BaseModel
from typing import Generic, TypeVar, Optional

T = TypeVar('T')

class BaseResponse(BaseModel, Generic[T]):
    """
    通用响应模型
    """
    code: int = 0
    message: str = "success"
    data: Optional[T] = None 