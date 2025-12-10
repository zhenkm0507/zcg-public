"""
用户实体模块，定义用户相关的数据模型
"""
from sqlalchemy import JSON, Column, Integer, String
from framework.database.db_factory import Base

class User(Base):
    __tablename__ = "t_user"
    __table_args__ = {"comment": "用户信息", "schema": "zcg"}

    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键")
    username = Column(String(64), unique=True, nullable=False, comment="用户名")
    nick_name = Column(String(64), nullable=True, comment="昵称")
    passwd = Column(String(16), nullable=False, comment="密码")
    word_flags = Column(JSON, nullable=True, comment="用户在每个词库里设置的自定义标签")
    asura_word_threshold = Column(Integer, nullable=False, default=3, server_default="3", comment="修罗词阈值设置") 
    current_word_bank_id = Column(Integer, nullable=True, comment="当前用户所选词库ID")