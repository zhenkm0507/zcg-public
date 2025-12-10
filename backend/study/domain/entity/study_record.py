from sqlalchemy import Column, Integer, String, DateTime, JSON, BigInteger, SmallInteger
from framework.database.db_factory import Base


class StudyRecord(Base):
    """用户学习记录实体类"""
    __tablename__ = "t_user_study_record"
    __table_args__ = {"comment": "用户学习记录", "schema": "zcg"}

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键")
    user_id = Column(Integer, nullable=False, comment="用户ID")
    word_bank_id = Column(Integer, nullable=False, comment="词库ID")
    word = Column(String(64), nullable=False, comment="单词")
    record_time = Column(DateTime, nullable=True, comment="背词时间")
    answer_info = Column(JSON, nullable=True, comment="背词详情")
    study_result = Column(SmallInteger, nullable=True, comment="背词结果：0 未通过；1 通过")
    word_status = Column(SmallInteger, nullable=True, comment="背词状态")
    created_at = Column(DateTime(timezone=True), nullable=True, server_default="CURRENT_TIMESTAMP")
    updated_at = Column(DateTime(timezone=True), nullable=True, server_default="CURRENT_TIMESTAMP")
    seq_id = Column(String(36), nullable=False, unique=True, comment="全局唯一的序列号，标识一个用户对一个单词的一次学习")

    # 单词的中文释义
    explanation = None
    # 单词标签
    flags = None