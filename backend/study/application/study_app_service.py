from itertools import groupby
from enum import Enum
from typing import List, Tuple
from framework.container.container_decorator import injectable
from framework.database.db_decorator import readonly, transactional
from framework.events.event_bus import get_event_bus
from study.application.charts_dto_builder import ChartsDtoBuilder
from study.domain.service.study_batch_record_service import StudyBatchRecordService
from study.domain.service.study_service import StudyService
from study.domain.service.user_word_service import UserWordService
from study.dto.bar_charts_dto import BarChartDto
from study.dto.pie_charts_dto import PieChartsDto
from study.dto.study_dto import AnswerInfoDto, AnswerInfoItem, AnswerResponse, HardWordDto, JudgePhraseResponse, StudyRecordDto, StudyRecordItemDto, UserFlagsSetDto, UserWordDto, UserWordStatusStatsDto, WordTaskInfoDto, WordItemDto
from study.dto.word_info_dto import InflectionListDto, WordInfoDto
from study.enums.study_enums import InflectionTypeEnum, StudyResultEnum, UserWordStatusEnum
from user.application.user_app_service import UserAppService
from framework.util.oo_converter import orm_to_dto, orm_to_dto_list
from framework.util.logger import setup_logger
from word.application.word_app_service import WordAppService

logger = setup_logger(__name__)

