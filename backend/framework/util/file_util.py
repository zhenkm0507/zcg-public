import os
import shutil
from framework.util.logger import setup_logger

logger = setup_logger(__name__)


def is_system_file(filename: str) -> bool:
    """
    判断是否为系统自动生成的文件
    """
    system_files = {
        # macOS 系统文件
        '.DS_Store',
        '.AppleDouble',
        '.LSOverride',
        'Icon\r',
        # Windows 系统文件
        'Thumbs.db',
        'desktop.ini',
        # Linux/Unix 系统文件
        '.Trash',
        '.Trashes',
        # 临时文件
        '~$',
        '.tmp',
        '.temp'
    }
    # 直接检查 filename 是否以 system_files 中的元素为前缀或后缀
    return any(filename.startswith(pattern) or filename.endswith(pattern) for pattern in system_files)

def move_file(source_path:str,target_path:str):
    """
    移动文件
    """
    target_dir = os.path.dirname(target_path)
    # 创建目标目录（如果不存在）
    os.makedirs(target_dir, exist_ok=True)
        
    # 移动文件
    shutil.move(source_path, target_path)
    logger.info(f"文件已从 {source_path} 移动到 {target_path}")