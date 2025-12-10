from typing import List
from framework.container.container_decorator import injectable
from framework.database.db_decorator import readonly, transactional
from framework.database.db_factory import get_db_session
from study.domain.entity.proverb import Proverb, UserProverbSeq

@injectable
class ProverbService:
    @transactional
    def get_proverb_for_display(self,user_id:int) -> Proverb:
       seq = 0
       user_proverb_seq = get_db_session().query(UserProverbSeq).filter(UserProverbSeq.user_id == user_id).first()
       if user_proverb_seq:
           seq = user_proverb_seq.next_proverb_seq
           user_proverb_seq.next_proverb_seq = self.get_next_seq(seq)
       else:
           seq = self.get_next_seq(0)
           user_proverb_seq = UserProverbSeq(user_id=user_id, next_proverb_seq=self.get_next_seq(seq))
           get_db_session().add(user_proverb_seq)

       return get_db_session().query(Proverb).filter(Proverb.id == seq).first()
    @readonly
    def get_proverb_by_proverb(self,proverb:str):
        return get_db_session().query(Proverb).filter(Proverb.proverb == proverb).first()
    
    @transactional
    def add_proverb(self,proverb:Proverb):
        get_db_session().add(proverb)
        get_db_session().flush()

    @readonly
    def get_proverb_list(self) -> List[Proverb]:
        return get_db_session().query(Proverb).all()
    

    @readonly
    def get_next_seq(self,seq:int) -> int:
        proverb = get_db_session().query(Proverb).filter(Proverb.id > seq).order_by(Proverb.id).first()
        return proverb.id if proverb else seq
