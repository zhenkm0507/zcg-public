import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { PieChartSeries } from '@/types/home';
import styles from './index.module.css';

interface PieChartProps {
  data: PieChartSeries;
  title: string;
  size?: 'default' | 'large' | 'small';
  height?: number | string;
}

export const PieChart: React.FC<PieChartProps> = ({ data, title, size = 'default', height }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [containerReady, setContainerReady] = useState(false);

  // 监听父容器尺寸，只有高度>0时才允许初始化ECharts
  useEffect(() => {
    if (!chartRef.current) return;
    const checkSize = () => {
      const rect = chartRef.current?.getBoundingClientRect();
      const h = rect?.height || 0;
      console.log('[PieChart] 容器高度检测:', h, 'px');
      if (h > 10) { // 允许10px以内的误差
        setContainerReady(true);
      } else {
        setContainerReady(false);
      }
    };
    checkSize();
    const ro = new window.ResizeObserver(() => {
      checkSize();
    });
    ro.observe(chartRef.current);
    return () => {
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!containerReady) {
      console.log('[PieChart] 容器高度未就绪，跳过ECharts初始化');
      return;
    }
    if (!chartRef.current || !data) return;

    // 初始化ECharts
    if (!chartInstance.current) {
      console.log('[PieChart] 初始化ECharts实例');
      chartInstance.current = echarts.init(chartRef.current);
    } else {
      console.log('[PieChart] ECharts实例已存在，复用');
    }
    const chart = chartInstance.current;

    // 添加调试日志
    console.log('[PieChart] data:', data);

    const total = data.data.reduce((sum, item) => sum + item.value, 0);
    const percent = total > 0 ? Math.round(((data.data[2]?.value || 0) / total * 100) * 10) / 10 : 0;
    // 处理数据，当所有数据为0时，显示"未背"为100%，其他为0%
    const processedData = total === 0 
      ? data.data.map(item => ({
          name: item.name,
          value: item.name === '未背' ? 1 : 0,
          itemStyle: {
            color: item.name === '未背' ? {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#E8E8E8' },
                { offset: 1, color: '#D0D0D0' }
              ]
            } : item.name === '已背' ? {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#4F8AFF' },
                { offset: 1, color: '#1890ff' }
              ]
            } : item.name === '已斩' ? {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#95de64' },
                { offset: 1, color: '#52c41a' }
              ]
            } : {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#E8E8E8' },
                { offset: 1, color: '#D0D0D0' }
              ]
            },
          },
        }))
      : data.data.map(item => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: item.name === '未背' ? {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#E8E8E8' },
                { offset: 1, color: '#D0D0D0' }
              ]
            } : item.name === '已背' ? {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#4F8AFF' },
                { offset: 1, color: '#1890ff' }
              ]
            } : item.name === '已斩' ? {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#95de64' },
                { offset: 1, color: '#52c41a' }
              ]
            } : {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#E8E8E8' },
                { offset: 1, color: '#D0D0D0' }
              ]
            },
          },
        }));
    const isSmall = size === 'small';
    const isLarge = size === 'large';
    const option = {
      title: {
        text: title,
        left: 'center',
        top: isSmall ? 2 : isLarge ? 28 : 28,
        textStyle: {
          fontSize: isLarge ? 18 : isSmall ? 14 : 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#fff',
        borderColor: '#1890ff',
        borderWidth: 1,
        textStyle: { color: '#333' },
        shadowBlur: 8,
        shadowColor: 'rgba(0,0,0,0.12)',
        formatter: (params: any) => {
          if (total === 0) {
            if (params.name === '未背') {
              return '未背: 0 (100%)';
            } else {
              return `${params.name}: 0 (0%)`;
            }
          }
          return `${params.name}: ${params.value} (${params.percent}%)`;
        },
      },
      legend: {
        orient: isSmall ? 'horizontal' : 'vertical',
        left: isSmall ? 'center' : 'left',
        top: isSmall ? undefined : 'middle',
        icon: 'circle',
        itemWidth: isSmall ? 12 : 16,
        itemHeight: isSmall ? 12 : 16,
        textStyle: {
          fontSize: isSmall ? 12 : 13,
          fontWeight: 'bold',
        },
        ...(isSmall && {
          bottom: 8,
          itemGap: 18,
        }),
      },
      series: [
        {
          name: data.name,
          type: 'pie',
          radius: isLarge ? ['50%', '78%'] : isSmall ? ['38%', '62%'] : ['36%', '60%'],
          center: isSmall ? ['50%', '48%'] : isLarge ? ['50%', '60%'] : ['50%', '60%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: isSmall ? 8 : 12,
            borderColor: '#fff',
            borderWidth: isSmall ? 1 : 2,
            shadowBlur: 16,
            shadowColor: 'rgba(24,144,255,0.10)'
          },
          label: {
            show: true,
            position: 'center',
            formatter: percent > 0 ? `{a|${percent.toFixed( percent % 1 === 0 ? 0 : 1 )}%}` : '',
            rich: {
              a: {
                fontSize: isLarge ? 32 : isSmall ? 22 : 20,
                fontWeight: 'bold',
                color: '#1890ff',
              },
            },
          },
          emphasis: {
            scale: true,
            itemStyle: {
              shadowBlur: 24,
              shadowColor: 'rgba(24,144,255,0.18)'
            },
            label: {
              show: true,
              fontSize: isLarge ? 36 : isSmall ? 18 : 24,
              fontWeight: 'bold',
              color: '#1890ff',
            },
          },
          labelLine: {
            show: false,
          },
          data: processedData,
          animation: true,
          animationEasing: 'cubicOut',
          animationDuration: 1200,
        },
      ],
    };
    setTimeout(() => {
      if (!chartRef.current) return;
      const rect = chartRef.current.getBoundingClientRect();
      console.log('[PieChart] setOption前容器高度:', rect.height, 'px');
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
  }, [data, title, size, containerReady]);

  return (
    <div
      ref={chartRef}
      className={`${styles.chartContainer} ${size === 'large' ? styles.large : size === 'small' ? styles.small : ''}`}
      style={height ? { height } : undefined}
    />
  );
}; 