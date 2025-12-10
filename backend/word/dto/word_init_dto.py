from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Union

class StatisticResponse(BaseModel):
    """
    统计信息数据传输对象
    """
    total_files: int = Field(..., description="总文件数")
    completed_files: int = Field(..., description="已完成文件数")
    completion_percentage: str = Field(..., description="完成百分比")

class WordInitDto(BaseModel):        
    """
    词典初始化请求数据传输对象
    """
    word_bank_id: int = Field(default=1, description="词库ID")
    word: str = Field(..., description="单词")
    phonetic_symbol: str = Field(..., description="音标")
    inflection: Dict = Field(default_factory=dict, description="变形形式（过去式/过去分词/现在分词/比较级/最高级/名词复数）")
    explanation: str = Field(..., description="中文释义")
    example_sentences: str = Field(default="", description="例句")
    phrases: List = Field(default_factory=list, description="短语搭配")
    expansions: str = Field(default="", description="拓展")
    memory_techniques: str = Field(default="", description="记忆方法")
    discrimination: str = Field(default="", description="辨析")
    usage: str = Field(default="", description="用法")
    notes: str = Field(default="", description="注意事项")
    flags: List = Field(default_factory=list, description="标签")
    page: int = Field(..., description="页码")
    