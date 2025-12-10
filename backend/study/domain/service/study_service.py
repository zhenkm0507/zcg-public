from datetime import datetime, timedelta
import json
from typing import List, Tuple
from framework.container.container_decorator import injectable
from framework.database.db_decorator import readonly, transactional
from framework.database.db_factory import get_db_session
from framework.util.dify_utill import run_workflow
from study.domain.entity.study_record import StudyRecord
import uuid
from sqlalchemy import func
from framework.util.logger import setup_logger
from study.domain.entity.user_word import UserWord
from study.dto.study_dto import AnswerInfoDto, AnswerInfoItem, JudgePhraseResponse
from study.enums.study_enums import StudyResultEnum, UserWordStatusEnum
from framework.config.config import settings
from word.domain.entity.word import Word

logger = setup_logger(__name__)

@injectable
class StudyService:
    @transactional
    def create_study_record(self,user_id:int,word_bank_id:int,word:str) -> str:
        """
        创建学习记录
        """
        study_record = StudyRecord(user_id=user_id,
                                   word_bank_id=word_bank_id,
                                   word=word,
                                   seq_id=str(uuid.uuid4()))
        get_db_session().add(study_record)
        return study_record.seq_id
    
    @transactional
    def update_study_record(self,user_id:int,word_bank_id:int,answer_info:AnswerInfoDto) -> int:
        """
        根据提交的答题信息，更新学习记录
        """
        # 将 answer_info 转换为字典
        answer_info_dict = [item.model_dump() for item in answer_info.answer_info]
        
        # 更新学习记录的record_time,study_result,answer_info
        get_db_session().query(StudyRecord).filter(StudyRecord.seq_id == answer_info.task_id).update({
                StudyRecord.record_time: datetime.now(),
                StudyRecord.study_result: answer_info.study_result,
                StudyRecord.answer_info: answer_info_dict
        })
        get_db_session().flush()
        # 计算单词状态
        word_status = self.compute_word_status(user_id,word_bank_id,answer_info.word,answer_info.study_result)
        # 更新学习记录的word_status
        get_db_session().query(StudyRecord).filter(StudyRecord.seq_id == answer_info.task_id).update({
            StudyRecord.word_status: word_status
        })
        get_db_session().flush()
        return word_status
    
    @readonly     
    def compute_word_status(self,user_id:int,word_bank_id:int,word:str,study_result:int) -> int:
        import time
        step_start = time.time()
        """
        计算单词状态
        """
        # 如果本次答题错误，则单词状态为等待斩杀
        if study_result == StudyResultEnum.INCORRECT.code:
            return UserWordStatusEnum.WAIT_SLAIN.code
        # 如果本次答题正确，则判断答题正确的学习记录数
        # 查询答题正确的单词学习记录
        query_start = time.time()
        records = get_db_session().query(StudyRecord).filter(StudyRecord.user_id == user_id,
                                                            StudyRecord.word_bank_id == word_bank_id,
                                                            StudyRecord.word == word,
                                                            StudyRecord.study_result == StudyResultEnum.CORRECT.code).order_by(StudyRecord.record_time).all()
        logger.info(f"[性能] compute_word_status 查询耗时: {time.time() - query_start:.3f}秒, 记录数={len(records)}")
        count = len(records)
        if count == 1:
            result = UserWordStatusEnum.SLAINING.code
        else:
            first_record = records[0]
            last_record = records[-1]
            if last_record.record_time - first_record.record_time > timedelta(days=30):
                result = UserWordStatusEnum.SLAINED.code
            else:
                result = UserWordStatusEnum.SLAINING.code
        logger.info(f"[性能] compute_word_status 总耗时: {time.time() - step_start:.3f}秒")
        return result
    @readonly
    def query_empty_study_record(self,user_id:int,word_bank_id:int) -> StudyRecord:
        """
        查询 record_time 为空的 学习记录
        """
        return get_db_session().query(StudyRecord).filter(
            StudyRecord.user_id == user_id,
            StudyRecord.word_bank_id == word_bank_id,
            StudyRecord.record_time == None
        ).order_by(StudyRecord.id.desc()).first()
    
    def judge_phrase(self,phrase:AnswerInfoItem) -> JudgePhraseResponse:
        """
        判断短语是否正确
        """
        inputs = {
               "phrase_question": json.dumps({
                    "question": phrase.question,
                    "correct_answer": phrase.correct_answer,
                    "user_answer": phrase.user_answer
               }, ensure_ascii=False)
        }
        api_key = settings.DIFY_API_KEY.get("DIFY_API_KEY_FOR_PHRASE")
        result = run_workflow(api_key,inputs,"result")
        logger.info(f"Dify result: {result}")
        result_dict = json.loads(result)
        return JudgePhraseResponse(is_correct=result_dict.get("is_correct", False))
    
    @readonly
    def query_study_record_list(self,user_id:int,word_bank_id:int,use_snapshot_word_status:bool=True) -> List[StudyRecord]:
        result = (get_db_session().query(StudyRecord, Word.explanation,UserWord.flags,UserWord.word_status)
                     .outerjoin(Word, 
                          (StudyRecord.word == Word.word) & 
                          (StudyRecord.word_bank_id == Word.word_bank_id))
                     .outerjoin(UserWord, 
                          (StudyRecord.word == UserWord.word) & 
                          (StudyRecord.word_bank_id == UserWord.word_bank_id) &
                          (StudyRecord.user_id == UserWord.user_id))
                     .filter(
                         StudyRecord.user_id == user_id,
                         StudyRecord.word_bank_id == word_bank_id,
                         StudyRecord.record_time != None
                     )
                     .order_by(StudyRecord.record_time.desc())
                     .all())
        study_record_list = []
        for study_record, explanation,flags,word_status in result:
            study_record.explanation = explanation
            study_record.flags = flags
            study_record_list.append(study_record)
            # 用UserWord的word_status覆盖StudyRecord的word_status
            if not use_snapshot_word_status:
                study_record.word_status = word_status

        return study_record_list
    
    @readonly
    def query_study_record_group_by_date(self,user_id:int,word_bank_id:int) -> List[Tuple[str,int,int]]:
        """
        查询学习记录,返回三元组[日期字符串,单词状态,学习结果]
        """
        result = get_db_session().query(
            func.date(StudyRecord.record_time).label('date'),
            StudyRecord.word_status,
            StudyRecord.study_result
        ).filter(
            StudyRecord.user_id == user_id,
            StudyRecord.word_bank_id == word_bank_id,
            StudyRecord.record_time != None
        ).order_by(StudyRecord.record_time).all()
        
        # 将日期对象转换为字符串格式
        converted_result = [(date.strftime('%Y-%m-%d'), word_status, study_result) for date, word_status, study_result in result]
        
        # 添加调试日志
        logger.info(f"query_study_record_group_by_date: 原始结果类型={type(result[0][0]) if result else 'empty'}, 转换后结果类型={type(converted_result[0][0]) if converted_result else 'empty'}")
        
        return converted_result
    
    @readonly
    def query_study_record_stats_last_hour(self) -> List[Tuple[int, int, int, int]]:
        """
        查询近1小时之内学习记录的总数和成功数，按user_id和word_bank_id分组
        返回：[(user_id, word_bank_id, 总记录数, 成功记录数), ...]
        """
        # 计算1小时前的时间
        one_hour_ago = datetime.now() - timedelta(hours=1)
        
        # 查询所有用户词库组合的总记录数
        total_stats = (get_db_session().query(
            StudyRecord.user_id,
            StudyRecord.word_bank_id,
            func.count(StudyRecord.id).label('total_count')
        )
        .filter(
            StudyRecord.record_time >= one_hour_ago,
            StudyRecord.record_time != None
        )
        .group_by(StudyRecord.user_id, StudyRecord.word_bank_id)
        .all())
        
        # 查询所有用户词库组合的成功记录数 (study_result=1)
        success_stats = (get_db_session().query(
            StudyRecord.user_id,
            StudyRecord.word_bank_id,
            func.count(StudyRecord.id).label('success_count')
        )
        .filter(
            StudyRecord.record_time >= one_hour_ago,
            StudyRecord.record_time != None,
            StudyRecord.study_result == 1
        )
        .group_by(StudyRecord.user_id, StudyRecord.word_bank_id)
        .all())
        
        # 将成功记录数转换为字典，方便查找
        success_dict = {(user_id, word_bank_id): success_count 
                        for user_id, word_bank_id, success_count in success_stats}
        
        # 合并结果
        result = []
        for user_id, word_bank_id, total_count in total_stats:
            success_count = success_dict.get((user_id, word_bank_id), 0)
            result.append((user_id, word_bank_id, total_count, success_count))
            logger.info(f"用户{user_id}在词库{word_bank_id}近1小时学习记录统计: 总数={total_count}, 成功数={success_count}")
        
        return result
        
    @readonly
    def query_study_record_count(self,user_id:int,word_bank_id:int,study_date:str,study_result:int) -> int:
        """
        根据日期和study_result，查询学习记录的数量
        """
        query = get_db_session().query(
            func.count(StudyRecord.id)
        ).filter(
            StudyRecord.user_id == user_id, 
            StudyRecord.word_bank_id == word_bank_id,
            func.date(StudyRecord.record_time) == study_date,
            StudyRecord.study_result == study_result
        )
        
        # 打印SQL语句（可选）
        logger.info(f"SQL: {query.statement.compile(compile_kwargs={'literal_binds': True})}")
        
        return query.first()[0]
    
    @readonly
    def query_study_record_list_today(self,user_id:int,word_bank_id:int) -> int:
        """
        根据日期，查询学习记录
        """
        return get_db_session().query(StudyRecord).filter(
            StudyRecord.user_id == user_id, 
            StudyRecord.word_bank_id == word_bank_id,
            func.date(StudyRecord.created_at) == datetime.now().strftime('%Y-%m-%d')
        ).all()
    
    @readonly
    def query_user_id_word_bank_id_tuple_list(self) -> List[Tuple[int, int]]:
        """
        从study_record表中查询所有唯一的user_id和word_bank_id组合
        返回：[(user_id, word_bank_id), ...]
        """
        result = (get_db_session().query(
            StudyRecord.user_id,
            StudyRecord.word_bank_id
        )
        .group_by(StudyRecord.user_id, StudyRecord.word_bank_id)
        .all())
        return result

    @readonly
    def get_hard_word_record_list(self,user_id:int,word_bank_id:int,fault_count) -> List[str]:
        """
        获取困难单词学习记录列表
        """
        hard_word_list = []
        study_record_list = self.query_study_record_list(user_id,word_bank_id,use_snapshot_word_status=False)
        # 按word分组
        word_groups = {}
        for record in study_record_list:
            if record.word not in word_groups:
                word_groups[record.word] = []
            word_groups[record.word].append(record)
        
        # 只留下错误次数大于等于fault_count次的困难单词
        word_groups = {word: records for word, records in word_groups.items() 
                       if sum(1 for record in records if record.study_result == 0) >= fault_count}
       
        word_min_time_list = [
            (word, min(record.record_time for record in records))
            for word, records in word_groups.items()
        ]
        # 按照min_record_time排序
        word_min_time_list.sort(key=lambda x: x[1])
        for word, min_record_time in word_min_time_list:
            hard_word_list.append(word)

        return hard_word_list    

    @readonly
    def get_incorrect_word_record_list(self,user_id:int,word_bank_id:int,start_time:str,end_time:str) -> List[str]:
        """
        获取错词学习记录列表
        """
        results = get_db_session().query(StudyRecord.word).filter(
            StudyRecord.user_id == user_id, 
            StudyRecord.word_bank_id == word_bank_id,
            func.date(StudyRecord.created_at) >= start_time,
            func.date(StudyRecord.created_at) <= end_time,
            StudyRecord.study_result == StudyResultEnum.INCORRECT.code
        ).distinct(StudyRecord.word).all()
        
        # 将 Row 对象转换为字符串列表
        return [row[0] for row in results]