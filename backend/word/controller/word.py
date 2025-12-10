"""
词典控制器模块
"""
from typing import List
import urllib.parse
from fastapi import APIRouter, Body, Depends, Header, Query, Response
from word.application.word_app_service import WordAppService
from word.dto.word_dto import  WordBankDto
from framework.model.common import BaseResponse
from framework.util.logger import setup_logger
from framework.container.container import get_service
from functools import partial
from framework.router.router_decorator import router_controller

# 创建logger实例
logger = setup_logger(__name__)

@router_controller(prefix="/word", tags=["词典管理"])
def word_controller(router: APIRouter):
    """词典管理控制器"""
    
    @router.get(
        "/word_bank_list",
        response_model=BaseResponse[List[WordBankDto]],
        summary="获取词库列表",
        description="获取词库列表"
    )
    async def query_word_bank_list(
        word_app_service: WordAppService = Depends(partial(get_service, WordAppService))
    ):
        return BaseResponse(
                code=0,
                message="获取词库列表成功",
                data=word_app_service.query_word_bank_list()
        )
    
    return router
 