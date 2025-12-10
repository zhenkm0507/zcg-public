from sqlalchemy import Column, Integer, String, JSON
from framework.database.db_factory import Base


class Word(Base):
    """单词实体类"""
    __tablename__ = "t_word"
    __table_args__ = {"comment": "单词信息", "schema": "zcg"}

    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键")
    word_bank_id = Column(Integer, nullable=False, comment="词库ID")
    word = Column(String(64), nullable=False, comment="单词")
    phonetic_symbol = Column(String(64), nullable=True, comment="音标")
    inflection = Column(JSON, nullable=True, comment="变形形式（过去式/过去分词/现在分词/比较级/最高级/名词复数）")
    explanation = Column(String(512), nullable=False, comment="中文释义")
    example_sentences = Column(String(2048), nullable=True, comment="例句")
    phrases = Column(JSON, nullable=True, comment="短语搭配")
    expansions = Column(String(512), nullable=True, comment="拓展")
    memory_techniques = Column(String(512), nullable=True, comment="记忆方法")
    discrimination = Column(String(1024), nullable=True, comment="辨析")
    usage = Column(String(2048), nullable=True, comment="用法")
    notes = Column(String(512), nullable=True, comment="注意事项")
    flags = Column(JSON, nullable=True, comment="标签") 
    page = Column(Integer, nullable=True, comment="页码")