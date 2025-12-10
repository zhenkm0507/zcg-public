from typing import List
import pandas as pd
import io
from urllib.parse import quote
from fastapi.responses import StreamingResponse
from framework.container.container_decorator import injectable
from framework.database.db_decorator import transactional
from framework.util.oo_converter import orm_to_dto_list
from study.domain.service.study_batch_record_service import StudyBatchRecordService
from study.domain.service.user_word_service import UserWordService
from study.dto.study_dto import UserStudyBatchRecordDto, WordItemDto
from word.application.word_app_service import WordAppService

@injectable
class StudyBatchAppService:
    def __init__(self,study_batch_record_service:StudyBatchRecordService,user_word_service:UserWordService,word_app_service:WordAppService):
        self.study_batch_record_service = study_batch_record_service
        self.user_word_service = user_word_service
        self.word_app_service = word_app_service
    
    def create_study_batch_record(self,user_id:int,word_bank_id:int) -> None:
        """
        创建学习批次记录
        """
        self.study_batch_record_service.create_study_batch_record(user_id,word_bank_id)

    def get_study_batch_record_list(self,user_id:int,word_bank_id:int) -> List[UserStudyBatchRecordDto]:
        """
        获取学习批次记录列表
        """
        study_batch_record_list = self.study_batch_record_service.get_study_batch_record_list(user_id,word_bank_id)
        dto_list = orm_to_dto_list(study_batch_record_list, UserStudyBatchRecordDto)
        word_set = set()
        for dto in dto_list:
            for word_item in dto.words:
                word_set.add(word_item.word)
        mask_word_map = self.user_word_service.get_mask_word_map(user_id,word_bank_id,word_set)
        for dto in dto_list:
            for word_item in dto.words:
                word_item.word = mask_word_map[word_item.word]
        return dto_list
    
    def set_words(self,id:int,words:List[WordItemDto]) -> None:
        """
        设置学习批次记录的单词列表
        """
        self.study_batch_record_service.set_words(id,words)
    
    def reset_status(self,id:int) -> None:
        """
        刷新学习批次记录的状态
        """
        self.study_batch_record_service.reset_status(id)

    def download_words_in_batch(self,id:int) -> StreamingResponse:
        """
        下载学习批次记录的单词列表Excel文件
        """
        study_batch_record = self.study_batch_record_service.get_study_batch_record(id)
        if study_batch_record.words:
            words = [word_item.get('word', '') for word_item in study_batch_record.words]
        else:
            words = []
        
        word_list = self.word_app_service.query_word_list_by_word_list(words, study_batch_record.word_bank_id)
        
        # 准备Excel数据
        excel_data = []
        for word in word_list:
            # 构建word列：单词 + 音标
            word_with_phonetic = word.word
            if word.phonetic_symbol:
                word_with_phonetic += f" [{word.phonetic_symbol}]"
            
            # 构建其他列内容
            other_content = []
            
            # 短语搭配
            if word.phrases:
                phrases_text = []
                for phrase in word.phrases:
                    if isinstance(phrase, dict):
                        phrase_text = phrase.get('phrase', '')
                        phrase_exp = phrase.get('exp', '')
                        if phrase_text and phrase_exp:
                            phrases_text.append(f"{phrase_text.strip()}:{phrase_exp.strip()}")
                    else:
                        phrases_text.append(str(phrase))
                if phrases_text:
                    other_content.append(f"【短语搭配】{';'.join(phrases_text)}")
            
            # 变形形式
            if word.inflection:
                inflection_text = []
                if isinstance(word.inflection, dict):
                    for key, value in word.inflection.items():
                        if value:
                            inflection_text.append(f"{key.strip()}:{str(value).strip()}")
                if inflection_text:
                    other_content.append(f"【变形形式】{';'.join(inflection_text)}")
            
            # 例句
            if word.example_sentences:
                other_content.append(f"【例句】{word.example_sentences.strip()}")
            
            # 拓展
            if word.expansions:
                other_content.append(f"【拓展】{word.expansions.strip()}")
            
            # 记忆方法
            if word.memory_techniques:
                other_content.append(f"【记忆方法】{word.memory_techniques.strip()}")
            
            # 辨析
            if word.discrimination:
                other_content.append(f"【辨析】{word.discrimination.strip()}")
            
            # 用法
            if word.usage:
                other_content.append(f"【用法】{word.usage.strip()}")
            
            # 注意事项
            if word.notes:
                other_content.append(f"【注意事项】{word.notes.strip()}")
            
            # 合并中文释义和其他内容
            explanation_parts = []
            if word.explanation:
                explanation_parts.append(f"【中文释义】{word.explanation.strip()}")
            if other_content:
                explanation_parts.extend(other_content)
            
            excel_data.append({
                'word': word_with_phonetic,
                '释义': ' | '.join(explanation_parts) if explanation_parts else ''
            })
        
        # 创建DataFrame
        df = pd.DataFrame(excel_data)
        
        # 创建Excel文件
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='单词列表', index=False)
            
            # 获取工作表对象
            worksheet = writer.sheets['单词列表']
            
            # 设置列宽
            worksheet.column_dimensions['A'].width = 30  # word列
            worksheet.column_dimensions['B'].width = 80  # 解释列
            
            # 设置标题行高度
            worksheet.row_dimensions[1].height = 25
            
            # 设置单元格格式，支持换行和边框
            from openpyxl.styles import Alignment, Border, Side
            
            # 定义边框样式
            thin_border = Border(
                left=Side(style='thin'),
                right=Side(style='thin'),
                top=Side(style='thin'),
                bottom=Side(style='thin')
            )
            
            # 设置标题行格式
            for col in ['A', 'B']:
                cell = worksheet[f'{col}1']
                cell.alignment = Alignment(horizontal='center', vertical='center')
                cell.border = thin_border
            
            # 设置数据行格式
            for row in range(2, len(df) + 2):  # 从第2行开始（跳过标题行）
                
                # A列是word列
                cell_a = worksheet[f'A{row}']
                cell_a.alignment = Alignment(wrap_text=True, vertical='top', horizontal='left')
                cell_a.border = thin_border
                
                # B列是解释列
                cell_b = worksheet[f'B{row}']
                cell_b.alignment = Alignment(wrap_text=True, vertical='top', horizontal='left')
                cell_b.border = thin_border
        
        output.seek(0)
        
        # 返回StreamingResponse
        filename = f"单词列表_{study_batch_record.batch_no}.xlsx"
        encoded_filename = quote(filename.encode('utf-8'))
        
        return StreamingResponse(
            io.BytesIO(output.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
            }
        )
