from typing import List
from framework.container.container_decorator import injectable
from framework.database.db_decorator import readonly, transactional
from framework.util.logger import setup_logger
from framework.util.date_util import get_current_week_range_date_only
from sqlalchemy import Tuple
from study.domain.entity.user_study_batch_record import UserStudyBatchRecord
from framework.database.db_factory import get_db_session
from datetime import datetime
from sqlalchemy.orm.attributes import flag_modified
from study.dto.study_dto import WordItemDto

logger = setup_logger(__name__)

@injectable
class StudyBatchRecordService:
    def __init__(self):
        pass
    
    @transactional
    def create_study_batch_record(self, user_id: int, word_bank_id: int) -> None:
        
        current_time_str = datetime.now().strftime('%Y%m%d%H%M%S')
        user_study_batch_record = UserStudyBatchRecord(user_id=user_id, word_bank_id=word_bank_id,batch_no=current_time_str)
        get_db_session().add(user_study_batch_record)

    @readonly
    def get_study_batch_record(self, id: int) -> UserStudyBatchRecord:
        return get_db_session().query(UserStudyBatchRecord).filter(UserStudyBatchRecord.id == id).first()
    
    @readonly
    def get_study_batch_record_list(self, user_id: int, word_bank_id: int) -> List[UserStudyBatchRecord]:
        records = []
        records_hw = get_db_session().query(UserStudyBatchRecord).filter(
            UserStudyBatchRecord.user_id == user_id, 
            UserStudyBatchRecord.word_bank_id == word_bank_id,
            UserStudyBatchRecord.batch_no.like('HW%')
        ).order_by(UserStudyBatchRecord.id.desc()).all()

        records_not_hw = get_db_session().query(UserStudyBatchRecord).filter(
            UserStudyBatchRecord.user_id == user_id, 
            UserStudyBatchRecord.word_bank_id == word_bank_id,
            UserStudyBatchRecord.batch_no.notlike('HW%')
        ).order_by(UserStudyBatchRecord.id.desc()).all()
        records.extend(records_hw)
        records.extend(records_not_hw)
        
        # 为每个记录生成 word_count 字段
        for record in records:
            if record.words is not None:
                # 如果 words 是列表，计算长度
                if isinstance(record.words, list):
                    record.word_count = len(record.words)
                # 如果 words 是字典，计算键的数量
                elif isinstance(record.words, dict):
                    record.word_count = len(record.words.keys())
                else:
                    record.word_count = 0
            else:
                record.word_count = 0
        
        return records
    
    @transactional
    def set_words(self, id: int, words: List[WordItemDto]) -> None:
        user_study_batch_record = get_db_session().query(UserStudyBatchRecord).filter(UserStudyBatchRecord.id == id).first()
        # 将 Pydantic 模型列表转换为字典列表，以便存储到 JSON 字段
        words_dict_list = [word.model_dump() for word in words]
        user_study_batch_record.words = words_dict_list
    

    @transactional
    def reset_status(self, id: int) -> None:
        # 先查询记录
        user_study_batch_record = get_db_session().query(UserStudyBatchRecord).filter(UserStudyBatchRecord.id == id).first()
        
        if user_study_batch_record is None:
            return
            
        # 准备更新的数据
        update_data = {}
        update_data[UserStudyBatchRecord.is_finished] = False
        
        # 更新words字段中的is_memorized
        if user_study_batch_record.words:
           updated_words = [
              {**word_item, 'is_memorized': False} 
              for word_item in user_study_batch_record.words
           ]
           update_data[UserStudyBatchRecord.words] = updated_words
        
        # 执行更新
        if update_data:
            get_db_session().query(UserStudyBatchRecord).filter(
                UserStudyBatchRecord.id == id
            ).update(update_data)

    @readonly
    def get_all_hard_word_in_batch(self,user_id:int,word_bank_id:int) -> List[str]:
        """
        获取所有错词批次里的错词
        """
        hard_word_list = []
        records = get_db_session().query(UserStudyBatchRecord).filter(
            UserStudyBatchRecord.user_id == user_id, 
            UserStudyBatchRecord.word_bank_id == word_bank_id,
            UserStudyBatchRecord.batch_no.like('HW%')
        ).all()
        for record in records:
            if record.words:
                for word in record.words:
                  hard_word_list.append(word.get('word',''))
        return hard_word_list

    @readonly
    def get_the_last_hard_word_batch(self,user_id:int,word_bank_id:int) -> UserStudyBatchRecord:
        return get_db_session().query(UserStudyBatchRecord).filter(
            UserStudyBatchRecord.user_id == user_id, 
            UserStudyBatchRecord.word_bank_id == word_bank_id,
            UserStudyBatchRecord.batch_no.like('HW%')
        ).order_by(UserStudyBatchRecord.created_at.desc()).first()

    def add_word_to_batch_list(self,user_id:int,word_bank_id:int,word_list:List[str],word_batch_size:int,init_seq_num:int)->List[UserStudyBatchRecord]:
        """
        将错词生成新的批次，并返回批次列表，每个批次的大小为hard_word_batch_size
        """
        batch_record_list = []
        seq = init_seq_num
        for i in range(0,len(word_list),word_batch_size):
            w_list=word_list[i:i+word_batch_size]
            word_dict_list = []
            for word in w_list:
                word_dict = {
                    'word':word,
                    'is_memorized':False
                }
                word_dict_list.append(word_dict)
            batch_record = UserStudyBatchRecord(user_id=user_id,
                                                word_bank_id=word_bank_id,
                                                batch_no='HW'+"_"+str(seq),
                                                words=word_dict_list,
                                                is_finished=False)
            batch_record_list.append(batch_record)
            logger.info(f"user_id: {user_id}, word_bank_id: {word_bank_id}, 创建新批次: {batch_record.batch_no}, word_count: {len(batch_record.words)}")
            seq += 1
        return batch_record_list   
    
    def add_word_to_batch(self,word_list:List[str],batch_record:UserStudyBatchRecord,word_batch_size:int)->List[str]: 
        """
        将word_list里的单词放入batch_record，遵守word_batch_size
        """
        if not word_list:
            return word_list
            
        word_count = len(batch_record.words) if batch_record.words else 0
        add_word_dict_list = []
        
        # 计算需要添加的单词数量
        need_add_count = word_batch_size - word_count
        if need_add_count <= 0:
            return word_list
            
        # 实际能添加的单词数量（不能超过word_list的长度）
        actual_add_count = min(need_add_count, len(word_list))
        
        # 添加单词到batch_record
        for i in range(actual_add_count):
            word_dict = {
                'word': word_list[i],
                'is_memorized': False
            }
            add_word_dict_list.append(word_dict)
        
        # 确保batch_record.words是列表
        if batch_record.words is None:
            batch_record.words = []
            
        batch_record.words.extend(add_word_dict_list)
        flag_modified(batch_record, 'words')
        batch_record.is_finished = False

        logger.info(f"user_id: {batch_record.user_id}, word_bank_id: {batch_record.word_bank_id}, 批次: {batch_record.batch_no}, 添加单词: {add_word_dict_list}")
        
        # 返回剩余的word_list（去除已添加的单词）
        return word_list[actual_add_count:]
    
    @transactional
    def batch_process_record_list(self,batch_record_list:List[UserStudyBatchRecord])->None:
        """
        批量处理批次记录
        """
        get_db_session().bulk_save_objects(batch_record_list,preserve_order=True)

    @readonly
    def get_this_week_incorrect_word_batch(self,user_id:int,word_bank_id:int) -> UserStudyBatchRecord:
        this_week_batch_no = self._create_incorrect_word_batch_no()
        return get_db_session().query(UserStudyBatchRecord).filter(
            UserStudyBatchRecord.user_id == user_id, 
            UserStudyBatchRecord.word_bank_id == word_bank_id,
            UserStudyBatchRecord.batch_no == this_week_batch_no
        ).first()  
    
    @transactional
    def create_incorrect_word_batch_record(self,user_id:int,word_bank_id:int,words:List[str])->None:
        this_week_batch_no = self._create_incorrect_word_batch_no()
        word_dict_list = []
        for word in words:
            word_dict = {
                'word':word,
                'is_memorized':False
            }
            word_dict_list.append(word_dict)
        record = UserStudyBatchRecord(user_id=user_id,word_bank_id=word_bank_id,batch_no=this_week_batch_no,words=word_dict_list)       
        get_db_session().add(record)
        
    def _create_incorrect_word_batch_no(self)->str:
        start_time,end_time = get_current_week_range_date_only()
        # start_time 和 end_time 已经是字符串格式 'YYYY-MM-DD'，需要转换为 'YYYYMMDD' 格式
        start_date = start_time.replace('-', '')
        end_date = end_time.replace('-', '')
        return "IW_"+start_date+"-"+end_date[4:]  # 只取月日部分
    
    @transactional
    def add_words_to_batch(self,word_list:List[str],batch_record_id:int)->None: 
        """
        将word_list里的单词放入batch_record,并保存入库
        """
        if not word_list:
            return 
        batch_record = get_db_session().query(UserStudyBatchRecord).filter(UserStudyBatchRecord.id == batch_record_id).first()
        
        # 获取现有的单词列表
        existing_words = batch_record.words if batch_record.words else []
        
        # 提取现有单词的word字段
        existing_word_set = set()
        if isinstance(existing_words, list):
            for word_item in existing_words:
                if isinstance(word_item, dict) and 'word' in word_item:
                    existing_word_set.add(word_item['word'])
        
        # 找出需要添加的新单词
        new_words = [word for word in word_list if word not in existing_word_set]
        
        if not new_words:
            return
        logger.info(f"将 {new_words} 加入现有批次: {batch_record.batch_no}")    
        
        # 将新单词转换为WordItemDto格式并添加到现有列表中
        new_word_items = [{'word': word, 'is_memorized': False} for word in new_words]
        existing_words.extend(new_word_items)
        
        # 更新batch_record的words字段
        batch_record.words = existing_words
        batch_record.is_finished = False
        flag_modified(batch_record, 'words')
        
        # 保存到数据库
        get_db_session().flush()