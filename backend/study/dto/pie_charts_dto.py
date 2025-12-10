from typing import List
from pydantic import BaseModel, Field


class ChartDataItem(BaseModel):
    """图表数据项"""
    name: str = Field(..., description="数据项名称")
    value: int = Field(..., description="数据项值")


class ChartSeries(BaseModel):
    """图表系列"""
    name: str = Field(..., description="系列名称")
    data: List[ChartDataItem] = Field(..., description="数据项列表")


class Chart(BaseModel):
    """单个图表"""
    id: str = Field(..., description="图表唯一标识")
    title: str = Field(..., description="图表标题")
    series: ChartSeries = Field(..., description="图表系列")


class PieChartsDto(BaseModel):
    """图表响应数据"""
    charts: List[Chart] = Field(default_factory=list, description="图表列表") 

    