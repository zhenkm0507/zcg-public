"""
用户控制器模块，处理用户相关的请求
"""
from typing import List
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from user.application.user_app_service import UserAppService
from user.dto.user_dto import UserDto
from framework.model.common import BaseResponse
from framework.util.logger import setup_logger
from framework.container.container import get_service
from functools import partial
from framework.util.auth import get_current_user
from framework.router.router_decorator import router_controller

# 创建logger实例
logger = setup_logger(__name__)

@router_controller(prefix="/user", tags=["用户管理"])
def user_controller(router: APIRouter):
    """用户管理控制器"""
    
    @router.get(
        "/info",
        response_model=BaseResponse[UserDto],
        summary="获取用户详情",
        description="获取当前登录用户的详细信息"
    )
    async def get_user_info(
        current_user: str = Depends(get_current_user),
        user_app_service: UserAppService = Depends(partial(get_service, UserAppService))
    ):
        
        logger.info(f"获取用户信息: {current_user}")
        user_dto = user_app_service.get_user_by_username(current_user["user_name"])
             
        return BaseResponse(
                code=0,
                message="获取用户信息成功",
                data=user_dto
        )
    
    @router.get(
        "/get_user_info_by_id",
        response_model=BaseResponse[UserDto],
        summary="获取用户设置信息",
        description="获取用户设置信息"
    )
    async def get_user_info(
        current_user: str = Depends(get_current_user),
        user_app_service: UserAppService = Depends(partial(get_service, UserAppService))
    ):
        user_dto = user_app_service.get_user_by_id(current_user["user_id"])
        return BaseResponse(
                code=0,
                message="获取用户信息成功",
                data=user_dto
        )
    
    @router.post(
        "/update_user_info",
        response_model=BaseResponse,
        summary="更新用户信息",
        description="更新用户信息"
    )
    async def update_user_info(
        current_user: str = Depends(get_current_user),
        user_dto: UserDto = Body(...),
        user_app_service: UserAppService = Depends(partial(get_service, UserAppService))
    ):
        user_dto.id = current_user["user_id"]
        user_app_service.update_user_info(user_dto)
        return BaseResponse(
                code=0,
                message="更新用户信息成功"
        )
    
    @router.get(
        "/get_user_custorm_flags",
        response_model=BaseResponse[List[str]],
        summary="获取用户自定义标签列表",
        description="获取用户自定义标签列表"
    )
    async def get_user_custorm_flags(   
        current_user: str = Depends(get_current_user),
        user_app_service: UserAppService = Depends(partial(get_service, UserAppService))
    ):
        user_flags = user_app_service.get_user_custorm_flags(current_user["user_id"])
        return BaseResponse(
                code=0,
                message="获取用户自定义标签列表成功",
                data=user_flags
        )
    return router
    