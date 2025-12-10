from typing import List
from sqlalchemy import String, and_, or_
from sqlalchemy.sql import func

from framework.container.container_decorator import injectable
from framework.database.db_decorator import readonly, transactional
from framework.database.db_factory import get_db_session
from word.domain.entity.word import Word

@injectable
class WordService:
    """
    单词领域服务类，处理单词相关的业务逻辑
    """

    @transactional
    def save_words(self,words:List[Word]):
        db_session = get_db_session()
        for word in words:
            # 提取公共的过滤条件
            filter_conditions = [
                Word.word == word.word,
                Word.word_bank_id == word.word_bank_id
            ]
            # 查询是否存在相同word的记录
            existing_word = db_session.query(Word).filter(*filter_conditions).first()
            if existing_word:
                # 如果存在，更新需要更新的字段
                update_data = {
                    'phonetic_symbol': word.phonetic_symbol,
                    'inflection': word.inflection,
                    'explanation': word.explanation,
                    'example_sentences': word.example_sentences,
                    'phrases': word.phrases,
                    'expansions': word.expansions,
                    'memory_techniques': word.memory_techniques,
                    'discrimination': word.discrimination,
                    'usage': word.usage,
                    'notes': word.notes,
                    'flags': word.flags,
                    'page': word.page
                }
                db_session.query(Word).filter(*filter_conditions).update(update_data)
            else:
                # 如果不存在，直接添加新记录
                db_session.add(word)
    
    @readonly            
    def query_word_list(self,word_bank_id:int) -> List[Word]:
        return get_db_session().query(Word).filter(Word.word_bank_id == word_bank_id).all()
    
    @readonly
    def query_word_info(self,word:str,word_bank_id:int) -> Word:
        return get_db_session().query(Word).filter(Word.word == word,Word.word_bank_id == word_bank_id).first()

    @readonly
    def query_word_list_by_word_list(self,word_list:List[str],word_bank_id:int) -> List[Word]:
        return get_db_session().query(Word).filter(Word.word.in_(word_list),Word.word_bank_id == word_bank_id).all()
    
    