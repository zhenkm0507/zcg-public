from sqlalchemy import Column, Integer, String, Numeric, BigInteger
from framework.database.db_factory import Base


class UserWordBankProfile(Base):
    """用户词库档案实体类"""
    __tablename__ = "t_user_word_bank_profile"
    __table_args__ = {"comment": "用户词库档案信息", "schema": "zcg"}

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键")
    user_id = Column(Integer, nullable=False, comment="用户ID")
    word_bank_id = Column(Integer, nullable=False, comment="词库ID")
    experience_value = Column(Numeric, nullable=False, default=0, comment="经验值")
    morale_value = Column(Integer, nullable=False, default=60, comment="士气值")
    user_level = Column(Integer, nullable=False, default=1, comment="用户等级") 