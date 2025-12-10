'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Row, Col, Spin, message, Card, Statistic } from 'antd';
import { PieChart } from '@/components/Home/PieChart';
import { BarChart } from '@/components/Home/BarChart';
import { getPieChartData, getBarChartData } from '@/services/home';
import { PieChartsDto, BarChartDto } from '@/types/home';
import { getCurrentWordBankId } from '@/utils/storage';
import { isAuthenticated } from '@/utils/auth';
import styles from './page.module.css';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [pieData, setPieData] = useState<PieChartsDto | null>(null);
  const [barData, setBarData] = useState<BarChartDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 新增：动态等高ref
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  // 新增：动态等高逻辑
  useEffect(() => {
    function syncHeight() {
      if (leftRef.current && rightRef.current) {
        const leftHeight = leftRef.current.offsetHeight;
        rightRef.current.style.height = leftHeight + 'px';
      }
    }
    syncHeight();
    window.addEventListener('resize', syncHeight);
    return () => window.removeEventListener('resize', syncHeight);
  }, [barData, pieData]);

  // 检查是否准备好发起请求
  useEffect(() => {
    const checkReady = () => {
      const isAuth = isAuthenticated();
      const wordBankId = getCurrentWordBankId();
      
      if (isAuth && wordBankId !== null) {
        setIsReady(true);
      } else {
        // 如果还没准备好，延迟检查
        setTimeout(checkReady, 500);
      }
    };
    
    checkReady();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 再次检查词库ID，确保请求时有效
        const wordBankId = getCurrentWordBankId();
        if (!wordBankId) {
          setError('词库ID未设置，请先选择词库');
          return;
        }
        
        const [pieResponse, barResponse] = await Promise.all([
          getPieChartData(),
          getBarChartData(),
        ]);
        console.log('Pie Chart Response:', pieResponse);
        console.log('Bar Chart Response:', barResponse);
        setPieData(pieResponse);
        setBarData(barResponse);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        const errorMessage = error instanceof Error ? error.message : '获取数据失败，请稍后重试';
        setError(errorMessage);
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isReady]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large">
          <div className={styles.loadingText}>加载中...</div>
        </Spin>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
      </div>
    );
  }

  if (!pieData || !barData) {
    return (
      <div className={styles.errorContainer}>
        <p>暂无数据</p>
      </div>
    );
  }

  // 获取全部单词的数据（id为-1的图表）
  const totalChart = pieData.charts.find(chart => chart.id === '-1');
  if (!totalChart) {
    console.error('Missing total chart data:', pieData);
    return (
      <div className={styles.errorContainer}>
        <p>数据格式错误：缺少总体进度数据</p>
      </div>
    );
  }

  // 获取其他分类的数据
  const coreChart = pieData.charts.find(chart => chart.id === '1');
  const basicChart = pieData.charts.find(chart => chart.id === '2');
  const highScoreChart = pieData.charts.find(chart => chart.id === '3');
  const extendedChart = pieData.charts.find(chart => chart.id === '4');

  // 获取待斩、斩中、已斩的数量
  const getWordCount = (chart: typeof totalChart, status: string) => {
    return chart?.series.data.find(item => item.name === status)?.value || 0;
  };

  // 添加调试日志
  console.log('Charts Data:', {
    total: totalChart,
    core: coreChart,
    basic: basicChart,
    highScore: highScoreChart,
    extended: extendedChart,
  });

  return (
    <div className={styles.container}>
      <div className={styles.chartsFlexRow}>
        {/* 左侧：进度+大饼图 */}
        <div className={styles.chartsLeft} ref={leftRef}>
          <Card title="整体进度" variant="borderless" style={{ marginBottom: 2 }} bodyStyle={{ padding: '14px 8px' }} headStyle={{ paddingLeft: '8px' }}>
            {/* 计算进度数据 */}
            {(() => {
              const waitCount = getWordCount(totalChart, '未背');
              const slainingCount = getWordCount(totalChart, '已背');
              const slainCount = getWordCount(totalChart, '已斩');
              const total = waitCount + slainingCount + slainCount;
              const reciteProgress = total === 0 ? 0 : Math.round(((slainingCount + slainCount) / total) * 1000) / 10;
              const slainProgress = total === 0 ? 0 : Math.round((slainCount / total) * 1000) / 10;
              return (
                <Row>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', whiteSpace: 'nowrap', paddingRight: '5px' }}>
                      <span style={{ fontSize: '14px', color: '#1890ff' }}>背词进度：</span>
                      <span style={{ fontSize: '13px', color: '#333', marginLeft: 1 }}>
                        {slainingCount + slainCount}/{total} =
                        <span style={{ color: '#1890ff', marginLeft: 1 }}>{reciteProgress}%</span>
                      </span>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', whiteSpace: 'nowrap', paddingLeft: '5px' }}>
                      <span style={{ fontSize: '14px', color: '#52c41a' }}>斩词进度：</span>
                      <span style={{ fontSize: '13px', color: '#333', marginLeft: 1 }}>
                        {slainCount}/{total} =
                        <span style={{ color: '#52c41a', marginLeft: 1 }}>{slainProgress}%</span>
                      </span>
                    </div>
                  </Col>
                </Row>
              );
            })()}
          </Card>
          <div>
            <PieChart data={totalChart.series} title={totalChart.title} size="large" />
          </div>
        </div>
        {/* 右侧：4个小饼图，2行2列grid均分高度 */}
        <div className={styles.chartsRight} ref={rightRef}>
          <div className={styles.chartsRightGrid}>
            {coreChart && coreChart.series ? (
              <PieChart data={coreChart.series} title={coreChart.title} size="small" height="100%" />
            ) : (
              '暂无核心必备单词数据'
            )}
            {basicChart && basicChart.series ? (
              <PieChart data={basicChart.series} title={basicChart.title} size="small" height="100%" />
            ) : (
              '暂无基础必备单词数据'
            )}
            {highScoreChart && highScoreChart.series ? (
              <PieChart data={highScoreChart.series} title={highScoreChart.title} size="small" height="100%" />
            ) : (
              '暂无高分必备单词数据'
            )}
            {extendedChart && extendedChart.series ? (
              <PieChart data={extendedChart.series} title={extendedChart.title} size="small" height="100%" />
            ) : (
              '暂无拓展必备单词数据'
            )}
          </div>
        </div>
      </div>
      {/* 第二行：柱状图区域 */}
      <BarChart data={barData.series} xAxis={barData.xAxis} title={barData.title} />
    </div>
  );
}
