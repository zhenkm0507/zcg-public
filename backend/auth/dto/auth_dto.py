"""
用户认证DTO模块，定义用户登录请求和响应的数据模型
"""
from pydantic import BaseModel, Field
from typing import Optional

class LoginRequest(BaseModel):
    """
    用户登录请求数据模型
    """
    username: str = Field(..., description="用户登录名，区分大小写", example="zhangsan")
    password: str = Field(..., description="用户密码，长度至少6位", example="******")
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "zhangsan", 
                "password": "secure_password"
            }
        }

class LoginResponse(BaseModel):
    """
    用户响应数据模型，登录成功后返回的用户信息
    """
    username: str = Field(..., description="用户名称")
    level: str = Field(..., description="用户等级，例如：A、B、C等")
    welcome_message: str = Field(..., description="欢迎信息文本")
    token: str = Field(..., description="JWT访问令牌")
    token_type: str = Field(default="bearer", description="令牌类型")
    is_need_select_word_bank: bool = Field(..., description="是否需要选择词库")
    
   
class TokenResponse(BaseModel):
    """
    令牌响应数据模型，登录成功后返回的令牌
    """
    access_token: str = Field(..., description="JWT访问令牌")
    token_type: str = Field(default="bearer", description="令牌类型")
    
    