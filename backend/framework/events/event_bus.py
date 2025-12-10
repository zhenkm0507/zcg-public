"""
事件总线模块，用于解耦模块间的直接依赖
"""
from blinker import signal
from typing import Any, Dict, List
from framework.util.logger import setup_logger

logger = setup_logger(__name__)

class EventBus:
    """事件总线单例类"""
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, '_initialized'):
            return
        
        # 定义事件信号
        self.study_completed_signal = signal('study_completed')
        self.word_bank_switched_signal = signal('word_bank_switched')
        
        self._initialized = True
        logger.info("事件总线已初始化")
    
    def trigger_study_completed(self, user_id: int, word_bank_id: int, memorized_ratio: float, slained_ratio: float, study_result: int) -> List[Any]:
        """
        触发学习完成事件，返回激励结果
        """
        try:
            # 发送事件并获取所有handler的返回值
            results = self.study_completed_signal.send(
                'study_app_service',
                user_id=user_id,
                word_bank_id=word_bank_id,
                memorized_ratio=memorized_ratio,
                slained_ratio=slained_ratio,
                study_result=study_result
            )
            
            # 收集所有handler的返回值
            award_lists = []
            for handler, result in results:
                if result:
                    award_lists.extend(result)
            
            logger.info(f"学习完成事件触发成功: user_id={user_id}, word_bank_id={word_bank_id}, 获得奖品数量={len(award_lists)}")
            return award_lists
            
        except Exception as e:
            logger.error(f"触发学习完成事件失败: {e}")
            return []
    
    def trigger_word_bank_switched(self, user_id: int, word_bank_id: int):
        """
        触发词库切换事件
        """
        try:
            self.word_bank_switched_signal.send(
                'study_app_service',
                user_id=user_id,
                word_bank_id=word_bank_id
            )
            logger.info(f"词库切换事件触发成功: user_id={user_id}, word_bank_id={word_bank_id}")
        except Exception as e:
            logger.error(f"触发词库切换事件失败: {e}")

# 全局事件总线实例
event_bus = EventBus()

def get_event_bus() -> EventBus:
    """获取事件总线实例"""
    return event_bus 