import json
from typing import List, Tuple

import urllib.parse
from framework.container.container_decorator import injectable
from framework.database.db_decorator import readonly
from word.domain.entity.word_bank import WordBank
from word.domain.service.word_bank_service import WordBankService
from word.domain.service.word_service import WordService
from framework.config.config import settings
from word.dto.word_dto import  WordBankDto
import os
from word.domain.entity.word import Word
from framework.util.logger import setup_logger
from framework.util.file_util import move_file
from framework.util.oo_converter import orm_to_dto, orm_to_dto_list

logger = setup_logger(__name__)

@injectable
class WordAppService:
    def __init__(self,word_service:WordService,word_bank_service:WordBankService):
        self.word_service = word_service
        self.word_bank_service = word_bank_service
    def query_word_bank_list(self) -> List[WordBankDto]:
        """
        查询词库列表
        """
        word_bank_list = self.word_bank_service.query_word_bank_list()
        return orm_to_dto_list(word_bank_list, WordBankDto)
    
    @readonly
    def query_word_list(self,word_bank_id:int) -> List[Word]:
        """
        查询单词列表
        """
        return self.word_service.query_word_list(word_bank_id)
    
    @readonly
    def query_word_info(self,word:str,word_bank_id:int) -> Word:
        """
        查询单词信息
        """
        return self.word_service.query_word_info(word,word_bank_id)
    
    def query_word_bank_by_id(self,word_bank_id:int) -> WordBankDto:
        """
        查询词库信息
        """
        word_bank = self.word_bank_service.query_word_bank_by_id(word_bank_id)
        return orm_to_dto(word_bank, WordBankDto)
    
    @readonly
    def query_word_list_by_word_list(self,word_list:List[str],word_bank_id:int) -> List[Word]:
        """
        查询单词列表
        """
        return self.word_service.query_word_list_by_word_list(word_list,word_bank_id)
    