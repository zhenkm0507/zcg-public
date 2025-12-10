from typing import List
from framework.container.container_decorator import injectable
from framework.startup.startup_manager import register_startup_service
import schedule
import time
import threading
from datetime import datetime
from framework.util.logger import setup_logger
from study.domain.entity.user_study_batch_record import UserStudyBatchRecord
from study.domain.service.study_batch_record_service import StudyBatchRecordService
from study.domain.service.study_service import StudyService

logger = setup_logger(__name__)

@injectable
@register_startup_service
class HardWordBatchSet:
    """
    hard词批次设置定时器，定时将hard词加入到hard词批次里，方便后续学习
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
        
        # 设置每小时的5分执行一次任务
        self._schedule.every().hour.at(":05").do(self._hourly_task)
        # self.schedule.every(30).seconds.do(self._hourly_task)
        
        # 启动调度器线程
        self._running = True
        self._scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self._scheduler_thread.start()
        
        logger.info("hard词批次设置定时器已启动，每小时执行一次任务")

    def _run_scheduler(self):
        """运行调度器的线程函数"""
        while self._running:
            self._schedule.run_pending()
            time.sleep(1)  # 每秒检查一次是否有待执行的任务

    def _hourly_task(self):
        """每小时执行的任务"""
        try:
            logger.info(f"hard词批次设置定时任务，时间: {datetime.now()}")
            # 在这里添加具体的业务逻辑
            self._process_hourly_business_logic()
        except Exception as e:
            logger.error(f"hard词批次设置定时任务执行失败: {e}")

    def _process_hourly_business_logic(self):
        """
        对每个user_id-word_bank_id的组合，做以下处理：
          找到所有需要加入批次的hard词（所有的错词（>=2）- 已经加入批次的hard词）
          找到未加满的那个批次
          if 不存在未加满的批次:
            生成新的批次，将词加入新的批次，然后保存
          else:
            将词加入批次
            if 此批次没加满：
              则保存这个批次，注意状态 
            else:
              则生成新的批次，将词加入新的批次，然后保存
        """
        need_update_batch_record_list = []
        hard_word_batch_size = 15
        u_w_tuple_list = self.study_service.query_user_id_word_bank_id_tuple_list()
        for user_id, word_bank_id in u_w_tuple_list:
            # 获取背错次数>=2的所有hard词
            hard_word_list = self.study_service.get_hard_word_record_list(user_id,word_bank_id,fault_count=2)
            # 获取所有已经加入批次的hard词
            hard_word_in_batch = self.study_batch_record_service.get_all_hard_word_in_batch(user_id,word_bank_id)
            # 计算需要加入批次的hard词
            need_add_hard_word_list = []
            if hard_word_in_batch:
                need_add_hard_word_list = [word for word in hard_word_list if word not in hard_word_in_batch]
            else:
                need_add_hard_word_list = hard_word_list

            if not need_add_hard_word_list:
                logger.info(f"user_id: {user_id}, word_bank_id: {word_bank_id}, 没有需要加入批次的hard词")
                continue
            logger.info(f"user_id: {user_id}, word_bank_id: {word_bank_id}, 需要加入批次的hard词: {need_add_hard_word_list}")
            # 找到最后的批次
            the_last_hard_word_batch = self.study_batch_record_service.get_the_last_hard_word_batch(user_id,word_bank_id)
            # 取最后一个"_"后面的数字
            init_seq_num = int(the_last_hard_word_batch.batch_no.split("_")[-1])+1 if the_last_hard_word_batch and the_last_hard_word_batch.batch_no and "_" in the_last_hard_word_batch.batch_no else 1
            logger.info(f"user_id: {user_id}, word_bank_id: {word_bank_id}, init_seq_num: {init_seq_num}")
            #不存在未加满的批次的情况
            if not the_last_hard_word_batch or the_last_hard_word_batch.word_count == hard_word_batch_size:
                # 生成新的批次
                new_batch_record_list = self.study_batch_record_service.add_word_to_batch_list(user_id,word_bank_id,need_add_hard_word_list,hard_word_batch_size,init_seq_num)
                need_update_batch_record_list.extend(new_batch_record_list)
            else:
                remaining_word_list = self.study_batch_record_service.add_word_to_batch(need_add_hard_word_list,the_last_hard_word_batch,hard_word_batch_size)
                need_update_batch_record_list.append(the_last_hard_word_batch)
                new_batch_record_list = self.study_batch_record_service.add_word_to_batch_list(user_id,word_bank_id,remaining_word_list,hard_word_batch_size,init_seq_num)
                need_update_batch_record_list.extend(new_batch_record_list)
        # 批量处理批次记录        
        self.study_batch_record_service.batch_process_record_list(need_update_batch_record_list)         

    def stop_scheduler(self):
        """停止定时调度器"""
        self._running = False
        if self._scheduler_thread:
            self._scheduler_thread.join(timeout=5)  # 等待线程结束，最多等待5秒
        self._schedule.clear()  # 清除所有定时任务
        logger.info("hard词批次设置定时调度器已停止")

    def __del__(self):
        """析构函数，确保调度器被正确清理"""
        self.stop_scheduler() 