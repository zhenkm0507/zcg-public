from pydantic import BaseModel, Field
from typing import List, Optional

class AwardItemDto(BaseModel):
    """
    单个奖励物品的数据传输对象
    """
    id: int = Field(..., description="奖品ID")
    name: str = Field(..., description="奖品名称")
    num: int = Field(..., description="奖品个数")
    is_unlocked: bool = Field(..., description="是否解锁")
    description: str = Field(..., description="奖品描述")
    image_path: str = Field(..., description="奖品图片路径")
    video_path: Optional[str] = Field(None, description="奖品视频路径，可为空")

class UserWordBankAwardDto(BaseModel):
    """
    用户词库奖励的数据传输对象
    """
    award_type: int = Field(..., description="奖品类型，1表示珍宝，2表示秘籍，3表示宝剑，4表示盔甲")
    award_type_name: str = Field(..., description="奖品类型名称")
    award_list: List[AwardItemDto] = Field(..., description="奖品列表")

class UserWordBankProfileDto(BaseModel):
    """
    用户词库个人Profile信息的数据传输对象
    """
    user_id: int = Field(..., description="用户ID")
    word_bank_id: int = Field(..., description="词库ID")
    user_level: int = Field(..., description="用户级别")
    user_level_name: str = Field(default="", escription="用户级别名称")
    experience_value: float = Field(..., description="经验值")
    morale_value: int = Field(..., description="士气值")
    image_path: str = Field(default="", description="用户图片路径")

class IncentiveResultDto(BaseModel):
    """
    激励结果的数据传输对象
    """
    award_type: int = Field(..., description="奖品类型")
    award_name: str = Field(..., description="奖品名称")
    image_path: str = Field(..., description="奖品图片路径")
    video_path: Optional[str] = Field(default="", description="奖品视频路径")
