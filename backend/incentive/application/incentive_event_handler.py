"""
激励事件处理器，处理来自study模块的事件
"""
from framework.container.container_decorator import injectable
from framework.events.event_bus import get_event_bus
from framework.util.logger import setup_logger
from framework.startup.startup_manager import register_startup_service
from incentive.application.incentive_app_service import IncentiveAppService
from incentive.dto.incentive_dto import IncentiveResultDto

logger = setup_logger(__name__)

@injectable
@register_startup_service
class IncentiveEventHandler:
    """激励事件处理器"""
    
    def __init__(self, incentive_app_service: IncentiveAppService):
        self.incentive_app_service = incentive_app_service
        self.event_bus = get_event_bus()
        
        # 注册事件处理器
        self._register_handlers()
        
        logger.info("激励事件处理器已初始化")
    
    def _register_handlers(self):
        """注册事件处理器"""
        # 注册学习完成事件处理器
        self.event_bus.study_completed_signal.connect(self.handle_study_completed)
        # 注册词库切换事件处理器
        self.event_bus.word_bank_switched_signal.connect(self.handle_word_bank_switched)
    
    def handle_study_completed(self, sender, **kwargs):
        """处理学习完成事件"""
        try:
            user_id = kwargs.get('user_id')
            word_bank_id = kwargs.get('word_bank_id')
            memorized_ratio = kwargs.get('memorized_ratio')
            slained_ratio = kwargs.get('slained_ratio')
            study_result = kwargs.get('study_result')
            
            logger.info(f"收到学习完成事件: user_id={user_id}, word_bank_id={word_bank_id}, study_result={study_result}")
            
            # 只有答题正确时才触发激励
            if study_result == 1:  # 假设1表示正确
                award_list = self.incentive_app_service.do_incentive(
                    user_id, word_bank_id, memorized_ratio, slained_ratio
                )
                logger.info(f"激励处理完成，获得奖品数量: {len(award_list)}")
                return award_list
            else:
                logger.info("答题错误，不触发激励")
                return []
                
        except Exception as e:
            logger.error(f"处理学习完成事件失败: {e}")
            raise e 
    
    def handle_word_bank_switched(self, sender, **kwargs):
        """处理词库切换事件"""
        try:
            user_id = kwargs.get('user_id')
            word_bank_id = kwargs.get('word_bank_id')
            
            logger.info(f"收到词库切换事件: user_id={user_id}, word_bank_id={word_bank_id}")
            
            # 初始化用户词库激励信息
            self.incentive_app_service.init_user_word_bank_incentive(user_id, word_bank_id)
            logger.info(f"用户词库激励信息初始化完成: user_id={user_id}, word_bank_id={word_bank_id}")
                
        except Exception as e:
            logger.error(f"处理词库切换事件失败: {e}") 