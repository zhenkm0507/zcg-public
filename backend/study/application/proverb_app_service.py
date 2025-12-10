import json
from typing import List
from framework.container.container_decorator import injectable
from framework.database.db_decorator import readonly, transactional
from framework.util.dify_utill import run_workflow
from framework.util.logger import setup_logger
from framework.util.oo_converter import orm_to_dto, orm_to_dto_list
from study.domain.entity.proverb import Proverb
from study.domain.service.proverb_service import ProverbService
from framework.config.config import settings
from study.dto.study_dto import ProverbDto

logger = setup_logger(__name__)

@injectable
class ProverbAppService:
    def __init__(self,proverb_service:ProverbService):
        self.proverb_service = ProverbService()

    @transactional
    def init_proverb_storage(self):
        proverbs = self._get_proverbs()
        for proverb in proverbs:
           try:
               if self.proverb_service.get_proverb_by_proverb(proverb.proverb):
                   continue
               self.proverb_service.add_proverb(proverb)
           except Exception as e:
               logger.error(f"插入谚语失败: {e}")
               continue
    
    @transactional
    def get_proverb_for_display(self,user_id:int) -> ProverbDto:

        proverb =  self.proverb_service.get_proverb_for_display(user_id)
        return orm_to_dto(proverb, ProverbDto)
    
    @readonly
    def get_proverb_list(self) -> List[ProverbDto]:
        proverbs = self.proverb_service.get_proverb_list()
        return orm_to_dto_list(proverbs, ProverbDto)

    def _get_proverbs(self) ->List[Proverb]:
        inputs = {
        }
        api_key = settings.DIFY_API_KEY.get("DIFY_API_KEY_FOR_PROVERB")
        result = run_workflow(api_key,inputs,"result")
        logger.info(f"Dify result: {result}")
        result_list = json.loads(result)
        # 将列表中的每个字典转换为Proverb对象
        proverbs = []
        for item in result_list:
            proverb = Proverb(proverb=item.get("proverb"), chinese_exp=item.get("chinese_exp"))
            proverbs.append(proverb)
        return proverbs   
    
