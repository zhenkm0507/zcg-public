from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Union

class WordBankDto(BaseModel):        
    """
    词库数据传输对象
    """
    id: int = Field(..., description="词库ID")
    name: str = Field(..., description="词库名称")
    word_flag_list: Optional[List[str]] = Field(default_factory=list, description="标签")


   