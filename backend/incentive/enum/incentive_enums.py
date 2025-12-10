from enum import Enum

class UserLevelEnum(Enum):
    """用户级别枚举"""
    GFXZ = (1,"功夫小子")  
    WLXS = (2,"武林新秀")  
    JHHS = (3,"江湖豪侠") 
    DYZS = (4,"一代宗师") 
    WLCZ = (5,"武林至尊")  


    def __init__(self, code, name):
        self._code_ = code
        self._name_ = name

    @property
    def code(self):
        return self._code_

    @property
    def name(self):
        return self._name_
    
    @classmethod
    def from_code(cls, code: int) -> 'UserLevelEnum':
        """
        根据code值获取枚举值
        """
        for enum_item in cls:
            if enum_item.code == code:
                return enum_item
        raise ValueError(f"Invalid code: {code}")
   
    @classmethod
    def from_name(cls, name: str) -> 'UserLevelEnum':
        """
        根据name值获取枚举值
        """
        for enum_item in cls:
            if enum_item.name == name:
                return enum_item
        raise ValueError(f"Invalid name: {name}")

class AwardTypeEnum(Enum):
    """奖品类型枚举"""
    ZB = (1,"珍宝")
    MJ = (2,"秘籍")
    BJ = (3,"宝剑")
    KJ = (4,"盔甲")

    def __init__(self, code, name):
        self._code_ = code
        self._name_ = name

    @property
    def code(self):
        return self._code_

    @property
    def name(self):
        return self._name_
    
    @classmethod
    def from_code(cls, code: int) -> 'AwardTypeEnum':
        """
        根据code值获取枚举值
        """
        for enum_item in cls:
            if enum_item.code == code:
                return enum_item
        raise ValueError(f"Invalid code: {code}")
   
    @classmethod
    def from_name(cls, name: str) -> 'AwardTypeEnum':
        """
        根据name值获取枚举值
        """
        for enum_item in cls:
            if enum_item.name == name:
                return enum_item
        raise ValueError(f"Invalid name: {name}")
    
class AwardAlgoTypeEnum(Enum):
    """奖品算法类型枚举"""
    MEMORIZED_RATIO = (1,"背词完成率")
    SLAINED_RATIO = (2,"斩词完成率")
    PROBABILITY = (3,"概率")

    def __init__(self, code, name):
        self._code_ = code
        self._name_ = name

    @property
    def code(self):
        return self._code_

    @property
    def name(self):
        return self._name_
    
    @classmethod
    def from_code(cls, code: int) -> 'AwardAlgoTypeEnum':
        """
        根据code值获取枚举值
        """
        for enum_item in cls:
            if enum_item.code == code:
                return enum_item
        raise ValueError(f"Invalid code: {code}")
   
    @classmethod
    def from_name(cls, name: str) -> 'AwardAlgoTypeEnum':
        """
        根据name值获取枚举值
        """
        for enum_item in cls:
            if enum_item.name == name:
                return enum_item
        raise ValueError(f"Invalid name: {name}")
        
