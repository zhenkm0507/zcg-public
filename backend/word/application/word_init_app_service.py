import json
from typing import List, Tuple

import urllib.parse
from framework.container.container_decorator import injectable
from word.domain.service.word_service import WordService
from framework.config.config import settings
from word.dto.word_init_dto import StatisticResponse, WordInitDto
import os
from framework.util.dify_utill import upload_file, run_workflow
from word.domain.entity.word import Word
from framework.util.file_util import is_system_file
from framework.util.logger import setup_logger
from framework.util.file_util import move_file

logger = setup_logger(__name__)

@injectable
class WordInitAppService:
    def __init__(self,word_service:WordService):
        self.word_service = word_service
    def query_statistic(self) -> StatisticResponse:
        """
        查询统计信息
        """
        # 总文件数
        total_files = 0
        # 已完成的文件数
        completed_files = 0
        for root, dirs, files in os.walk(settings.DICTIONARY_PATH):
            # 过滤掉系统文件
            files = [f for f in files if not is_system_file(f)]
            total_files += len(files)
            if "/已完成/" in root:
                completed_files += len(files)
        completion_percentage = f"{completed_files/total_files*100:.1f}%"
        return StatisticResponse(total_files=total_files, completed_files=completed_files, completion_percentage=completion_percentage)
    
    def load_picture(self) -> Tuple[bytes, str]:
        """
        加载一张图片内容
        """
        
        # 获取所有非"已完成"目录下的图片文件
        file_path = ""
        for root, dirs, files in os.walk(settings.DICTIONARY_PATH):
            if "已完成" not in root:
                for file in files:  
                    if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                        file_path = os.path.join(root, file)
                        break
        
        with open(file_path, 'rb') as f:
                image_content = f.read()
        return image_content,file_path
        
        
    def parse_picture(self,file_path:str) -> List[WordInitDto]:
        """
        将文件上传到dify，并返回解析结果
        """
        api_key = settings.DIFY_API_KEY.get("DIFY_API_KEY_FOR_PARSE_PICTURE")
        result = []
        word_type_flag = os.path.basename(os.path.dirname(file_path))
        file_id = upload_file(api_key,file_path)
        if file_id:
            inputs = {
               "dictionay_picture": {
                    "transfer_method": "local_file",
                    "upload_file_id": file_id,
                    "type": "image"
               }
            }
            word_desc = run_workflow(api_key,inputs,"word_desc")
            word_list = json.loads(word_desc)
            for item in word_list:
                # 添加默认标签
                item['flags'] = [word_type_flag,"p"+str(item['page'])]
                # 删除变形形式的空值项
                item['inflection'] = {k: v for k, v in item['inflection'].items() if v not in (None, "")}
                
                # 处理 expansions 字段，确保是字符串格式
                if 'expansions' in item and isinstance(item['expansions'], list):
                    # 如果是列表，转换为字符串
                    expansions_str = ""
                    for expansion in item['expansions']:
                        if isinstance(expansion, dict):
                            # 如果是字典格式，提取 phrase 和 exp
                            phrase = expansion.get('phrase', '')
                            exp = expansion.get('exp', '')
                            if phrase and exp:
                                expansions_str += f"{phrase} {exp} || "
                            elif phrase:
                                expansions_str += f"{phrase} || "
                        else:
                            # 如果是其他格式，直接转为字符串
                            expansions_str += str(expansion) + " || "
                    # 去掉最后的 " || "
                    item['expansions'] = expansions_str.rstrip(" || ")
                elif 'expansions' not in item:
                    item['expansions'] = ""
                
                result.append(WordInitDto.model_validate(item))
        return result
        
    def save_words(self,request:List[WordInitDto],file_path:str) -> str:
        """
        初始化单词并移动文件
        """
        # 保存单词
        words = [Word(**item.model_dump()) for item in request]
        self.word_service.save_words(words)
        
        # 构建目标路径
        target_dir = os.path.join(settings.DICTIONARY_PATH,"已完成",os.path.dirname(file_path).split("/")[-1])
        target_path = os.path.join(target_dir, os.path.basename(file_path))
        
        # 移动文件
        move_file(file_path, target_path)
        
        return target_path
    
    def batch_process(self,size:int=10) -> str:
        """
        批量处理
        """
        # 获取要处理的文件
        image_files = []
        count = 0
        try:
            should_break = False
            for root, dirs, files in os.walk(settings.DICTIONARY_PATH):
                if should_break:
                    break
                if "已完成" not in root:
                    for file in files:  
                       if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                           file_path = os.path.join(root, file)
                           image_files.append(file_path)
                           count += 1
                           if count >= size:
                              should_break = True
                              break
            logger.info(f"词典初始化任务开始，本批待处理文件个数  {len(image_files)}  ===============================================")
            succ_count = 0
            for file in image_files:
                wordInitDtos = self.parse_picture(file)
                self.save_words(wordInitDtos,file)
                logger.info(f"文件  {file}  处理成功  ===============================================")
                succ_count += 1
        except Exception as e:
            logger.error(f"词典初始化任务处理失败: {str(e)} ===============================================")
            raise e
        finally:
           logger.info(f"词典初始化任务结束，本批待处理文件个数{len(image_files)}，成功处理文件个数 {succ_count} ===============================================")
           statistic = self.query_statistic()
           logger.info(f"词典初始化任务处理进度 {statistic.model_dump()} ===============================================")
                        
