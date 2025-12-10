from datetime import datetime
from typing import Dict, List, Optional, Any
from incentive.dto.incentive_dto import IncentiveResultDto
from pydantic import BaseModel, Field, model_validator
from study.dto.word_info_dto import WordInfoDto

class WordItemDto(BaseModel):
    """
    单词项DTO
    """
    word: str = Field(...,description="单词")
    is_memorized: bool = Field(...,description="是否已背")

class WordTaskInfoDto(BaseModel):
    """
    单词学习任务信息DTO
    """
    is_completed: bool = Field(default=False)
    task_id: str = Field(default="")
    word_info: WordInfoDto = Field(default=None)

class AnswerInfoItem(BaseModel):
    """
    答题信息项
    """
    question_type: str = Field(...,description="问题类型：word-单词, inflection-变形形式, phrase-短语")
    question: str = Field(...,description="问题内容")
    correct_answer: str = Field(...,description="正确答案")
    user_answer: Optional[str] = Field(default=None, description="用户答案")
    is_correct: Optional[bool] = Field(default=None, description="是否正确")

class AnswerInfoDto(BaseModel):
    """
    答题信息DTO
    """
    task_id: str = Field(default=None,description="本次单词学习的唯一任务ID号")
    word: str = Field(default=None,description="单词")
    study_result: int = Field(...,description="总答题结果：1-完全正确，0-有错误")
    answer_info: List[AnswerInfoItem] = Field(...,description="答题详情列表")
    record_date: str = Field(default=None,description="背词时间")

class AnswerResponse(BaseModel):
    """
    答题响应DTO
    """
    word: str = Field(...,description="单词")
    is_slain: bool = Field(...,description="是否被斩杀")
    study_result: int = Field(...,description="本次答题结果：1-完全正确，0-有错误")
    award_list: List[IncentiveResultDto] = Field(default_factory=list,description="奖品列表")

class JudgePhraseResponse(BaseModel):
    """
    判断短语是否正确响应DTO
    """
    is_correct: bool = Field(...,description="是否正确")

class UserWordDto(BaseModel):
    id: int
    user_id: int
    word_bank_id: int
    word: str
    word_status: int
    explanation: Optional[str] = Field(default="")
    flags: List[str] = Field(default_factory=list)  
    unmask_word: str = Field(...,description="未*化的单词")

class StudyRecordItemDto(BaseModel):
    """
    学习记录项DTO
    """
    id: int = Field(...,description="主键")
    user_id: int = Field(...,description="用户ID")
    word_bank_id: int = Field(...,description="词库ID")
    word: str = Field(...,description="单词")
    explanation: Optional[str] = Field(default="",description="单词的中文释义")
    record_time: datetime = Field(...,description="背词时间")
    study_result: str = Field(...,description="回答结果：正确|错误")
    word_status: str = Field(...,description="单词状态：待斩|斩中|已斩")
    flags: List[str] = Field(default_factory=list,description="单词标签")   
    answer_info: List[AnswerInfoItem] = Field(default_factory=list,description="答题详情")
    unmask_word: str = Field(...,description="未*化的单词")

class StudyRecordDto(BaseModel):
    """
    学习记录DTO
    """
    record_date: str = Field(...,description="背词日期")
    study_record_list: List[StudyRecordItemDto] = Field(...,description="学习记录列表")

class HardWordDto(BaseModel):
    user_id: int = Field(...,description="用户ID")
    word_bank_id: int = Field(...,description="词库ID")
    word: str = Field(...,description="单词")
    explanation: Optional[str] = Field(default="",description="单词的中文释义")
    word_status: str = Field(...,description="单词状态：待斩|斩中|已斩")
    flags: List[str] = Field(default_factory=list,description="单词标签")   
    unmask_word: str = Field(...,description="未*化的单词")
    answer_info: List[AnswerInfoDto] = Field(default_factory=list,description="答题详情")

class UserWordStatusStatsDto(BaseModel):
    """
    用户单词状态统计DTO
    """
    slain_word_count: int = Field(...,description="斩杀单词数量")
    slaining_word_count: int = Field(...,description="斩中单词数量")
    wait_word_count: int = Field(...,description="待斩单词数量")
    total_word_count: int = Field(...,description="总单词数量")

class UserStudyBatchRecordDto(BaseModel):
    """
    用户学习批次记录DTO
    """
    id: int = Field(...,description="主键")
    user_id: int = Field(...,description="用户ID")
    word_bank_id: int = Field(...,description="词库ID")
    batch_no: str = Field(...,description="批次号")
    is_finished: bool = Field(...,description="是否完成")
    word_count: int = Field(...,description="单词数量")
    words: List[WordItemDto] = Field(default_factory=list,description="单词列表")
    
    @model_validator(mode='before')
    @classmethod
    def validate_words(cls, data: Any) -> Any:
        """验证并转换 words 字段"""
        if isinstance(data, dict) and 'words' in data:
            words_data = data['words']
            if isinstance(words_data, list):
                # 如果 words 是字典列表，转换为 WordItemDto 对象列表
                converted_words = []
                for word_dict in words_data:
                    if isinstance(word_dict, dict):
                        converted_words.append(WordItemDto(**word_dict))
                    elif isinstance(word_dict, WordItemDto):
                        converted_words.append(word_dict)
                data['words'] = converted_words
        return data
    
class ProverbDto(BaseModel):
    """
    谚语DTO
    """
    id: int = Field(...,description="主键")
    proverb: str = Field(...,description="谚语")
    chinese_exp: str = Field(...,description="中文释义")

class UserFlagsSetDto(BaseModel):
    """
    用户标签设置DTO
    """
    operate_type: int = Field(...,description="操作类型")
    flags: List[str] = Field(...,description="标签列表")
    words: List[str] = Field(...,description="单词列表")