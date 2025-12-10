"""
JWT认证逻辑模块
"""
from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from jose import jwt, JWTError
from datetime import datetime, timedelta
from framework.exception.custom_exception import UnauthorizedException
from framework.config.config import settings

class JWTBearer(HTTPBearer):
    """
    自定义FastAPI的HTTPBearer认证类，被FastAPI的依赖注入系统使用
    """
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)
        self.white_list: List[str] = settings.JWT_WHITE_LIST
        
    async def __call__(self, request: Request) -> Optional[HTTPAuthorizationCredentials]:
        # 检查是否在白名单中
        if any(request.url.path.startswith(path) for path in self.white_list):
            return None

        # 直接检查Authorization头
        authorization: str = request.headers.get("Authorization")
        if not authorization:
            raise UnauthorizedException(detail="未提供认证信息")

        scheme, credentials = self._get_authorization_scheme_param(authorization)
        if not (scheme and credentials):
            raise UnauthorizedException(detail="无效的认证格式")

        if scheme.lower() != "bearer":
            raise UnauthorizedException(detail="无效的认证方案")
            
        try:
            # 使用 python-jose 验证 JWT token
            payload = jwt.decode(
                credentials,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            # 可以在这里添加额外的验证，比如检查 token 是否过期
            if datetime.fromtimestamp(payload.get("exp", 0)) < datetime.now():
                raise UnauthorizedException(detail="token已过期")
               
            return HTTPAuthorizationCredentials(scheme=scheme, credentials=credentials)
        except JWTError:
            raise UnauthorizedException(detail="无效的token")
        
    def _get_authorization_scheme_param(self, authorization: str) -> tuple[str | None, str | None]:
        """从Authorization头中提取认证方案和凭据"""
        if not authorization:
            return None, None
        parts = authorization.split()
        if len(parts) != 2:
            return None, None
        return parts[0], parts[1]

    def add_to_white_list(self, path: str):
        """添加路径到白名单"""
        self.white_list.append(path)

    def remove_from_white_list(self, path: str):
        """从白名单中移除路径"""
        if path in self.white_list:
            self.white_list.remove(path) 