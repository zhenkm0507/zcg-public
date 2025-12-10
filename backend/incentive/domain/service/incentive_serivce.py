from datetime import datetime
from itertools import groupby
from framework.database.db_decorator import transactional
from incentive.domain.entity.user_word_bank_award import UserWordBankAward
import numpy as np
from typing import List, Tuple
from framework.container.container_decorator import injectable
from incentive.domain.service.user_word_bank_award_service import UserWordBankAwardService
from incentive.domain.service.user_word_bank_profile_service import UserWordBankProfileService
from incentive.dto.incentive_dto import IncentiveResultDto
from incentive.enum.incentive_enums import AwardAlgoTypeEnum
from study.application.study_app_service import StudyAppService
from study.enums.study_enums import StudyResultEnum

@injectable
class IncentiveService:
   """
   封装激励系统的相关逻辑
   """
   # 每天背词正确的记录数量,超过这个数量，则触发概率类奖品
   PER_DAY_CORRECT_RECORD_COUNT_FOR_PROBABILITY_AWARD = 15

   def __init__(self,user_word_bank_award_service:UserWordBankAwardService,user_word_bank_profile_service:UserWordBankProfileService,study_app_service:StudyAppService):
      self.user_word_bank_award_service = user_word_bank_award_service
      self.user_word_bank_profile_service = user_word_bank_profile_service
      self.study_app_service = study_app_service
      # 记录当天是否已经发放过概率类奖品
      self.probability_award_map: dict[str, bool] = {}
   @transactional
   def do_incentive(self,user_id:int,word_bank_id:int,memorized_ratio:float,slained_ratio:float) -> List[IncentiveResultDto]:
      """
      背词成功后，触发激励逻辑
      参数：
        memorized_ratio: 背词完成率
        slained_ratio: 斩词完成率
      返回：
        激励结果：
      逻辑：
        一、Profile值的计算与更新
           1. 根据背词完成率，计算经验值：经验值=背词完成率*100
           2. 士气值的计算(由MoraleComputer计算)
           3. 根据经验值，计算用户级别：功夫小子：斩词 < 20%，词林少侠：斩词 >=20%，词林大侠：斩词 >=50%，词林剑圣：斩词 >=80%，独孤词尊：斩词 >=100%
           4. 更新用户Profile信息
        二、奖品的计算与更新  
           1.在algo_type=3 的奖品中，根据概率计算本次背词的奖品，并更新用户词库奖品信息(is_unlocked、num)
           2.在algo_type=1 的奖品中，根据背词完成率，计算每种类型的奖品里，本次背词获得的奖品，并更新用户词库奖品信息(is_unlocked)
           3.在algo_type=2 的奖品中，根据斩词完成率，计算每种类型的奖品里，本次背词获得的奖品，并更新用户词库奖品信息(is_unlocked)
      """
      import time
      from framework.util.logger import setup_logger
      logger = setup_logger(__name__)
      total_start = time.time()
      result_list = []
      need_update_award_list = []
      # 1.1 计算经验值
      experience_value = round(memorized_ratio * 100, 1)
      # 1.2 计算士气值
      # 1.3 计算用户级别
      user_level = self.compute_user_level(slained_ratio)
      # 1.4 更新用户Profile信息
      step_start = time.time()
      self.user_word_bank_profile_service.update_exp_value_user_level(user_id,word_bank_id,experience_value,user_level)
      logger.info(f"[性能] do_incentive update_exp_value_user_level 耗时: {time.time() - step_start:.3f}秒")
      # 2.1 查询奖品信息
      step_start = time.time()
      award_list = self.user_word_bank_award_service.query_user_word_bank_award_list(user_id,word_bank_id)
      logger.info(f"[性能] do_incentive query_user_word_bank_award_list 耗时: {time.time() - step_start:.3f}秒")
      sorted_award_list = sorted(award_list, key=lambda x: x.algo_type)
      award_map = {}
      for algo_type, records in groupby(sorted_award_list, key=lambda x: x.algo_type):
         award_map[algo_type] = list(records)  # 将迭代器转换为列表
      # 2.2 计算概率类奖品
      step_start = time.time()
      probability_award_list = award_map.get(AwardAlgoTypeEnum.PROBABILITY.code,[])
      need_updated_award,probability_award_result = self.compute_probability_award(user_id, word_bank_id, probability_award_list,slained_ratio)
      logger.info(f"[性能] do_incentive compute_probability_award 耗时: {time.time() - step_start:.3f}秒")
      if probability_award_result:
         result_list.extend(probability_award_result)
         need_update_award_list.extend(need_updated_award)
      # 2.3 计算背词完成率类奖品
      memorized_ratio_award_list = award_map.get(AwardAlgoTypeEnum.MEMORIZED_RATIO.code,[])
      need_list,memorized_ratio_award_result_list = self.compute_ratio_award(memorized_ratio_award_list,memorized_ratio)
      if memorized_ratio_award_result_list:
         result_list.extend(memorized_ratio_award_result_list)
         need_update_award_list.extend(need_list)
      # 2.4 计算斩词完成率类奖品
      slained_ratio_award_list = award_map.get(AwardAlgoTypeEnum.SLAINED_RATIO.code,[])
      need_list,slained_ratio_award_result_list = self.compute_ratio_award(slained_ratio_award_list,slained_ratio)
      if slained_ratio_award_result_list:
         result_list.extend(slained_ratio_award_result_list)
         need_update_award_list.extend(need_list)

      # 2.5 更新库里的奖品信息 
      step_start = time.time()
      self.user_word_bank_award_service.update_user_word_bank_award_list(need_update_award_list)
      logger.info(f"[性能] do_incentive update_user_word_bank_award_list 耗时: {time.time() - step_start:.3f}秒")
      
      logger.info(f"[性能] do_incentive 总耗时: {time.time() - total_start:.3f}秒")
      return result_list

   def compute_user_level(self,slained_ratio:float) -> int:
      """
      功夫小子：斩词 < 20%，武林新秀：斩词 >=20%，江湖豪侠：斩词 >=50%，一代宗师：斩词 >=80%，武林至尊：斩词 >=100%
      """
      if slained_ratio < 0.2:
          return 1  # 功夫小子
      elif slained_ratio < 0.5:
          return 2  # 武林新秀
      elif slained_ratio < 0.8:
          return 3  # 江湖豪侠
      elif slained_ratio < 1.0:
          return 4  # 一代宗师
      else:
          return 5  # 武林至尊

   def compute_probability_award(self,user_id:int, word_bank_id:int, probability_award_list:List[UserWordBankAward],slained_ratio:float) -> Tuple[List[UserWordBankAward],List[IncentiveResultDto]]:
       probability_award_map = {award.name: award for award in probability_award_list} if probability_award_list else {}
       need_update_award_list = []
       result_list = []
       """
       根据概率计算概率类奖品
       """
       # 如果当天已经发放过概率类奖品，则不触发概率类奖品
       if self.probability_award_map.get(datetime.now().strftime('%Y-%m-%d'),False):
          return None,None
       
       # 如果当天背词正确的记录没有超过设定数量，则不触发概率类奖品
       study_date = datetime.now().strftime('%Y-%m-%d')
       import time
       from framework.util.logger import setup_logger
       logger = setup_logger(__name__)
       query_start = time.time()
       study_record_count = self.study_app_service.query_study_record_count(user_id,word_bank_id,study_date,StudyResultEnum.CORRECT.code)
       logger.info(f"[性能] compute_probability_award query_study_record_count 耗时: {time.time() - query_start:.3f}秒")
       if study_record_count < self.PER_DAY_CORRECT_RECORD_COUNT_FOR_PROBABILITY_AWARD:
          return None,None
       
       selected_award = None
       if probability_award_list:
          # 提取奖品ID和对应的概率
          probabilities = [award.algo_value for award in probability_award_list]
          
          # 确保概率总和为1
          total_prob = sum(probabilities)
          if total_prob > 0:
              normalized_probabilities = [p / total_prob for p in probabilities]
              # 根据概率随机选择一个奖品
              selected_award = np.random.choice(probability_award_list, p=normalized_probabilities)
       if selected_award:
          selected_award.is_unlocked = True
          selected_award.num += 1
          # 使用当前日期作为key来记录概率奖品的发放情况
          self.probability_award_map[datetime.now().strftime('%Y-%m-%d')] = True
          need_update_award_list.append(selected_award)
          result_list.append(IncentiveResultDto(
             award_type=selected_award.type,
             award_name=selected_award.name,
             image_path=selected_award.image_path,
             video_path=selected_award.video_path or ""  # 处理None值
          ))
       if slained_ratio >= 1 and probability_award_map.get('传国玉玺').is_unlocked == False:
          # 如果斩词完成率大于等于100%，且传国玉玺没被发放过，则把没有发放的奖品都发放
          for award in probability_award_list:
             if award.is_unlocked == False:
                award.is_unlocked = True
                award.num += 1
                need_update_award_list.append(award)
                result_list.append(IncentiveResultDto(
                   award_type=award.type,
                   award_name=award.name,
                   image_path=award.image_path,
                   video_path=award.video_path or ""  # 处理None值
                ))
       return need_update_award_list,result_list
   
   def compute_ratio_award(self,award_list:List[UserWordBankAward],ratio:float) -> Tuple[List[UserWordBankAward],List[IncentiveResultDto]]:
       """
       根据比例，将比例类奖品解锁
       """
       need_update_award_list = []
       result_list = []
       for award in award_list:
         if ratio >= award.algo_value and award.is_unlocked == False:
            award.is_unlocked = True
            need_update_award_list.append(award)
            result_list.append(IncentiveResultDto(
               award_type=award.type,
               award_name=award.name,
               image_path=award.image_path,
               video_path=award.video_path or ""  # 处理None值
            ))
       return need_update_award_list,result_list
   
if __name__ == "__main__":
   award_list = ['平安扣','十二生肖','断剑','金箍棒','浮雕翡翠','八相瑞','黄金貔貅','星辰钻','传国玉玺']
   value_list = [0.23,0.2,0.14,0.14,0.12,0.09,0.06,0.02,0]
   map = {}
   for i in range(10000):
     award = np.random.choice(award_list, p=value_list)
     map[award] = map.get(award,0) + 1
   print(map)





   
       