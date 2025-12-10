from typing import List
from framework.database.db_factory import get_db_session
from framework.container.container_decorator import injectable
from framework.database.db_decorator import readonly
from word.domain.entity.word import Word
from word.domain.entity.word_bank import WordBank

@injectable
class WordBankService:
    """
    词库领域服务类，处理词库相关的业务逻辑
    """
    @readonly
    def query_word_bank_list(self) -> List[WordBank]:
        return get_db_session().query(WordBank).all()

    @readonly
    def query_word_bank_by_id(self,word_bank_id:int) -> WordBank:
        return get_db_session().query(WordBank).filter(WordBank.id == word_bank_id).first()
    