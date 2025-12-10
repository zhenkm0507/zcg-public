import request from '@/utils/request';
import { PieChartsDto, BarChartDto } from '@/types/home';
import { BaseResponse } from '@/types/common';

export const getPieChartData = async (): Promise<PieChartsDto> => {
  const response = await request.get<BaseResponse<PieChartsDto>>('/study/stat/pie_chart_data');
  console.log('Pie Chart API Response:', {
    fullResponse: response,
    data: response.data,
    dataData: response.data.data,
    charts: response.data.data.charts,
    firstChart: response.data.data.charts?.[0],
    firstChartKeys: response.data.data.charts?.[0] ? Object.keys(response.data.data.charts[0]) : [],
    firstChartValues: response.data.data.charts?.[0] || {},
  });
  return response.data.data;
};

export const getBarChartData = async (): Promise<BarChartDto> => {
  const response = await request.get<BaseResponse<BarChartDto>>('/study/stat/bar_chart_data');
  console.log('Bar Chart API Response:', {
    fullResponse: response,
    data: response.data,
    dataData: response.data.data,
    series: response.data.data.series,
  });
  return response.data.data;
}; 