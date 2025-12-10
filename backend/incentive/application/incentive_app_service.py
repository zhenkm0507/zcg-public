from itertools import groupby
from typing import List
from framework.container.container_decorator import injectable
from framework.database.db_decorator import readonly, transactional
from framework.util.logger import setup_logger
from framework.util.oo_converter import orm_to_dto
from incentive.domain.entity.user_word_bank_award import UserWordBankAward
from incentive.domain.service.incentive_serivce import IncentiveService
from incentive.domain.service.user_word_bank_award_service import UserWordBankAwardService
from incentive.domain.service.user_word_bank_profile_service import UserWordBankProfileService
from incentive.dto.incentive_dto import AwardItemDto, IncentiveResultDto, UserWordBankAwardDto, UserWordBankProfileDto
from incentive.enum.incentive_enums import AwardTypeEnum, UserLevelEnum

logger = setup_logger(__name__)

@injectable
class IncentiveAppService:
    def __init__(self,user_word_bank_award_service:UserWordBankAwardService,user_word_bank_profile_service:UserWordBankProfileService,incentive_service:IncentiveService):
        self.user_word_bank_award_service = user_word_bank_award_service
        self.user_word_bank_profile_service = user_word_bank_profile_service
        self.incentive_service = incentive_service

    @transactional
    def init_user_word_bank_incentive(self,user_id:int,word_bank_id:int) -> None:
        """
        初始化用户词库激励信息
        """
        self.user_word_bank_award_service.init_user_word_bank_award(user_id,word_bank_id)
        self.user_word_bank_profile_service.init_user_word_bank_profile(user_id,word_bank_id)

    def query_user_word_bank_award_list(self,user_id:int,word_bank_id:int) -> List[UserWordBankAwardDto]:
        """
        查询用户词库奖品列表
        """
        user_word_bank_award_list = self.user_word_bank_award_service.query_user_word_bank_award_list(user_id,word_bank_id)
        dto_list = []
        # 根据type字段分组
        for type, records in groupby(user_word_bank_award_list, key=lambda x: x.type):
            try:
                award_type_name = AwardTypeEnum.from_code(type).name
            except ValueError as e:
                logger.error(f"Invalid award type code: {type}, error: {e}")
                award_type_name = "未知类型"
                
            award_list = []
            for record in records:
                award_item_dto = AwardItemDto(id=record.award_id,
                                              name=record.name,
                                              num=record.num,
                                              is_unlocked=record.is_unlocked,
                                              description=record.description,
                                              image_path=record.image_path,
                                              video_path=record.video_path)
                award_list.append(award_item_dto)
            dto_list.append(UserWordBankAwardDto(award_type=type,award_type_name=award_type_name,award_list=award_list))
            # logger.info(f"award_type_name: {award_type_name};award_type: {type};award_list: {award_list}")
        return dto_list
    
    def query_user_word_bank_profile(self,user_id:int,word_bank_id:int) -> UserWordBankProfileDto:
        """
        查询用户词库激励信息
        """
        user_word_bank_profile = self.user_word_bank_profile_service.query_user_word_bank_profile(user_id,word_bank_id)
        dto =orm_to_dto(user_word_bank_profile,UserWordBankProfileDto)
        dto.user_level_name = UserLevelEnum.from_code(dto.user_level).name
        dto.image_path = self.user_word_bank_profile_service.get_user_word_bank_profile_image_path(user_id,word_bank_id)
        return dto
    
    def do_incentive(self,user_id:int,word_bank_id:int,memorized_ratio:float,slained_ratio:float) -> List[IncentiveResultDto]:
        """
        触发激励逻辑
        """
        return self.incentive_service.do_incentive(user_id,word_bank_id,memorized_ratio,slained_ratio)
    
    