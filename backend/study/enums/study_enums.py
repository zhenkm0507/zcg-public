from enum import Enum

class UserWordStatusEnum(Enum):
    """单词状态枚举"""
    WAIT_SLAIN = (0,"未背")  # 等待斩杀
    SLAINING = (1,"已背")  # 斩杀中
    SLAINED = (2,"已斩")  # 斩杀成功

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
    def from_code(cls, code: int) -> 'UserWordStatusEnum':
        """
        根据code值获取枚举值
        """
        for enum_item in cls:
            if enum_item.code == code:
                return enum_item
        raise ValueError(f"Invalid code: {code}")
   
    @classmethod
    def from_name(cls, name: str) -> 'UserWordStatusEnum':
        """
        根据name值获取枚举值
        """
        for enum_item in cls:
            if enum_item.name == name:
                return enum_item
        raise ValueError(f"Invalid name: {name}")
    

class StudyResultEnum(Enum):
    """学习结果枚举"""
    CORRECT = (1,"正确")  # 正确
    INCORRECT = (0,"错误")  # 错误

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
    def from_code(cls, code: int) -> 'StudyResultEnum':
        """
        根据code值获取枚举值
        """
        for enum_item in cls:
            if enum_item.code == code:
                return enum_item
        raise ValueError(f"Invalid code: {code}")
   
    @classmethod
    def from_name(cls, name: str) -> 'StudyResultEnum':
        """
        根据name值获取枚举值
        """
        for enum_item in cls:
            if enum_item.name == name:
                return enum_item
        raise ValueError(f"Invalid name: {name}")
    
class InflectionTypeEnum(Enum):
    """
    变形形式类型枚举类
    """
    VERB = (1,"动词")  # 动词
    ADJECTIVE = (2,"形容词") # 形容词
    NOUN = (3,"名词") # 名词

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
    def from_code(cls, code: int) -> 'InflectionTypeEnum':
        """
        根据code值获取枚举值
        Args:
            code: 枚举code值
        Returns:
            InflectionTypeEnum: 枚举值
        """
        for enum_item in cls:
            if enum_item.code == code:
                return enum_item
        raise ValueError(f"Invalid code: {code}")
    
    @classmethod
    def from_name(cls, name: str) -> 'InflectionTypeEnum':
        """
        根据name值获取枚举值
        """
        for enum_item in cls:
            if enum_item.name == name:
                return enum_item
        raise ValueError(f"Invalid name: {name}")    

class WordCategoryEnum(Enum):
    """
    单词分类枚举类
    """
    CORE_WORD = (1,"核心必备")  # 核心单词
    BASIC_WORD = (2,"基础必备")  # 基础单词
    HIGH_SCORE_WORD = (3,"高分必备")  # 高分单词
    EXPAND_WORD = (4,"拓展必备")  # 拓展单词
    ALL = (-1,"全部单词")  # 全部
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
    def from_code(cls, code: int) -> 'WordCategoryEnum':
        """
        根据code值获取枚举值
        Args:
            code: 枚举code值
        Returns:
            WordCategoryEnum: 枚举值
        """
        for enum_item in cls:
            if enum_item.code == code:
                return enum_item
        raise ValueError(f"Invalid code: {code}")
    
    @classmethod
    def from_name(cls, name: str) -> 'WordCategoryEnum':
        """
        根据name值获取枚举值
        """
        for enum_item in cls:
            if enum_item.name == name:
                return enum_item
        raise ValueError(f"Invalid name: {name}") 

class UserFlagsOperateTypeEnum(Enum):
    """
    用户标签操作类型枚举类
    """
    ADD = (1,"增加")  # 增加
    DELETE = (2,"删除")  # 删除
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
    def from_code(cls, code: int) -> 'UserFlagsOperateTypeEnum':
        """
        根据code值获取枚举值
        Args:
            code: 枚举code值
        Returns:
            WordCategoryEnum: 枚举值
        """
        for enum_item in cls:
            if enum_item.code == code:
                return enum_item
        raise ValueError(f"Invalid code: {code}")
    
    @classmethod
    def from_name(cls, name: str) -> 'UserFlagsOperateTypeEnum':
        """
        根据name值获取枚举值
        """
        for enum_item in cls:
            if enum_item.name == name:
                return enum_item
        raise ValueError(f"Invalid name: {name}")         

