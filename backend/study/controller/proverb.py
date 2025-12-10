# 创建logger实例
from functools import partial
from typing import List
from fastapi import APIRouter, Depends, Query
from framework.container.container import get_service
from framework.model.common import BaseResponse
from framework.router.router_decorator import router_controller
from framework.util.auth import get_current_user
from framework.util.logger import setup_logger
from study.application.proverb_app_service import ProverbAppService
from study.dto.study_dto import ProverbDto


logger = setup_logger(__name__)

@router_controller(prefix="/proverb", tags=["谚语管理"])
def study_controller(router: APIRouter):
    """学习管理控制器"""
    
    @router.get(
        "/init_proverb_storage",
        response_model=BaseResponse,
        summary="初始化谚语库",
        description="初始化谚语库"
    )
    async def init_proverb_storage(
        proverb_app_service: ProverbAppService = Depends(partial(get_service, ProverbAppService))
    ):
        proverb_app_service.init_proverb_storage()
        return BaseResponse(
                code=0,
                message="初始化谚语库成功"
        )
    
    @router.get(
        "/get_proverb_for_display",
        response_model=BaseResponse[ProverbDto],
        summary="获取谚语",
        description="获取谚语"
    )
    async def get_proverb_for_display(      
        current_user: str = Depends(get_current_user),
        proverb_app_service: ProverbAppService = Depends(partial(get_service, ProverbAppService))
    ):
        return BaseResponse(
                code=0,
                message="获取谚语成功",
                data=proverb_app_service.get_proverb_for_display(current_user["user_id"])
        )
    
    @router.get(
        "/get_proverb_list",
        response_model=BaseResponse[List[ProverbDto]],
        summary="获取谚语列表",
        description="获取谚语列表"
    )
    async def get_proverb_list(
        current_user: str = Depends(get_current_user),
        proverb_app_service: ProverbAppService = Depends(partial(get_service, ProverbAppService))
    ):
        return BaseResponse(
                code=0,
                message="获取谚语列表成功",
                data=proverb_app_service.get_proverb_list()
        )

