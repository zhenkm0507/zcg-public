from datetime import datetime
from enum import Enum
from typing import Dict, List, Set, Tuple
from framework.container.container_decorator import injectable
from framework.database.db_decorator import readonly, transactional
from framework.database.db_factory import get_db_session
from framework.util.word_util import mask_word as mask_word_util
from framework.util.logger import setup_logger
from study.domain.entity.study_record import StudyRecord
from study.domain.entity.user_word import UserWord
from study.dto.study_dto import UserFlagsSetDto, UserWordStatusStatsDto
from study.dto.word_info_dto import InflectionListDto
from study.enums.study_enums import InflectionTypeEnum, UserFlagsOperateTypeEnum, UserWordStatusEnum
from word.application.word_app_service import WordAppService
from word.domain.entity.word import Word
from sqlalchemy import and_, case, func, or_
from sqlalchemy.dialects.postgresql import JSONB

logger = setup_logger(__name__)

@injectable
class UserWordService:
    """用户单词服务类"""
    def __init__(self,word_app_service:WordAppService):
        self.word_app_service = word_app_service

    @transactional
    def init_user_word(self, user_id:int,word_bank_id:int) -> None:
        """
        初始化用户单词
        """
        # 先判断之前有没有数据
        user_word = get_db_session().query(UserWord).filter(UserWord.user_id == user_id,UserWord.word_bank_id == word_bank_id).first()
        if user_word:
            return
        
        # 没有数据，则初始化
        word_list = self.word_app_service.query_word_list(word_bank_id)
        user_word_list = []
        for word in word_list:
            user_word = UserWord(user_id=user_id,
                                 word_bank_id=word_bank_id,
                                 word=word.word,
                                 word_status=0,
                                 flags=word.flags
                                 )
            user_word_list.append(user_word)
        get_db_session().bulk_save_objects(user_word_list)
        
    @readonly
    def select_user_word_for_study(self,user_id:int,word_bank_id:int,flag:str=None) -> Tuple[UserWord,bool]:
        is_completed = False
        """
        选择一个用户单词
        """
        # 按照更新时间排序，优先选择最远更新的单词
        query_filter = [
            UserWord.user_id == user_id,
            UserWord.word_bank_id == word_bank_id,
            UserWord.word_status.in_([0, 1])
        ]
        
        # 如果指定了flag参数，添加标签过滤条件
        if flag and flag != '全部':
            # 使用PostgreSQL的JSON操作符进行数组包含查询
            # 将flags字段转换为jsonb类型，然后使用@>操作符
            query_filter.append(func.cast(UserWord.flags, JSONB).op('@>')(func.cast([flag], JSONB)))
        
        count = (get_db_session().query(UserWord)
                .filter(*query_filter)
                .count())
        # 全部斩完的情况
        if count == 0:
            is_completed = True
            return None,is_completed
        else:
            is_completed = False

        # 使用NOT IN子查询优化，一次查询获取今天未学习的单词
        query_filter.extend([
            UserWord.word.notin_(
                get_db_session().query(StudyRecord.word)
                .filter(
                    StudyRecord.user_id == user_id,
                    StudyRecord.word_bank_id == word_bank_id,
                    func.date(StudyRecord.record_time) == datetime.now().date()
                )
            )
        ])
        
        user_word = (get_db_session().query(UserWord)
                    .filter(*query_filter)
                    .order_by(UserWord.word_status, UserWord.updated_at)
                    .first())
        
        return user_word, is_completed
        
    @transactional
    def update_user_word_status(self,user_id:int,word_bank_id:int,word:str,word_status:int) -> None:
        """
        更新用户单词状态
        """
        get_db_session().query(UserWord).filter(UserWord.user_id == user_id,UserWord.word_bank_id == word_bank_id,UserWord.word == word).update({
            UserWord.word_status: word_status
        })
        get_db_session().flush()
    
    @readonly
    def select_user_word_list(self,user_id:int,word_bank_id:int,userWordStatusEnum:Enum = None) -> List[UserWord]:
        """
        查询用户单词列表，并关联获取Word表中的explanation
        """
        # 构建基础过滤条件
        filter_conditions = [
            UserWord.user_id == user_id,
            UserWord.word_bank_id == word_bank_id
        ]
        
        # 如果 userWordStatusEnum 不为 None，则添加 word_status 条件
        if userWordStatusEnum is not None:
            filter_conditions.append(UserWord.word_status == userWordStatusEnum.code)
        
        # 使用leftjoin，这样即使Word表中没有对应的数据也能返回UserWord
        result = (get_db_session().query(UserWord, Word.explanation)
                     .outerjoin(Word, 
                          (UserWord.word == Word.word) & 
                          (UserWord.word_bank_id == Word.word_bank_id))
                     .filter(*filter_conditions)
                     .order_by(UserWord.id)
                     .all())
        
        # 将Word的explanation赋值给UserWord对象
        user_words = []
        for user_word, explanation in result:
            # explanation 是 Word 表中的解释，需要赋值给 UserWord 对象
            user_word.explanation = explanation or ""
            user_word.unmask_word = user_word.word
            # user_word.word_status != UserWordStatusEnum.SLAINED.value，对单词做*化处理(除了首字母外，其余字母都替换为*)
            if user_word.word_status != UserWordStatusEnum.SLAINED.code:
                user_word.word = mask_word_util(user_word.word,user_word.word)
            user_words.append(user_word)

        return user_words
    
    @readonly
    def get_mask_word_map(self,user_id:int,word_bank_id:int,word_set:Set[str]) -> Dict[str,str]:
        """
        获取用户单词列表，并返回单词与*化后的单词的映射
        """
        mask_word_map = {}
        user_word_list = get_db_session().query(UserWord).filter(UserWord.user_id == user_id,UserWord.word_bank_id == word_bank_id,UserWord.word.in_(word_set)).all()
        for user_word in user_word_list:
            mask_word = user_word.word
            if user_word.word_status != UserWordStatusEnum.SLAINED.code:
                mask_word = mask_word_util(user_word.word,user_word.word)
            mask_word_map[user_word.word] = mask_word
        return mask_word_map
    
    @readonly
    def select_user_word(self,user_id:int,word_bank_id:int,word:str) -> UserWord:
        """
        查询用户单词
        """
        return get_db_session().query(UserWord).filter(UserWord.user_id == user_id,UserWord.word_bank_id == word_bank_id,UserWord.word == word).first()
    
    
    @readonly
    def query_inflections(self,user_id:int,word_bank_id:int,inflection_type_enum:InflectionTypeEnum) -> InflectionListDto:
        """
        查询变形形式
        Args:
            word_bank_id: 词库ID
            inflection_type_enum: 变形形式类型
        Returns:
            InflectionListDto: 变形形式DTO
        """
        result = InflectionListDto()
        
        # 根据inflection_type_enum的不同值，生成不同的filter条件
        filter_conditions = [Word.word_bank_id == word_bank_id,UserWord.user_id == user_id]
        if inflection_type_enum == InflectionTypeEnum.VERB:
            # 使用or_组合多个条件
            verb_conditions = or_(
                and_(
                    func.json_extract_path_text(Word.inflection, 'past_tense') != '',
                    func.json_extract_path_text(Word.inflection, 'past_tense').isnot(None)
                ),
                and_(
                    func.json_extract_path_text(Word.inflection, 'past_participle') != '',
                    func.json_extract_path_text(Word.inflection, 'past_participle').isnot(None)
                ),
                and_(
                    func.json_extract_path_text(Word.inflection, 'present_participle') != '',
                    func.json_extract_path_text(Word.inflection, 'present_participle').isnot(None)
                )
            )
            filter_conditions.append(verb_conditions)
            db_result = get_db_session().query(Word,UserWord.flags).outerjoin(UserWord, and_(Word.word == UserWord.word, Word.word_bank_id == UserWord.word_bank_id)).filter(*filter_conditions).all()
            result.table_header = ['原形', '过去式', '过去分词', '现在分词','释义','标签']
            result.table_data = [[word.word, word.inflection.get('past_tense', ''), word.inflection.get('past_participle', ''), word.inflection.get('present_participle', ''),word.explanation,flags or []] for word,flags in db_result]
        elif inflection_type_enum == InflectionTypeEnum.ADJECTIVE:
            adjective_conditions = or_(
                and_(
                    func.json_extract_path_text(Word.inflection, 'comparative') != '',
                    func.json_extract_path_text(Word.inflection, 'comparative').isnot(None)
                ),
                and_(
                    func.json_extract_path_text(Word.inflection, 'superlative') != '',
                    func.json_extract_path_text(Word.inflection, 'superlative').isnot(None)
                )
            )
            filter_conditions.append(adjective_conditions)
            db_result = get_db_session().query(Word,UserWord.flags).outerjoin(UserWord, and_(Word.word == UserWord.word, Word.word_bank_id == UserWord.word_bank_id)).filter(*filter_conditions).all()
            result.table_header = ['原形', '比较级', '最高级','释义','标签']
            result.table_data = [[word.word, word.inflection.get('comparative', ''), word.inflection.get('superlative', ''),word.explanation,flags or []] for word,flags in db_result]
        elif inflection_type_enum == InflectionTypeEnum.NOUN:
            noun_conditions = or_(            
                and_(
                    func.json_extract_path_text(Word.inflection, 'plural') != '',
                    func.json_extract_path_text(Word.inflection, 'plural').isnot(None)
                )
            )
            filter_conditions.append(noun_conditions)
            db_result = get_db_session().query(Word,UserWord.flags).outerjoin(UserWord, and_(Word.word == UserWord.word, Word.word_bank_id == UserWord.word_bank_id)).filter(*filter_conditions).all()
            result.table_header = ['原形', '复数','释义','标签']
            result.table_data = [[word.word, word.inflection.get('plural', ''),word.explanation,flags or []] for word,flags in db_result]
     
        return result
    
    @readonly
    def select_user_word_status(self,user_id:int,word_bank_id:int) -> List[UserWord]:
        return get_db_session().query(UserWord).filter(
                         UserWord.user_id == user_id,
                         UserWord.word_bank_id == word_bank_id
                     ).all()
    @readonly
    def get_user_word_status_stats(self,user_id:int,word_bank_id:int) -> UserWordStatusStatsDto:
        """
        获取用户单词状态统计，总的待斩词数、斩中词数、已斩词数、总词数
        """
        import time
        step_start = time.time()
        # 使用 case 表达式和 sum 函数一次性统计各种状态的单词数量
        query_start = time.time()
        result = get_db_session().query(
            func.sum(case((UserWord.word_status == UserWordStatusEnum.SLAINED.code, 1), else_=0)).label('slain_word_count'),
            func.sum(case((UserWord.word_status == UserWordStatusEnum.SLAINING.code, 1), else_=0)).label('slaining_word_count'),
            func.sum(case((UserWord.word_status == UserWordStatusEnum.WAIT_SLAIN.code, 1), else_=0)).label('wait_word_count'),
            func.count(UserWord.id).label('total_word_count')
        ).filter(
            UserWord.user_id == user_id,
            UserWord.word_bank_id == word_bank_id
        ).first()
        logger.info(f"[性能] get_user_word_status_stats 查询耗时: {time.time() - query_start:.3f}秒")

        dto = UserWordStatusStatsDto(
            slain_word_count=result.slain_word_count or 0,
            slaining_word_count=result.slaining_word_count or 0,
            wait_word_count=result.wait_word_count or 0,
            total_word_count=result.total_word_count or 0
        )
        logger.info(f"[性能] get_user_word_status_stats 总耗时: {time.time() - step_start:.3f}秒")
        return dto
    
    def get_word_ratio(self,user_id:int,word_bank_id:int) -> Tuple[float,float]:
        """
        获取用户单词背词率、斩词率
        """
        stats_dto = self.get_user_word_status_stats(user_id,word_bank_id)
        memorized_ratio = round((stats_dto.slain_word_count + stats_dto.slaining_word_count) / stats_dto.total_word_count, 4)
        slained_ratio = round(stats_dto.slain_word_count / stats_dto.total_word_count, 4)
        return memorized_ratio,slained_ratio
    
    @transactional
    def set_user_word_flags(self,user_id:int,word_bank_id:int,user_flags_set_dto:UserFlagsSetDto) -> None:
        # 查询符合条件的UserWord集合
        user_words = get_db_session().query(UserWord).filter(
            UserWord.user_id == user_id,
            UserWord.word_bank_id == word_bank_id,
            UserWord.word.in_(user_flags_set_dto.words)
        ).all()
        
        # 根据操作类型处理flags
        for user_word in user_words:
            if user_flags_set_dto.operate_type == UserFlagsOperateTypeEnum.ADD.code:
                # 增加标签：合并现有标签和新标签，去重
                existing_flags = set(user_word.flags) if user_word.flags else set()
                new_flags = set(user_flags_set_dto.flags)
                user_word.flags = list(existing_flags.union(new_flags))
            elif user_flags_set_dto.operate_type == UserFlagsOperateTypeEnum.DELETE.code:
                # 删除标签：从现有标签中移除指定标签
                if user_word.flags:
                    existing_flags = set(user_word.flags)
                    flags_to_remove = set(user_flags_set_dto.flags)
                    user_word.flags = list(existing_flags - flags_to_remove)
        
        # 保存到数据库
        get_db_session().flush()