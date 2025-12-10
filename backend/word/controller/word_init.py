"""
词典初始化控制器模块
"""
from functools import partial
from typing import List
import urllib.parse
from fastapi import APIRouter, Body, Header, Query, Response, Depends
from framework.container.container import get_service
from word.application.word_init_app_service import WordInitAppService
from word.dto.word_init_dto import StatisticResponse, WordInitDto
from framework.model.common import BaseResponse
from framework.util.logger import setup_logger
from framework.router.router_decorator import router_controller

# 创建logger实例
logger = setup_logger(__name__)

# 修改前缀，去掉开头的斜杠，因为在main.py中已经添加了/api/v1前缀
@router_controller(prefix="/word_init", tags=["词典初始化"])
def word_init_controller(router: APIRouter):
    """词典初始化控制器"""
    
    @router.get(
        "/statistic",
        response_model=BaseResponse[StatisticResponse],
        summary="获取词典初始化统计信息",
        description="获取词典初始化统计信息"
    )
    async def query_statistic(
        word_init_app_service: WordInitAppService = Depends(partial(get_service, WordInitAppService))
    ):
        return BaseResponse(
            code=0,
            message="获取词典初始化统计信息成功",
            data=word_init_app_service.query_statistic()
        )
    
    @router.get(
        "/picture",
        summary="获取一张词典图片",
        description="获取一张词典图片"
    )
    async def load_picture(
        word_init_app_service: WordInitAppService = Depends(partial(get_service, WordInitAppService))
    ):
        image_content, file_path = word_init_app_service.load_picture()
        
        # 根据文件扩展名确定媒体类型
        media_type = "image/jpeg"  # 默认值
        if file_path.lower().endswith('.png'):
            media_type = "image/png"
        elif file_path.lower().endswith('.gif'):
            media_type = "image/gif"
            
        return Response(
            content=image_content,
            media_type=media_type,
            headers={
                "Content-Disposition": f"inline; filename*=UTF-8''{urllib.parse.quote(file_path.split('/')[-1])}",
                "file-path": urllib.parse.quote(file_path)
            }
        )
    
    @router.get(
        "/parse_picture",
        response_model=BaseResponse[List[WordInitDto]],
        summary="解析词典图片",
        description="解析词典图片并返回单词信息"
    )
    async def parse_picture(
        file_path: str = Header(..., description="文件路径", alias="file-path"),
        word_init_app_service: WordInitAppService = Depends(partial(get_service, WordInitAppService))
    ):    
        return BaseResponse(
            code=0,
            message="解析图片成功",
            data=word_init_app_service.parse_picture(urllib.parse.unquote(file_path))
        )
    
    @router.post(
        "/save_words",
        response_model=BaseResponse,
        summary="保存单词列表",
        description="保存单词列表"
    )
    async def save_words(
        request: List[WordInitDto] = Body(..., description="单词列表"),
        file_path: str = Header(..., description="文件路径", alias="file-path"),
        word_init_app_service: WordInitAppService = Depends(partial(get_service, WordInitAppService))
    ):    
        word_init_app_service.save_words(request, urllib.parse.unquote(file_path))
        return BaseResponse(
            code=0,
            message="保存单词列表成功"
        )
    
    @router.get(
        "/batch_process",
        response_model=BaseResponse,
        summary="批处理",
        description="批处理"
    )
    async def batch_process(
        size: int = Query(default=10, description="批处理大小", alias="size"),
        word_init_app_service: WordInitAppService = Depends(partial(get_service, WordInitAppService))
    ):    
        return BaseResponse(
            code=0,
            message="解析图片成功",
            data=word_init_app_service.batch_process(size)
        )
        
    return router

