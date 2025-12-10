from sqlalchemy import Column, DateTime, Integer, String, JSON, ForeignKey
from sqlalchemy.orm import relationship
from framework.database.db_factory import Base


class UserWord(Base):
    """用户单词实体类"""
    __tablename__ = "t_user_word"
    __table_args__ = {"comment": "用户单词信息", "schema": "zcg"}

    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键")
    user_id = Column(Integer, nullable=False, comment="用户ID")
    word_bank_id = Column(Integer, nullable=False, comment="词库ID")
    word = Column(String(64), nullable=False, comment="单词")
    word_status = Column(Integer, nullable=False, comment="单词状态：0 待斩；1斩中；2已斩")
    flags = Column(JSON, nullable=True, comment="标签") 
    updated_at = Column(DateTime, nullable=True, comment="更新时间")
   
    # 单词的中文释义
    explanation = None
    # 未*化的单词
    unmask_word = None
    