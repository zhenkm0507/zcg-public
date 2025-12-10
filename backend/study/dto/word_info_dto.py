from framework.util.word_util import mask_word
from pydantic import BaseModel, Field, model_validator
from typing import List, Optional


class InflectionDto(BaseModel):
    past_tense: Optional[str] = Field(default=None, exclude_if_none=True)
    past_participle: Optional[str] = Field(default=None, exclude_if_none=True) 
    present_participle: Optional[str] = Field(default=None, exclude_if_none=True)
    comparative: Optional[str] = Field(default=None, exclude_if_none=True)
    superlative: Optional[str] = Field(default=None, exclude_if_none=True)
    plural: Optional[str] = Field(default=None, exclude_if_none=True)

    @model_validator(mode='after')
    def exclude_empty_strings(self) -> 'InflectionDto':
        """排除空字符串字段"""
        for field_name in self.model_fields:
            value = getattr(self, field_name)
            if value == "":
                setattr(self, field_name, None)
        return self

class PhraseDto(BaseModel):
    phrase: str
    exp: str

class WordInfoDto(BaseModel):
    word: str
    phonetic_symbol: str
    inflection: InflectionDto
    explanation: str
    example_sentences: str
    phrases: List[PhraseDto]
    expansions: str = Field(default="")
    memory_techniques: str = Field(default="")
    discrimination: str = Field(default="")
    usage: str = Field(default="")
    notes: str = Field(default="")
    flags: List[str] = Field(default_factory=list)
    unmask_word: str = Field(default="")

    def mask_word(self,is_for_battle:bool=False) -> None:
        
        self.example_sentences = mask_word(self.word, self.example_sentences)
        
        self.expansions = mask_word(self.word, self.expansions)
        self.memory_techniques = mask_word(self.word, self.memory_techniques)
        self.discrimination = mask_word(self.word, self.discrimination)
        self.usage = mask_word(self.word, self.usage)
        self.notes = mask_word(self.word, self.notes)

        if not is_for_battle:
            # 处理音标
            self.phonetic_symbol = '*' * len(self.phonetic_symbol)
             # 处理变形形式
            if self.inflection:
                for field_name in self.inflection.model_fields:
                    value = getattr(self.inflection, field_name)
                    if value:
                        setattr(self.inflection, field_name, value[0] + '*' * (len(value) - 1))
            # 处理短语
            if self.phrases:
                for phrase in self.phrases:
                    phrase.phrase = mask_word(self.word, phrase.phrase)
                    phrase.exp = mask_word(self.word, phrase.exp)   
                    
            # 单词本身的处理放到最后
            self.word = self.word[0] + '*' * (len(self.word) - 1)        


class InflectionListDto(BaseModel):
    table_header: List[str] = Field(default_factory=list, description="表头列名")
    table_data: List[List[str]] = Field(default_factory=list, description="表数据")                         

    