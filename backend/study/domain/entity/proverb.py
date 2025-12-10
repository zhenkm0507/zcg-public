
from framework.database.db_factory import Base
from sqlalchemy import BigInteger, Boolean, Column, DateTime, String


class Proverb(Base):
    """英文谚语类"""
    __tablename__ = "t_proverb"
    __table_args__ = {"comment": "英文谚语", "schema": "zcg"}

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键")
    proverb = Column(String(512), nullable=False, unique=True, comment="英文谚语")
    chinese_exp = Column(String(512), nullable=False, comment="中文释义")
    created_at = Column(DateTime(timezone=True), nullable=True, server_default="CURRENT_TIMESTAMP")


class UserProverbSeq(Base):
    """用户谚语序列类"""
    __tablename__ = "t_user_proverb_seq"
    __table_args__ = {"comment": "存储每个用户的下一个谚语ID", "schema": "zcg"}

    user_id = Column(BigInteger, primary_key=True, nullable=False, comment="用户ID")
    next_proverb_seq = Column(BigInteger, nullable=False, comment="下一个谚语ID")