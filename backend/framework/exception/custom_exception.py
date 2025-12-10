"""
自定义异常类
"""
class BusinessException(Exception):
    """业务逻辑异常基类"""
    def __init__(self, detail: str, code: int = -1):
        self.detail = detail
        self.code = code
        super().__init__(self.detail) 

class UnauthorizedException(Exception):
    """未授权异常"""
    def __init__(self, detail: str, code: int = 401):
        self.detail = detail
        self.code = code
        super().__init__(self.detail) 