from typing import List
from framework.container.container_decorator import injectable
from framework.database.db_decorator import readonly, transactional
from framework.database.db_factory import get_db_session
from framework.util.logger import setup_logger
from incentive.domain.entity.award import Award
from incentive.domain.entity.user_word_bank_award import UserWordBankAward
from incentive.domain.service.award_service import AwardService

logger = setup_logger(__name__)

@injectable
class UserWordBankAwardService:
    def __init__(self,award_service:AwardService):
        self.award_service = award_service
        
    @transactional
    def init_user_word_bank_award(self,user_id:int,word_bank_id:int) -> None:
        """
        初始化用户奖品
        """
        # 先判断之前有没有数据
        user_word_bank_award = get_db_session().query(UserWordBankAward).filter(UserWordBankAward.user_id == user_id,UserWordBankAward.word_bank_id == word_bank_id).first()
        if user_word_bank_award:
            return
        
        # 没有数据，则初始化
        award_list = self.award_service.query_award_list()
        user_word_bank_award_list = []
        for award in award_list:
            user_award = UserWordBankAward(user_id=user_id,
                                 word_bank_id=word_bank_id,
                                 award_id=award.id,
                                 num=0,
                                 is_unlocked = award.init_is_unlocked
                                 )
            user_word_bank_award_list.append(user_award)
        get_db_session().bulk_save_objects(user_word_bank_award_list)

    @readonly
    def query_user_word_bank_award_list(self,user_id:int,word_bank_id:int) -> List[UserWordBankAward]:
        """
        查询用户词库奖品列表，包含奖品详细信息
        """
        result = (
            get_db_session()
            .query(
                UserWordBankAward,
                Award.name,
                Award.description,
                Award.image_path,
                Award.video_path,
                Award.algo_type,
                Award.algo_value,
                Award.type
            )
            .join(Award, UserWordBankAward.award_id == Award.id)
            .filter(
                UserWordBankAward.user_id == user_id,
                UserWordBankAward.word_bank_id == word_bank_id
            )
            .order_by(Award.type,Award.id)
            .all()
        )
    
        user_word_bank_award_list = []
        tiejian_unlocked = True
        for user_word_bank_award,name,description,image_path,video_path,algo_type,algo_value,type in result:
            user_word_bank_award.name = name
            user_word_bank_award.description = description
            user_word_bank_award.image_path = image_path
            user_word_bank_award.video_path = video_path
            user_word_bank_award.algo_type = algo_type
            user_word_bank_award.algo_value = algo_value
            user_word_bank_award.type = type
            user_word_bank_award_list.append(user_word_bank_award)
            # 特殊处理 如果铁剑未解锁，则玄衣用xuanyiwujian.jpg
            if name == "铁剑":
                tiejian_unlocked = user_word_bank_award.is_unlocked 
            if name == "玄衣":
                if not tiejian_unlocked:
                    user_word_bank_award.image_path = "/images/armors/xuanyiwujian.jpg"

        return user_word_bank_award_list
    
    
    @transactional
    def update_user_word_bank_award_list(self,user_word_bank_award_list:List[UserWordBankAward]) -> None:
        """
        更新用户词库奖品列表
        """
        get_db_session().bulk_save_objects(user_word_bank_award_list)
        get_db_session().commit()
    
    @readonly
    def query_user_word_bank_award_list_by_type(self,user_id:int,word_bank_id:int,award_type:int) -> List[UserWordBankAward]:
        """
        根据类型查询用户词库奖品列表
        """
        # 获取所有奖品列表，然后按类型过滤
        all_awards = self.query_user_word_bank_award_list(user_id, word_bank_id)
        filtered_awards = [award for award in all_awards if award.type == award_type]
        # 按ID排序
        filtered_awards.sort(key=lambda x: x.id)
        return filtered_awards 
