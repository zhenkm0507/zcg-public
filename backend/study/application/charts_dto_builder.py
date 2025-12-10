from typing import Dict, List, Tuple
from study.domain.entity.user_word import UserWord
from study.dto.bar_charts_dto import BarChartDto, XAxis, BarSeriesItem
from study.dto.pie_charts_dto import Chart, ChartDataItem, ChartSeries, PieChartsDto
from study.enums.study_enums import StudyResultEnum, UserWordStatusEnum, WordCategoryEnum
from collections import defaultdict

class WordStatusCount:
    def __init__(self,word_category:WordCategoryEnum):
        self.word_category = word_category
        self.count_dict = {}
        for user_word_status in UserWordStatusEnum:
            self.count_dict[user_word_status] = 0

class ChartsDtoBuilder:
    @staticmethod
    def build_pie_charts_dto(user_word_list:List[UserWord]) -> PieChartsDto:
        """
        构建饼图DTO
        """
        # 初始化单词状态计数词典
        word_status_count_dict:Dict[WordCategoryEnum,WordStatusCount] = {}
        for word_category in WordCategoryEnum:
            word_status_count_dict[word_category] = WordStatusCount(word_category)


        # 统计单词状态计数
        for user_word in user_word_list:
            word_flags = user_word.flags if user_word.flags else []
            word_category = ChartsDtoBuilder._build_word_category(word_flags)
            word_status_count_dict[word_category].count_dict[UserWordStatusEnum.from_code(user_word.word_status)] += 1
            word_status_count_dict[WordCategoryEnum.ALL].count_dict[UserWordStatusEnum.from_code(user_word.word_status)] += 1

        # 构建饼图DTO
        pie_charts_dto = PieChartsDto()
        pie_charts_dto.charts = []
        for word_category, word_status_count in word_status_count_dict.items():
            chart_data_list:List[ChartDataItem] = []
            for user_word_status, count in word_status_count.count_dict.items():
                chart_data_list.append(ChartDataItem(
                    name=user_word_status.name,
                    value=count
                ))
            chart_series = ChartSeries(
                name=word_category.name,
                data=chart_data_list
            )
            pie_charts_dto.charts.append(Chart(
                id=str(word_category.code),
                title=word_category.name,
                series=chart_series
            ))
        return pie_charts_dto
    
    @staticmethod
    def _build_word_category(word_flags:List[str]) -> WordCategoryEnum:
        """
        构建单词分类
        """
        for word_category in WordCategoryEnum:
            if word_category.name in word_flags:
                return word_category
        return WordCategoryEnum.CORE_WORD
    

    @staticmethod
    def build_bar_chart(data: List[Tuple[str,int,int]]) -> BarChartDto:
        # 使用 defaultdict 初始化，默认值为空字典
        date_dict: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        
        # 遍历数据，直接使用，不需要判断键是否存在
        for date_str,word_status,result_status in data:
            # 背词数
            date_dict[date_str]['memorize_count'] += 1
            # 背错次数
            if result_status == StudyResultEnum.INCORRECT.code:
                date_dict[date_str]['memorize_error_count'] += 1
            # 背对次数    
            elif result_status == StudyResultEnum.CORRECT.code:
                date_dict[date_str]['memorize_right_count'] += 1
            # 斩词数
            if word_status == UserWordStatusEnum.SLAINED.code:
                date_dict[date_str]['slained_count'] += 1
        
        # 按日期排序
        sorted_dates = sorted(date_dict.keys())
        
        # 构建 X 轴数据
        x_axis = XAxis(
            type="category",
            data=sorted_dates
        )
        
        # 构建系列数据
        series = [
            BarSeriesItem(
                name="背词数",
                type="bar",
                data= [date_dict[date]['memorize_count'] for date in sorted_dates]
            ),
            BarSeriesItem(
                name="背错词数",
                type="bar",
                data= [date_dict[date]['memorize_error_count'] for date in sorted_dates]
            ),
            BarSeriesItem(
                name="背对词数",
                type="bar",
                data= [date_dict[date]['memorize_right_count'] for date in sorted_dates]
            ),
            BarSeriesItem(
                name="斩词数",
                type="bar",
                data= [date_dict[date]['slained_count'] for date in sorted_dates]
            )
        ]
        
        return BarChartDto(
            title="每日背词统计",
            xAxis=x_axis,
            series=series
        )