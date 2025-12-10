from typing import List
from pydantic import BaseModel, Field


class XAxis(BaseModel):
    """X轴配置"""
    type: str = Field("category", description="坐标轴类型")
    data: List[str] = Field(..., description="X轴数据")


class BarSeriesItem(BaseModel):
    """柱状图系列项"""
    name: str = Field(..., description="系列名称")
    type: str = Field("bar", description="图表类型")
    data: List[int] = Field(..., description="数据值列表")


class BarChartDto(BaseModel):
    """柱状图数据"""
    title: str = Field(..., description="图表标题")
    xAxis: XAxis = Field(..., description="X轴配置")
    series: List[BarSeriesItem] = Field(..., description="数据系列列表") 