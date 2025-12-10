import os
import nltk
from framework.util.logger import setup_logger
from framework.config.config import settings

logger = setup_logger(__name__)

class NLTKConfig:
    """NLTK 配置类"""
    
    @staticmethod
    def init_nltk() -> None:
        """
        初始化 NLTK 配置
        """
        try:
            # 设置数据存储路径
            nltk_data_dir = os.path.expanduser(settings.NLTK_DATA_DIR)
            logger.info("nltk_data_dir:"+nltk_data_dir)
            if not os.path.exists(nltk_data_dir):
                os.makedirs(nltk_data_dir)
            nltk.data.path.append(nltk_data_dir)
            
            # 下载必要的数据包
            required_packages = ['punkt', 'wordnet']
            for package in required_packages:
                try:
                    nltk.data.find(f'tokenizers/{package}' if package == 'punkt' else f'corpora/{package}')
                    logger.info(f"Package {package} already exists")
                except LookupError:
                    logger.info(f"Downloading package: {package}")
                    nltk.download(package)
                    
            logger.info("NLTK initialization completed successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize NLTK: {str(e)}")
            raise 