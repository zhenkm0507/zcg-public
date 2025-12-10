"""
用户DTO模块，定义用户相关的数据模型
"""
from pydantic import BaseModel, Field
from typing import List, Optional

class UserDto(BaseModel):
    """
    用户响应数据模型，登录成功后返回的用户信息
    """
    id: Optional[int] = Field(default=None, description="主键")
    username: Optional[str] = Field(default=None, description="用户名称")
    nick_name: Optional[str] = Field(..., description="用户昵称")
    current_word_bank_id: Optional[int] = Field(default=None, description="当前用户所选词库ID")
    word_flags: Optional[List[str]] = Field(default_factory=list, description="用户在每个词库里设置的自定义标签")
    asura_word_threshold: Optional[int] = Field(default=3, description="斩杀单词的阈值")

