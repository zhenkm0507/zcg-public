from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import Column, Integer, Boolean, JSON, DateTime, String
from sqlalchemy.ext.declarative import declarative_base
from framework.database.db_factory import Base

class UserStudyBatchRecord(Base):
    """
    用户学习批次记录实体类
    """
    __tablename__ = 't_user_study_batch_record'
    __table_args__ = {'comment': '用户学习批次记录', 'schema': 'zcg'}

    # 主键ID
    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(Integer, nullable=False, comment="用户ID")
    word_bank_id = Column(Integer, nullable=False, comment="词库ID")
    batch_no = Column(String(20), nullable=False, comment="批次号")
    created_at = Column(DateTime, nullable=False,default=datetime.now)
    # 是否完成
    is_finished = Column(Boolean, nullable=False, default=False)
    
    # 单词列表（JSON格式）
    words = Column(JSON, nullable=True)

    word_count = None
    
   