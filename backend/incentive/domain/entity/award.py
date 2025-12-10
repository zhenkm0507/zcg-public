from sqlalchemy import Boolean, Column, Integer, String, BigInteger, SmallInteger
from framework.database.db_factory import Base


class Award(Base):
    """奖励实体类"""
    __tablename__ = "t_award"
    __table_args__ = {"comment": "奖励信息", "schema": "zcg"}

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键")
    type = Column(SmallInteger, nullable=False, comment="奖励类型")
    name = Column(String(20), nullable=False, comment="奖励名称")
    description = Column(String(512), nullable=False, comment="奖励描述")
    image_path = Column(String(256), nullable=False, comment="图片路径")
    video_path = Column(String(256), nullable=True, comment="视频路径")
    algo_type = Column(Integer, nullable=False, default=1, comment="算法类型")
    algo_value = Column(String, nullable=False, comment="算法值") 
    init_is_unlocked = Column(Boolean, nullable=False, default=False, comment="初始化是否解锁")