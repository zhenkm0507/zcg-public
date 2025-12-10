// 饼图数据结构
export interface PieChartSeriesItem {
  name: string;
  value: number;
}

export interface PieChartSeries {
  name: string;
  data: PieChartSeriesItem[];
}

export interface PieChartItem {
  id: string;
  title: string;
  series: PieChartSeries;
}

export interface PieChartsDto {
  charts: PieChartItem[];
}

// 柱状图数据结构
export interface BarChartXAxis {
  type: string;
  data: string[];
}

export interface BarChartSeriesItem {
  name: string;
  type: string;
  data: number[];
}

export interface BarChartDto {
  title: string;
  xAxis: BarChartXAxis;
  series: BarChartSeriesItem[];
}

export interface DailyProgress {
  date: string;
  studyCount: number;  // 每天的背词数
  completeCount: number;  // 每天的斩词数
} 