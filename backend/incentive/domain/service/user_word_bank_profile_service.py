from framework.container.container_decorator import injectable
from framework.database.db_decorator import readonly, transactional
from framework.database.db_factory import get_db_session
from framework.util.logger import setup_logger
from incentive.domain.entity.user_word_bank_award import UserWordBankAward
from incentive.domain.entity.user_word_bank_profile import UserWordBankProfile
from incentive.domain.service.user_word_bank_award_service import UserWordBankAwardService
from incentive.enum.incentive_enums import AwardTypeEnum

logger = setup_logger(__name__)

@injectable
class UserWordBankProfileService:
    def __init__(self,user_word_bank_award_service:UserWordBankAwardService):
        self.user_word_bank_award_service = user_word_bank_award_service
        
    @readonly
    def query_user_word_bank_profile(self,user_id:int,word_bank_id:int) -> UserWordBankProfile:
        return get_db_session().query(UserWordBankProfile).filter(UserWordBankProfile.user_id == user_id,UserWordBankProfile.word_bank_id == word_bank_id).first()
    
    @transactional
    def init_user_word_bank_profile(self,user_id:int,word_bank_id:int) -> None:
        # 先判断之前有没有数据
        user_word_bank_profile = self.query_user_word_bank_profile(user_id,word_bank_id)
        if user_word_bank_profile:
            return
        # 没有数据，则初始化
        user_word_bank_profile = UserWordBankProfile(
            user_id=user_id,
            word_bank_id=word_bank_id
        )
        get_db_session().add(user_word_bank_profile)
    
    def get_user_word_bank_profile_image_path(self,user_id:int,word_bank_id:int) -> str:
        # 查询已解锁的铠甲类型奖品，按ID排序，取最后一个
        award_list = self.user_word_bank_award_service.query_user_word_bank_award_list_by_type(user_id,word_bank_id,AwardTypeEnum.KJ.code)
        unlocked_awards = [award for award in award_list if award.is_unlocked]
        if unlocked_awards:
            # 按ID排序，取最后一个
            unlocked_awards.sort(key=lambda x: x.award_id)
            return unlocked_awards[-1].image_path
        return "/images/armors/xuanyiwujian.jpg"
    
    @transactional
    def update_exp_value_user_level(self,user_id:int,word_bank_id:int,experience_value:float,user_level:int) -> None:
        user_word_bank_profile = self.query_user_word_bank_profile(user_id,word_bank_id)
        user_word_bank_profile.experience_value = experience_value
        user_word_bank_profile.user_level = user_level
        get_db_session().commit()
    
    @transactional
    def increase_morale_value(self,user_id:int,word_bank_id:int,increase_value:int) -> None:
        user_word_bank_profile = self.query_user_word_bank_profile(user_id,word_bank_id)
        logger.info(f"修改士气值: user_id={user_id}, word_bank_id={word_bank_id}, old_morale_value={user_word_bank_profile.morale_value}, increase_value={increase_value}")
        user_word_bank_profile.morale_value = user_word_bank_profile.morale_value + increase_value
        get_db_session().commit()