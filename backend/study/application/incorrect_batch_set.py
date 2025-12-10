from typing import List
from framework.container.container_decorator import injectable
from framework.startup.startup_manager import register_startup_service
import schedule
import time
import threading
from datetime import datetime
from framework.util.logger import setup_logger
from framework.util.date_util import get_current_week_range
from study.domain.entity.user_study_batch_record import UserStudyBatchRecord
from study.domain.service.study_batch_record_service import StudyBatchRecordService
from study.domain.service.study_service import StudyService

logger = setup_logger(__name__)

@injectable
@register_startup_service
class IncorrectWordBatchSet:
    """
    错词批次设置定时器，定时将错词加入到错词批次里，方便后续学习
    """
    
    def __init__(self, study_service: StudyService,study_batch_record_service: StudyBatchRecordService):
        self._scheduler_thread = None
        self._running = False
        self.study_service = study_service
        self.study_batch_record_service = study_batch_record_service
        self._schedule = schedule.Scheduler()  # 独立调度器
        self._start_scheduler()

    def _start_scheduler(self):
        """启动定时调度器"""
        if self._scheduler_thread and self._scheduler_thread.is_alive():
            return
        
        # 设置每5分钟执行一次任务
        self._schedule.every(5).minutes.do(self._five_minutes_task)
        
        # 启动调度器线程
        self._running = True
        self._scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self._scheduler_thread.start()
        
        logger.info("错词批次设置定时器已启动，每1分钟执行一次任务")

    def _run_scheduler(self):
        """运行调度器的线程函数"""
        while self._running:
            self._schedule.run_pending()
            time.sleep(1)  # 每秒检查一次是否有待执行的任务

    def _five_minutes_task(self):
        """每5分钟执行的任务"""
        try:
            logger.info(f"错词批次设置定时任务，时间: {datetime.now()}")
            # 在这里添加具体的业务逻辑
            self._process_hourly_business_logic()
        except Exception as e:
            logger.error(f"错词批次设置定时任务执行失败: {e}")

    def _process_hourly_business_logic(self):
        """
        对每个user_id-word_bank_id的组合，做以下处理：
          找到本周所有错词
          找到本周的错词批次
          if 本周错词批次不存在:
            生成新的错词批次，将词加入新的批次，然后保存
          else:
            将未加入的错词加入错词批次，保存
        """
        start_time, end_time = get_current_week_range()
        logger.info(f"错词批次处理开始，时间范围: {start_time} - {end_time}")
        
        u_w_tuple_list = self.study_service.query_user_id_word_bank_id_tuple_list()
        logger.info(f"找到 {len(u_w_tuple_list)} 个用户-词库组合")
        
        for user_id, word_bank_id in u_w_tuple_list:
            incorrect_word_list = self.study_service.get_incorrect_word_record_list(user_id, word_bank_id, start_time, end_time)
            logger.info(f"用户 {user_id} 词库 {word_bank_id} 找到 {len(incorrect_word_list)} 个错词")
            
            this_week_batch = self.study_batch_record_service.get_this_week_incorrect_word_batch(user_id, word_bank_id)

            if not this_week_batch:
                if incorrect_word_list:
                    logger.info(f"创建新的错词批次，包含 {len(incorrect_word_list)} 个错词")
                    self.study_batch_record_service.create_incorrect_word_batch_record(user_id, word_bank_id, incorrect_word_list)
            else:
                if incorrect_word_list:
                    self.study_batch_record_service.add_words_to_batch(incorrect_word_list, this_week_batch.id)
      

    def stop_scheduler(self):
        """停止定时调度器"""
        self._running = False
        if self._scheduler_thread:
            self._scheduler_thread.join(timeout=5)  # 等待线程结束，最多等待5秒
        self._schedule.clear()  # 清除所有定时任务
        logger.info("错词批次设置定时调度器已停止")

    def __del__(self):
        """析构函数，确保调度器被正确清理"""
        self.stop_scheduler() 