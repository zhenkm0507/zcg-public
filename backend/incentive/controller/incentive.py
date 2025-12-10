# 创建logger实例
from functools import partial
from typing import List
from fastapi import APIRouter, Depends, Header
from framework.container.container import get_service
from framework.model.common import BaseResponse
from framework.router.router_decorator import router_controller
from framework.util.auth import get_current_user
from framework.util.logger import setup_logger
from incentive.application.incentive_app_service import IncentiveAppService
from incentive.dto.incentive_dto import UserWordBankAwardDto, UserWordBankProfileDto


logger = setup_logger(__name__)

@router_controller(prefix="/incentive", tags=["激励系统"])
def incentive_controller(router: APIRouter):
    @router.get(
        "/get_user_word_bank_award_list",
        response_model=BaseResponse[List[UserWordBankAwardDto]],
        summary="查询用户词库奖品列表",
        description="查询用户词库奖品列表"
    )
    async def get_user_word_bank_award_list(
        current_user: str = Depends(get_current_user),
        current_word_bank_id: int = Header(..., description="词库ID",alias="current-word-bank-id"),
        incentive_app_service: IncentiveAppService = Depends(partial(get_service, IncentiveAppService))
    ):
        return BaseResponse(
                code=0,
                message="获取用户词库奖品列表成功",
                data=incentive_app_service.query_user_word_bank_award_list(current_user["user_id"],current_word_bank_id)
        )
    
    @router.get(
        "/get_user_word_bank_profile",
        response_model=BaseResponse[UserWordBankProfileDto],
        summary="查询用户词库个人Profile信息",
        description="查询用户词库个人Profile信息"
    )
    async def get_user_word_bank_profile(
        current_user: str = Depends(get_current_user),
        current_word_bank_id: int = Header(..., description="词库ID",alias="current-word-bank-id"),
        incentive_app_service: IncentiveAppService = Depends(partial(get_service, IncentiveAppService))
    ):
        return BaseResponse(
                code=0,
                message="获取用户词库个人Profile信息成功",
                data=incentive_app_service.query_user_word_bank_profile(current_user["user_id"],current_word_bank_id)
        )