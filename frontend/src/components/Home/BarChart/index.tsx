import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { BarChartSeriesItem, BarChartXAxis } from '@/types/home';
import styles from './index.module.css';

interface BarChartProps {
  data: BarChartSeriesItem[];
  xAxis: BarChartXAxis;
  title?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, xAxis, title = '背词数统计' }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    console.log('BarChart xAxis:', xAxis);
    if (!chartRef.current || !data) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const chart = chartInstance.current;

    // 添加调试日志
    console.log('BarChart data:', data);

    const option = {
      title: {
        text: title,
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: '#1890ff',
        borderWidth: 1,
        textStyle: { color: '#333' },
        shadowBlur: 8,
        shadowColor: 'rgba(0,0,0,0.12)',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          const colorMap = {
            '背词数': '#1890ff',
            '背错词数': '#ff4d4f',
            '背对词数': '#faad14',
            '斩词数': '#52c41a'
          };
          let result = `<div style='font-weight:bold;margin-bottom:4px;'>${params[0].axisValue}</div>`;
          params.forEach((param: any) => {
            const color = (colorMap as Record<string, string>)[param.seriesName] || param.color;
            result += `<span style='
              display:inline-block;
              margin-right:8px;
              border-radius:50%;
              width:12px;
              height:12px;
              background:${color};
              box-shadow:0 1px 4px rgba(0,0,0,0.08);'></span>
              <span style='vertical-align:middle;'>${param.seriesName}: <b>${param.value}</b></span><br/>`;
          });
          return result;
        },
      },
      legend: {
        data: data.map(item => item.name),
        top: 50,
        icon: 'circle',
        itemWidth: 16,
        itemHeight: 16,
        textStyle: {
          fontWeight: 'bold',
          fontSize: 14,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '100px',
        containLabel: true,
      },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: [0],
          start: 0,
          end: 50,
          height: 20,
          bottom: 0,
          borderColor: 'transparent',
          backgroundColor: '#f5f5f5',
          fillerColor: 'rgba(24, 144, 255, 0.2)',
          handleStyle: {
            color: '#1890ff',
          },
          moveHandleStyle: {
            color: '#1890ff',
          },
          selectedDataBackground: {
            lineStyle: {
              color: '#1890ff',
            },
            areaStyle: {
              color: '#1890ff',
            },
          },
        },
        {
          type: 'inside',
          xAxisIndex: [0],
          start: 0,
          end: 50,
        },
      ],
      xAxis: {
        type: xAxis.type,
        data: xAxis.data,
        axisLabel: {
          interval: 0,
          rotate: 30,
          fontWeight: 'bold',
          color: '#666',
        },
        axisLine: {
          lineStyle: {
            color: '#e0e0e0',
            width: 2,
          },
        },
      },
      yAxis: {
        type: 'value',
        name: '单词数',
        nameTextStyle: {
          padding: [0, 0, 0, 40],
          fontWeight: 'bold',
          color: '#666',
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed',
          },
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
      },
      series: data.map(item => ({
        name: item.name,
        type: 'bar',
        stack: 'total',
        data: item.data,
        barWidth: 24,
        itemStyle: {
          borderRadius: [0, 0, 0, 0],
          color: item.name === '背词数' ? {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#4F8AFF' },
              { offset: 1, color: '#1890ff' }
            ]
          } : item.name === '背错词数' ? {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#ff7875' },
              { offset: 1, color: '#ff4d4f' }
            ]
          } : item.name === '背对词数' ? {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#ffe58f' },
              { offset: 1, color: '#faad14' }
            ]
          } : {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#b7eb8f' },
              { offset: 1, color: '#52c41a' }
            ]
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 16,
            shadowColor: 'rgba(24,144,255,0.18)'
          },
        },
        animation: true,
        animationEasing: 'cubicOut',
        animationDuration: 1200,
      })),
    };

    setTimeout(() => {
      chart.setOption(option);
    }, 0);

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      chartInstance.current = null;
    };
  }, [data, xAxis, title]);

  return (
    <div ref={chartRef} className={styles.chartContainer} />
  );
}; 