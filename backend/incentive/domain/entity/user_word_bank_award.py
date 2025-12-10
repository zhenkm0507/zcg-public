from sqlalchemy import Column, Integer, Boolean, BigInteger, SmallInteger
from framework.database.db_factory import Base


class UserWordBankAward(Base):
    """用户词库奖励实体类"""
    __tablename__ = "t_user_word_bank_award"
    __table_args__ = {"comment": "用户词库奖励信息", "schema": "zcg"}

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键")
    award_id = Column(BigInteger, nullable=False, comment="奖励ID")
    num = Column(SmallInteger, nullable=False, default=0, comment="数量")
    is_unlocked = Column(Boolean, nullable=False, default=False, comment="是否解锁")
    user_id = Column(BigInteger, nullable=False, comment="用户ID")
    word_bank_id = Column(Integer, nullable=False, comment="词库ID") 

    name = None
    type = None
    description = None
    image_path = None
    video_path = None
    algo_type: int = 0
    algo_value: float = 0.0