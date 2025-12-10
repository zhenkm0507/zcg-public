from framework.container.container_decorator import injectable
from framework.startup.startup_manager import register_startup_service
import schedule
import time
import threading
from datetime import datetime
from framework.util.logger import setup_logger
from study.application.study_app_service import StudyAppService
from incentive.domain.service.user_word_bank_profile_service import UserWordBankProfileService

logger = setup_logger(__name__)

@injectable
@register_startup_service
class MoraleComputer:
    """
    士气计算器，定时计算用户士气值
    """
    
    def __init__(self, study_app_service: StudyAppService, user_word_bank_profile_service: UserWordBankProfileService):
        self._scheduler_thread = None
        self._running = False
        self.study_app_service = study_app_service
        self.user_word_bank_profile_service = user_word_bank_profile_service
        self._schedule = schedule.Scheduler()  # 独立调度器
        self._start_scheduler()

    def _start_scheduler(self):
        """启动定时调度器"""
        if self._scheduler_thread and self._scheduler_thread.is_alive():
            return
        
        # 设置每小时执行一次任务
        self._schedule.every().hour.do(self._hourly_task)
        # schedule.every(10).seconds.do(self._hourly_task)
        
        # 启动调度器线程
        self._running = True
        self._scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self._scheduler_thread.start()
        
        logger.info("士气计算定时调度器已启动，每小时执行一次任务")

    def _run_scheduler(self):
        """运行调度器的线程函数"""
        while self._running:
            self._schedule.run_pending()
            time.sleep(1)  # 每秒检查一次是否有待执行的任务

    def _hourly_task(self):
        """每小时执行的任务"""
        try:
            logger.info(f"执行士气计算定时任务，时间: {datetime.now()}")
            # 在这里添加具体的业务逻辑
            self._process_hourly_business_logic()
        except Exception as e:
            logger.error(f"士气计算定时任务执行失败: {e}")

    def _process_hourly_business_logic(self):
        """
        处理每小时业务逻辑
        计算近1小时内的背词成功率，如果大于等于80%，士气值加 1；小于等于 70%，士气值减 1
        """
        count_list = self.study_app_service.get_study_record_stats_last_hour()
        for user_id, word_bank_id, total_count, success_count in count_list:
            if total_count > 0:  # 避免除零错误
                success_ratio = success_count / total_count
                logger.info(f"士气值计算: user_id={user_id}, word_bank_id={word_bank_id}, success_ratio={success_count}/{total_count}={success_ratio}")
                increase_value = 0
                if success_ratio >= 0.8:
                    increase_value = 1
                elif success_ratio <= 0.7:
                    increase_value = -1
                if increase_value != 0:
                    self.user_word_bank_profile_service.increase_morale_value(user_id, word_bank_id, increase_value)

    def stop_scheduler(self):
        """停止定时调度器"""
        self._running = False
        if self._scheduler_thread:
            self._scheduler_thread.join(timeout=5)  # 等待线程结束，最多等待5秒
        self._schedule.clear()  # 清除所有定时任务
        logger.info("士气计算定时调度器已停止")

    def __del__(self):
        """析构函数，确保调度器被正确清理"""
        self.stop_scheduler() 