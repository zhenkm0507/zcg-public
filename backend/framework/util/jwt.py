"""
JWT工具模块，用于创建和验证JWT token
"""
from datetime import datetime, timedelta, UTC
from jose import jwt, JWTError
from framework.config.config import settings
from typing import Dict, Any, Optional

def create_access_token(data: Dict[str, Any]) -> str:
    """
    创建访问令牌
    :param data: 要编码到token中的数据
    :return: JWT token字符串
    """
    to_encode = data.copy()
    current_time = datetime.now(UTC)
    expire = current_time + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    to_encode.update({"iat": current_time})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    验证token
    :param token: JWT token字符串
    :return: token的payload数据，如果验证失败则返回None
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None 