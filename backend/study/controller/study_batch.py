# 创建logger实例
from functools import partial
from typing import List
from fastapi import APIRouter, Body, Depends, Header, Query
from fastapi.responses import StreamingResponse
from framework.container.container import get_service
from framework.model.common import BaseResponse
from framework.router.router_decorator import router_controller
from framework.util.auth import get_current_user
from framework.util.logger import setup_logger
from study.application.study_batch_app_service import StudyBatchAppService
from study.dto.study_dto import UserStudyBatchRecordDto, WordItemDto


logger = setup_logger(__name__)

@router_controller(prefix="/study_batch", tags=["学习批次管理"])
def study_batch_controller(router: APIRouter):
    """学习批次管理控制器"""

    @router.get(
        "/get_list",
        response_model=BaseResponse[List[UserStudyBatchRecordDto]],
        summary="获取学习批次记录列表",
        description="获取学习批次记录列表"
    )
    async def get_study_batch_record_list(
        current_user: str = Depends(get_current_user),
        current_word_bank_id: int = Header(..., description="词库ID",alias="current-word-bank-id"),
        study_batch_app_service: StudyBatchAppService = Depends(partial(get_service, StudyBatchAppService))
    ):
        return BaseResponse(
            code=0,
            message="获取学习批次记录列表成功",
            data=study_batch_app_service.get_study_batch_record_list(current_user["user_id"],current_word_bank_id)
        )
    
    @router.get(
        "/create_record",
        response_model=BaseResponse,
        summary="创建学习批次记录",
        description="创建学习批次记录"
    )
    async def create_study_batch_record(
        current_user: str = Depends(get_current_user), 
        current_word_bank_id: int = Header(..., description="词库ID",alias="current-word-bank-id"),
        study_batch_app_service: StudyBatchAppService = Depends(partial(get_service, StudyBatchAppService))
    ):
        study_batch_app_service.create_study_batch_record(current_user["user_id"],current_word_bank_id)
        return BaseResponse(
            code=0,
            message="创建学习批次记录成功"
        )
    
    @router.post(
        "/set_words",
        response_model=BaseResponse,
        summary="设置学习批次记录的单词列表",
        description="设置学习批次记录的单词列表"
    )
    async def set_words(
        id: int = Body(..., description="学习批次记录ID"),
        words: List[WordItemDto] = Body(..., description="单词列表"),
        study_batch_app_service: StudyBatchAppService = Depends(partial(get_service, StudyBatchAppService))
    ):
        study_batch_app_service.set_words(id,words)
        return BaseResponse(
            code=0,
            message="设置学习批次记录的单词列表成功"
        )
    
    
    @router.get(
        "/reset_status", 
        response_model=BaseResponse,
        summary="刷新学习批次记录的状态",
        description="刷新学习批次记录的状态"
    )
    async def reset_status(
        id: int = Query(..., description="学习批次记录ID"),
        study_batch_app_service: StudyBatchAppService = Depends(partial(get_service, StudyBatchAppService))
    ):
        study_batch_app_service.reset_status(id)
        return BaseResponse(
            code=0,
            message="刷新学习批次记录的状态成功"
        )
    
    @router.get(
        "/download_words_in_batch",
        summary="下载学习批次记录的单词列表Excel文件",
        description="下载学习批次记录的单词列表Excel文件"
    )
    async def download_words_excel(
        id: int = Query(..., description="学习批次记录ID"),
        study_batch_app_service: StudyBatchAppService = Depends(partial(get_service, StudyBatchAppService))
    ):
        return study_batch_app_service.download_words_in_batch(id)
    
    return router