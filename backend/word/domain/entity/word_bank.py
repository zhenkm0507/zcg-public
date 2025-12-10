from sqlalchemy import Column, Integer, String, JSON
from framework.database.db_factory import Base


class WordBank(Base):
    """词库实体类"""
    __tablename__ = "t_word_bank"
    __table_args__ = {"comment": "词库信息", "schema": "zcg"}

    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键")
    name = Column(String(64), nullable=False, comment="词库名称")
    word_flag_list = Column(JSON, nullable=True, comment="词库的标签列表")