@injectable
class StudyAppService:
    def __init__(self,user_word_service:UserWordService,word_app_service:WordAppService,study_service:StudyService,user_app_service:UserAppService,study_batch_record_service:StudyBatchRecordService):
        self.user_word_service = user_word_service
        self.word_app_service = word_app_service
        self.study_service = study_service
        self.user_app_service = user_app_service
        self.study_batch_record_service = study_batch_record_service
        self.event_bus = get_event_bus()
    @transactional
    def switch_word_bank(self,user_id:int,word_bank_id:int) -> None:
        """
        切换词库
        """
        # 更新用户当前词库ID
        self.user_app_service.update_user_current_word_bank_id(user_id,word_bank_id)
        # 初始化用户单词
        self.user_word_service.init_user_word(user_id,word_bank_id)
        # 触发词库切换事件，让激励模块异步初始化
        self.event_bus.trigger_word_bank_switched(user_id, word_bank_id)
    
    @transactional    
    def get_word_task_info(self,user_id:int,word_bank_id:int,batch_id:int,flag:str=None) -> WordTaskInfoDto:
        """
        获取单词学习任务信息
        if(batch_id 为空){
            return self._origin_get_word_task_info(user_id,word_bank_id)
        }
        else{ //batch_id不为空
            //读取批次信息
            if(批次信息的is_finished为true){
                return self._origin_get_word_task_info(user_id,word_bank_id)
            }
            else{ //批次信息的is_finished为false
                //读取批次信息的单词列表字段words，找出第一个未背的单词为selected_word，然后将其设置为已背，然后返回
                //如果words所有的单词都已背，则将其is_finished设置为true，更新到数据库里
                //根据selected_word，查出单词详情，生成学习记录，然后返回
            }
        }
        """  
        if batch_id is None:    
            return self._origin_get_word_task_info(user_id,word_bank_id,flag)
        else:
            batch_record = self.study_batch_record_service.get_study_batch_record(batch_id)
            if batch_record.is_finished:
                return self._origin_get_word_task_info(user_id,word_bank_id,flag)
            else:
                # 查询今天学习过的单词
                today_study_record_list = self.study_service.query_study_record_list_today(user_id,word_bank_id)
                today_study_word_set = set(record.word for record in today_study_record_list)
                selected_word = None
                # 将 JSON 数据转换为 WordItemDto 对象列表
                words = [WordItemDto(**word_dict) for word_dict in batch_record.words] if batch_record.words else []
                for word in words:
                    if not word.is_memorized:
                        word.is_memorized = True
                        # 如果今天没有学习过，则选中，如果是今天学习过的单词，则跳过
                        if word.word not in today_study_word_set:
                           selected_word = word.word
                           break
                
                # 检查是否所有单词都已背完
                all_memorized = all(word.is_memorized for word in words)
                if all_memorized:
                    batch_record.is_finished = True
                
                # 重置batch_record的words字段，并更新到数据库
                batch_record.words = [word.model_dump() for word in words]
                
                # 如果有选中的单词，返回学习任务
                if selected_word:
                    word_entity = self.word_app_service.query_word_info(selected_word,word_bank_id)
                    # 生成学习记录信息
                    task_id = self.study_service.create_study_record(user_id,word_bank_id,word_entity.word)
                    word_info = orm_to_dto(word_entity,WordInfoDto)
                    word_info.mask_word(is_for_battle=True)
                    return WordTaskInfoDto(is_completed=False,
                        task_id=task_id,
                        word_info=word_info)
                else:
                    return self._origin_get_word_task_info(user_id,word_bank_id,flag)
    
    @transactional    
    def _origin_get_word_task_info(self,user_id:int,word_bank_id:int,flag:str=None) -> WordTaskInfoDto:
        """
        获取单词学习任务信息
        """
        # 本次学习的序列号
        task_id = None
        # 本次学习的单词详情
        word_entity = None
        # 查询 有无 record_time字段为空的学习记录
        query_empty_study_record = self.study_service.query_empty_study_record(user_id,word_bank_id)
        #第一种情况：有空的学习记录
        if query_empty_study_record is not None:
            word_entity = self.word_app_service.query_word_info(query_empty_study_record.word,word_bank_id)
            task_id = query_empty_study_record.seq_id
        else:
            # 第二种情况：没有空的学习记录,选一个新的单词
            user_word,is_completed = self.user_word_service.select_user_word_for_study(user_id,word_bank_id,flag)
            # 单词都被斩的情况，直接返回
            if is_completed:  
               return WordTaskInfoDto(is_completed=True)
            # 单词不存在，应该是当天已经学习过了，则直接返回空
            if user_word is None:
                return WordTaskInfoDto(is_completed=False)
            word_entity = self.word_app_service.query_word_info(user_word.word,word_bank_id)
            # 生成学习记录信息
            task_id = self.study_service.create_study_record(user_id,word_bank_id,word_entity.word)

        # word_entity = self.word_app_service.query_word_info('thing',1)
        # # 生成学习记录信息
        # task_id = self.study_service.create_study_record(user_id,1,'thing')    
        # 组装dto
        word_info = orm_to_dto(word_entity,WordInfoDto)
        word_info.mask_word(is_for_battle=True)

        return WordTaskInfoDto(is_completed=False,
                        task_id=task_id,
                        word_info=word_info)
    
    @transactional
    def process_answer_info(self,user_id:int,word_bank_id:int,answer_info:AnswerInfoDto) -> AnswerResponse:
        import time
        logger.info(f"处理答题信息: {answer_info}")
        """
        处理答题信息
        """
        total_start = time.time()
        
        # 更新学习记录
        step_start = time.time()
        word_status = self.study_service.update_study_record(user_id,word_bank_id,answer_info)
        logger.info(f"[性能] update_study_record 耗时: {time.time() - step_start:.3f}秒")

        # 更新用户单词状态
        step_start = time.time()
        self.user_word_service.update_user_word_status(user_id,word_bank_id,answer_info.word,word_status)
        logger.info(f"[性能] update_user_word_status 耗时: {time.time() - step_start:.3f}秒")

        # 触发学习完成事件，同步获取激励结果
        award_list = []
        if answer_info.study_result == StudyResultEnum.CORRECT.code:
            step_start = time.time()
            memorized_ratio, slained_ratio = self.user_word_service.get_word_ratio(user_id, word_bank_id)
            logger.info(f"[性能] get_word_ratio 耗时: {time.time() - step_start:.3f}秒, memorized_ratio={memorized_ratio},slained_ratio={slained_ratio}")
            
            step_start = time.time()
            award_list = self.event_bus.trigger_study_completed(user_id, word_bank_id, memorized_ratio, slained_ratio, answer_info.study_result)
            logger.info(f"[性能] trigger_study_completed 耗时: {time.time() - step_start:.3f}秒")

        response = AnswerResponse(word=answer_info.word,
                              is_slain= True if word_status == UserWordStatusEnum.SLAINED.code else False,
                              study_result=answer_info.study_result,
                              award_list=award_list)
        logger.info(f"[性能] process_answer_info 总耗时: {time.time() - total_start:.3f}秒, 答题响应: {response}")
        return response

   
    def judge_phrase(self,phrase:AnswerInfoItem) -> JudgePhraseResponse:
        """
        判断短语是否正确
        """
        # return JudgePhraseResponse(is_correct=True)
        return self.study_service.judge_phrase(phrase)
    
    def get_user_word_list(self,user_id:int,word_bank_id:int,userWordStatusEnum:Enum) -> List[UserWordDto]:
        """
        获取用户单词列表
        """
        user_word_list = self.user_word_service.select_user_word_list(user_id,word_bank_id,userWordStatusEnum)
        return orm_to_dto_list(user_word_list, UserWordDto)
    
    @readonly
    def get_user_word(self,user_id:int,word_bank_id:int,word:str,is_need_mask:bool=True) -> WordInfoDto:
        """
        获取用户单词
        """
        user_word = self.user_word_service.select_user_word(user_id,word_bank_id,word)
        word_original = user_word.word
        word_entity = self.word_app_service.query_word_info(word,word_bank_id)
        word_entity.flags = user_word.flags
        word_info = orm_to_dto(word_entity, WordInfoDto)
        # 如果用户单词状态不是斩杀状态，则对单词内容做*化处理
        if user_word.word_status != UserWordStatusEnum.SLAINED.code and is_need_mask:
            word_info.mask_word()
        word_info.unmask_word = word_original
        return word_info
    
    @readonly
    def get_study_record_list(self,user_id:int,word_bank_id:int) -> List[StudyRecordDto]:
        """
        获取学习记录列表
        """
        study_record_list = self.study_service.query_study_record_list(user_id,word_bank_id)
        study_record_list_dto = []       
        # 按日期分组
        for date, records in groupby(study_record_list, key=lambda x: x.record_time.date()):
            study_record_item_list = []
            for record in records:
                study_record_item_dto = StudyRecordItemDto(
                    id=record.id,
                    user_id=record.user_id,
                    word_bank_id=record.word_bank_id,
                    explanation=record.explanation or "",
                    record_time=record.record_time,
                    flags=record.flags or [],
                    answer_info=[AnswerInfoItem(**item) for item in record.answer_info] if record.answer_info else [],
                    study_result=StudyResultEnum.from_code(record.study_result).name,
                    word_status=UserWordStatusEnum.from_code(record.word_status).name,
                    unmask_word=record.word,
                    # 如果用户单词状态不是斩杀状态，则对单词内容做*化处理
                    word = record.word[0]+'*'* (len(record.word)-1) if record.word_status != UserWordStatusEnum.SLAINED.code else record.word
                )
                study_record_item_list.append(study_record_item_dto)

            study_record_dto = StudyRecordDto(
                record_date=date.strftime('%Y-%m-%d'),
                study_record_list=study_record_item_list
            )
                
            study_record_list_dto.append(study_record_dto)
            

        return study_record_list_dto
    
    @readonly
    def get_hard_word_record_list(self,user_id:int,word_bank_id:int,fault_count:int=None) -> List[HardWordDto]:
        """
        获取困难单词学习记录列表
        """
        if fault_count is None:
            fault_count = asura_word_threshold

        user = self.user_app_service.get_user_by_id(user_id)
        asura_word_threshold = user.asura_word_threshold
        
        study_record_list = self.study_service.query_study_record_list(user_id,word_bank_id,use_snapshot_word_status=False)
        # 按word分组
        word_groups = {}
        for record in study_record_list:
            if record.word not in word_groups:
                word_groups[record.word] = []
            word_groups[record.word].append(record)
        
        # 只留下错误次数大于等于3次的困难单词
        word_groups = {word: records for word, records in word_groups.items() 
                       if sum(1 for record in records if record.study_result == 0) >= fault_count}
       
        # 转换为DTO
        hard_word_list = []
        for word, records in word_groups.items():
            answer_info = []
            for record in records:
                answer_info.append(AnswerInfoDto(
                    record_date=record.record_time.strftime('%Y-%m-%d'),
                    study_result=record.study_result,
                    answer_info=[AnswerInfoItem(**item) for item in record.answer_info] if record.answer_info else []
                ))
                
            hard_word_dto = HardWordDto(
                user_id=records[0].user_id,
                word_bank_id=records[0].word_bank_id,
                explanation=records[0].explanation or "",
                word_status=UserWordStatusEnum.from_code(records[0].word_status).name,
                flags=records[0].flags or [],
                unmask_word=word,
                # 如果用户单词状态不是斩杀状态，则对单词内容做*化处理
                word = word[0]+'*'* (len(word)-1) if records[0].word_status != UserWordStatusEnum.SLAINED.code else word,
                answer_info=answer_info)
            hard_word_list.append(hard_word_dto)

        # 按照answer_info数组长度从大到小排序
        hard_word_list.sort(key=lambda x: len(x.answer_info), reverse=True)

        return hard_word_list
    
    @readonly
    def query_inflections(self,user_id:int,word_bank_id:int,inflection_type_enum:InflectionTypeEnum) -> InflectionListDto:
        """
        查询变形形式
        """
        return self.user_word_service.query_inflections(user_id,word_bank_id,inflection_type_enum)
    
    
    def query_user_flags(self,user_id:int,word_bank_id:int) -> List[str]:
        """
        查询用户在词库里的标签列表(用户自定义标签+词库标签)
        """
        user = self.user_app_service.get_user_by_id(user_id)
        word_bank = self.word_app_service.query_word_bank_by_id(word_bank_id)
        return user.word_flags + word_bank.word_flag_list
    

    def get_pie_chart_data(self,user_id:int,word_bank_id:int) -> PieChartsDto:
        """
        生成单词状态饼图数据
        """
        user_word_list = self.user_word_service.select_user_word_status(user_id,word_bank_id)

        return ChartsDtoBuilder.build_pie_charts_dto(user_word_list)
    
    def get_bar_chart_data(self,user_id:int,word_bank_id:int) -> BarChartDto:
        """
        生成学习记录柱状图数据
        """
        date_status_tuples = self.study_service.query_study_record_group_by_date(user_id,word_bank_id)

        return ChartsDtoBuilder.build_bar_chart(date_status_tuples)
    
    def get_user_word_status_stats(self,user_id:int,word_bank_id:int) -> UserWordStatusStatsDto:
        """
        获取用户单词状态统计
        """
        return self.user_word_service.get_user_word_status_stats(user_id,word_bank_id)
    
    def get_study_record_stats_last_hour(self) -> Tuple[int,int]:
        return self.study_service.query_study_record_stats_last_hour()
    
    def query_study_record_count(self,user_id:int,word_bank_id:int,study_date:str,study_result:int) -> int:
        """
        根据日期和study_result，查询学习记录的数量
        """
        return self.study_service.query_study_record_count(user_id,word_bank_id,study_date,study_result)
    
    def set_user_word_flags(self,user_id:int,word_bank_id:int,user_flags_set_dto:UserFlagsSetDto) -> None:
        """
        设置用户单词标签
        """
        self.user_word_service.set_user_word_flags(user_id,word_bank_id,user_flags_set_dto)