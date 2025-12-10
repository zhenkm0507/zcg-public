"""
认证工具模块，用于获取当前登录用户
"""
from typing import Any, Dict
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from framework.exception.custom_exception import UnauthorizedException
from framework.util.jwt import verify_token
from framework.util.logger import setup_logger

# 创建logger实例
logger = setup_logger(__name__)

# 创建HTTPBearer实例
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    获取当前登录用户
    """
    try:
        # 从Authorization头中获取token
        token = credentials.credentials
        logger.debug(f"验证token: {token}")
        
        # 验证token
        payload = verify_token(token)
        if not payload:
            logger.warning("token验证失败")
            raise UnauthorizedException(detail="无效的认证凭据")
        
        # 获取用户名
        username = payload.get("sub")
        user_id = payload.get("sub_id")
        if not username:
            logger.warning("token中缺少用户名")
            raise UnauthorizedException(detail="无效的认证凭据")
        
        # logger.info(f"用户认证成功: {username}")
        return {"user_name": username, "user_id": user_id}
    except Exception as e:
        logger.error(f"用户认证失败: {str(e)}")
        raise UnauthorizedException(detail="无效的认证凭据")