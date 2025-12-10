"""
学习管理模块，处理学习相关的请求
"""
from typing import List, Optional
from fastapi import APIRouter, Body, Depends, Header, Query
from study.application.study_app_service import StudyAppService
from framework.model.common import BaseResponse
from framework.util.logger import setup_logger
from framework.container.container import get_service
from functools import partial
from framework.util.auth import get_current_user
from framework.router.router_decorator import router_controller
from study.dto.bar_charts_dto import BarChartDto
from study.dto.pie_charts_dto import PieChartsDto
from study.dto.study_dto import AnswerInfoDto, AnswerInfoItem, HardWordDto, StudyRecordDto, UserFlagsSetDto, UserWordDto, UserWordStatusStatsDto
from study.dto.word_info_dto import InflectionListDto, WordInfoDto
from study.enums.study_enums import InflectionTypeEnum, UserWordStatusEnum

# 创建logger实例
logger = setup_logger(__name__)

@router_controller(prefix="/study", tags=["学习管理"])
def study_controller(router: APIRouter):
    """学习管理控制器"""
    
    @router.get(
        "/switch_word_bank",
        response_model=BaseResponse,
        summary="切换词库",
        description="切换词库"
    )
    async def switch_word_bank(
        current_user: str = Depends(get_current_user),
        word_bank_id: int = Query(..., description="词库ID"),
        study_app_service: StudyAppService = Depends(partial(get_service, StudyAppService))
    ):
        study_app_service.switch_word_bank(current_user["user_id"], word_bank_id)
        return BaseResponse(
                code=0,
                message="切换词库成功"
        )
    
    @router.get(
        "/get_word_task_info",
        response_model=BaseResponse,
        summary="获取单词学习任务信息",
        description="获取单词学习任务信息"
    )
    async def get_word_task_info(
        current_user: str = Depends(get_current_user),
        current_word_bank_id: int = Header(..., description="词库ID",alias="current-word-bank-id"),
        batch_id: Optional[int] = Query(None, description="批次ID"),
        flag: Optional[str] = Query(None, description="标签筛选"),
        study_app_service: StudyAppService = Depends(partial(get_service, StudyAppService))
    ):
        return BaseResponse(
                code=0,
                message="获取单词学习任务信息成功",
                data=study_app_service.get_word_task_info(current_user["user_id"],current_word_bank_id,batch_id,flag)
        )
    
    @router.post(
        "/submit_answer_info",
        response_model=BaseResponse,
        summary="提交答题信息",
        description="提交答题信息"
    )
    async def submit_answer_info(
        current_user: str = Depends(get_current_user),
        current_word_bank_id: int = Header(..., description="词库ID",alias="current-word-bank-id"),
        answer_info: AnswerInfoDto = Body(..., description="答题信息"),
        study_app_service: StudyAppService = Depends(partial(get_service, StudyAppService))
    ): 
        import time
        start_time = time.time()
        logger.info(f"[性能] submit_answer_info 开始: user_id={current_user['user_id']}, word={answer_info.word}")
        try:
            result = study_app_service.process_answer_info(current_user["user_id"],current_word_bank_id,answer_info)
            elapsed_time = time.time() - start_time
            logger.info(f"[性能] submit_answer_info 完成: 总耗时={elapsed_time:.3f}秒")
            return BaseResponse(
                    code=0,
                    message="提交答题信息成功",
                    data=result
            )
        except Exception as e:
            elapsed_time = time.time() - start_time
            logger.error(f"[性能] submit_answer_info 异常: 耗时={elapsed_time:.3f}秒, 错误={str(e)}")
            raise
    
    @router.post(
        "/judge_phrase",
        response_model=BaseResponse,
        summary="判断短语是否正确",
        description="判断短语是否正确"
    )
    async def judge_phrase(
        phrase: AnswerInfoItem = Body(..., description="短语"),
        study_app_service: StudyAppService = Depends(partial(get_service, StudyAppService))
    ):
        return BaseResponse(
                code=0,
                message="判断短语是否正确成功",
                data=study_app_service.judge_phrase(phrase)
        )

    @router.get(
        "/get_user_word_list",
        response_model=BaseResponse[List[UserWordDto]],
        summary="获取用户单词列表",
        description="获取用户单词列表"
    )
    async def get_user_word_list(   
        current_user: str = Depends(get_current_user),
        current_word_bank_id: int = Header(..., description="词库ID",alias="current-word-bank-id"),
        user_word_status: Optional[int] = Query(
            None,
            description="用户单词状态：0-等待斩杀，1-斩杀中，2-斩杀成功，不传查全部",
            ge=0,
            le=2
        ),
        study_app_service: StudyAppService = Depends(partial(get_service, StudyAppService))
    ):
        # 将整数转换为枚举
        if user_word_status is not None:
            status_enum = UserWordStatusEnum.from_code(user_word_status)
        else:
            status_enum = None
        return BaseResponse(
                code=0,
                message="获取用户单词列表成功",
                data=study_app_service.get_user_word_list(current_user["user_id"],current_word_bank_id,status_enum)
        )
    
    @router.get(
        "/get_user_word",
        response_model=BaseResponse[WordInfoDto],
        summary="获取用户单词",
        description="获取用户单词"
    )
    async def get_user_word(
        current_user: str = Depends(get_current_user),
        current_word_bank_id: int = Header(..., description="词库ID",alias="current-word-bank-id"),
        word: str = Query(..., description="单词"),
        is_need_mask: bool = Query(default=True, description="是否需要*化"),
        study_app_service: StudyAppService = Depends(partial(get_service, StudyAppService))
    ):
        return BaseResponse(
                code=0,
                message="获取用户单词成功",
                data=study_app_service.get_user_word(current_user["user_id"],current_word_bank_id,word,is_need_mask)
        )
    
    @router.get(
        "/get_study_record_list",
        response_model=BaseResponse[List[StudyRecordDto]],
        summary="获取学习记录列表",
        description="获取学习记录列表"
    )
    async def get_study_record_list(    
        current_user: str = Depends(get_current_user),
        current_word_bank_id: int = Header(..., description="词库ID",alias="current-word-bank-id"),
        study_app_service: StudyAppService = Depends(partial(get_service, StudyAppService))
    ):
        return BaseResponse(
                code=0,
                message="获取学习记录列表成功",
                data=study_app_service.get_study_record_list(current_user["user_id"],current_word_bank_id)
        )
    
    @router.get(
        "/get_hard_word_record_list",
        response_model=BaseResponse[List[HardWordDto]],
        summary="获取困难单词记录列表",
        description="获取困难单词记录列表"
    )
    async def get_hard_word_record_list(
        fault_count: int = Query(..., description="背错次数"),
        current_user: str = Depends(get_current_user),
        current_word_bank_id: int = Header(..., description="词库ID",alias="current-word-bank-id"),
        study_app_service: StudyAppService = Depends(partial(get_service, StudyAppService))
    ):
        return BaseResponse(
                code=0,
                message="获取困难单词记录列表成功",
                data=study_app_service.get_hard_word_record_list(current_user["user_id"],current_word_bank_id,fault_count)
        )
    
    @router.get(
        "/inflections",
        response_model=BaseResponse[InflectionListDto],
        summary="获取变形形式",
        description="获取变形形式"
    )
    async def query_inflections(    
        current_user: str = Depends(get_current_user),
        current_word_bank_id: int = Header(..., description="词库ID",alias="current-word-bank-id"),
        inflection_type: int = Query(..., description="变形形式类型"),
        study_app_service: StudyAppService = Depends(partial(get_service, StudyAppService))
                 
    ):  
        inflection_type_enum = InflectionTypeEnum.from_code(inflection_type)
        return BaseResponse(
                code=0,
                message="获取变形形式成功",
                data=study_app_service.query_inflections(current_user["user_id"],current_word_bank_id,inflection_type_enum)
        )

    @router.get(
        "/query_user_flags",
        response_model=BaseResponse[List[str]],
        summary="查询用户在词库里的标签列表",
        description="查询用户在词库里的标签列表"
    )
    async def query_user_flags(
        current_user: str = Depends(get_current_user),
        current_word_bank_id: int = Header(..., description="词库ID",alias="current-word-bank-id"),
        study_app_service: StudyAppService = Depends(partial(get_service, StudyAppService))
    ):
        return BaseResponse(
                code=0,
                message="查询用户在词库里的标签列表成功",
                data=study_app_service.query_user_flags(current_user["user_id"],current_word_bank_id)
        )
    
    @router.get(
        "/stat/pie_chart_data",
        response_model=BaseResponse[PieChartsDto],
        summary="查询用户单词状态",
        description="查询用户单词状态"
    )
    async def get_pie_chart_data(
        current_user: str = Depends(get_current_user),
        current_word_bank_id: int = Header(..., description="词库ID",alias="current-word-bank-id"),
        study_app_service: StudyAppService = Depends(partial(get_service, StudyAppService))
    ):
        return BaseResponse(
                code=0,
                message="查询用户单词状态成功",
                data=study_app_service.get_pie_chart_data(current_user["user_id"],current_word_bank_id)
        )
    
    @router.get(
        "/stat/bar_chart_data",
        response_model=BaseResponse[BarChartDto],
        summary="查询学习记录柱状图数据",
        description="查询学习记录柱状图数据"
    )
    async def get_bar_chart_data(
        current_user: str = Depends(get_current_user),
        current_word_bank_id: int = Header(..., description="词库ID",alias="current-word-bank-id"),
        study_app_service: StudyAppService = Depends(partial(get_service, StudyAppService))
    ):
        return BaseResponse(
                code=0,
                message="查询学习记录柱状图数据成功",
                data=study_app_service.get_bar_chart_data(current_user["user_id"],current_word_bank_id)
        )
    
    @router.get(
        "/stat/user_word_status_stats",
        response_model=BaseResponse[UserWordStatusStatsDto],
        summary="查询用户单词状态统计",
        description="查询用户单词状态统计"
    )
    async def get_user_word_status_stats(
        current_user: str = Depends(get_current_user),
        current_word_bank_id: int = Header(..., description="词库ID",alias="current-word-bank-id"),
        study_app_service: StudyAppService = Depends(partial(get_service, StudyAppService))
    ):
        return BaseResponse(
                code=0,
                message="查询用户单词状态统计成功",
                data=study_app_service.get_user_word_status_stats(current_user["user_id"],current_word_bank_id)
        )
    
    @router.post(
        "/set_user_word_flags",
        response_model=BaseResponse,
        summary="设置用户单词标签",
        description="设置用户单词标签"
    )
    async def set_user_word_flags(
        current_user: str = Depends(get_current_user),
        current_word_bank_id: int = Header(..., description="词库ID",alias="current-word-bank-id"),
        user_flags_set_dto: UserFlagsSetDto = Body(..., description="用户标签设置DTO"),
        study_app_service: StudyAppService = Depends(partial(get_service, StudyAppService))
    ):
        study_app_service.set_user_word_flags(current_user["user_id"],current_word_bank_id,user_flags_set_dto)
        return BaseResponse(
                code=0,
                message="设置用户单词标签成功"
        )

    return router

    
