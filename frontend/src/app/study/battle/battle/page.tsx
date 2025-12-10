'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Result, Modal, Spin } from 'antd';
import { LoadingOutlined, TrophyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import styles from './page.module.css';
import globalStyles from '@/app/page.module.css';
import ProgressHeader from './components/StudyHeader';
import AnimationArea, { AnimationAreaHandle } from './components/AnimationArea';
import BusinessArea from './components/BusinessArea';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import { useRouter, useSearchParams } from 'next/navigation';
import { studyApi } from '@/services/study';
import { getWordDetail } from '@/services/word';
import { WordTaskInfo } from '@/types';
import UnmaskedDetailModal from './components/UnmaskedDetailModal';

const BattlePage = () => {
  // 基础状态
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('recite');
  const [taskInfo, setTaskInfo] = useState<WordTaskInfo | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [nextWordPending, setNextWordPending] = useState(false);

  // 学习进度相关
  const [reciteProgress, setReciteProgress] = useState(0);
  const [slainProgress, setSlainProgress] = useState(0);
  const [streak, setStreak] = useState(0);

  // 动画区 ref
  const animationRef = useRef<AnimationAreaHandle>(null);
  // 解锁状态
  const [unlock, setUnlock] = useState({ word: false, inflection: false, phrase: false });
  
  // 音频相关
  const pageAudioRef = useRef<HTMLAudioElement>(null);
  const slainAudioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();

  // 用翻页序号做防抖，确保每次翻页只切换一次内容
  const pendingNextRef = useRef(0);
  const nextTaskInfoRef = useRef<WordTaskInfo | null>(null);
  const flipSeqRef = useRef(0);

  // 添加 nextTaskInfo 状态
  const [nextTaskInfo, setNextTaskInfo] = useState<WordTaskInfo | null>(null);

  // 新增：未*化详情浮窗相关状态
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [countdown, setCountdown] = useState(0);
  const [detailErrorInfo, setDetailErrorInfo] = useState<Record<string, boolean>>({});
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 新增：答题信息提升到父组件，便于 handleNext 使用
  const [answerInfo, setAnswerInfo] = useState<any[]>([]);

  // 在BattlePage组件内添加state
  const [totalWordCount, setTotalWordCount] = useState(0);
  const [slainWordCount, setSlainWordCount] = useState(0);
  const [slainingWordCount, setSlainingWordCount] = useState(0);

  // 记录batch_id和flag参数
  const searchParams = useSearchParams();
  const [batchId, setBatchId] = useState<number | undefined>(undefined);
  const [flag, setFlag] = useState<string | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastApiCallRef = useRef<{ batchId: number | undefined; flag: string | undefined } | null>(null);
  const isApiCallingRef = useRef(false);
  const flagRef = useRef<string | undefined>(undefined);
  const batchIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const id = searchParams.get('batch_id');
    const flagParam = searchParams.get('flag');
    console.log('[BattlePage] URL参数变化 - batch_id:', id, 'flag:', flagParam);
    
    // 更新batchId
    const newBatchId = id ? Number(id) : undefined;
    setBatchId(newBatchId);
    batchIdRef.current = newBatchId;
    
    // 更新flag，确保即使flagParam为null也正确设置
    const newFlag = flagParam || undefined;
    setFlag(newFlag);
    flagRef.current = newFlag;
    
    console.log('[BattlePage] 状态更新后 - batchId:', newBatchId, 'flag:', newFlag);
  }, [searchParams]);

  // 新增：专门处理flag状态变化后的API调用
  useEffect(() => {
    // 如果URL有batch_id参数但还没解析出来，先不请求
    const urlHasBatchId = !!searchParams.get('batch_id');
    if (urlHasBatchId && batchIdRef.current === undefined) return;
    
    // 如果正在调用API，跳过
    if (isApiCallingRef.current) {
      console.log('[useEffect] API正在调用中，跳过');
      return;
    }
    
    // 使用ref中的最新值
    const currentBatchId = batchIdRef.current;
    const currentFlag = flagRef.current;
    
    // 检查是否与上次API调用的参数相同，避免重复调用
    const currentParams = { batchId: currentBatchId, flag: currentFlag };
    if (lastApiCallRef.current && 
        lastApiCallRef.current.batchId === currentParams.batchId && 
        lastApiCallRef.current.flag === currentParams.flag) {
      console.log('[useEffect] 参数未变化，跳过API调用');
      return;
    }
    
    // 设置API调用状态
    isApiCallingRef.current = true;
    lastApiCallRef.current = currentParams;
    
    console.log('[useEffect] 触发API调用 - batchId:', currentBatchId, 'flag:', currentFlag);
    console.log('[useEffect] 当前URL参数 - batch_id:', searchParams.get('batch_id'), 'flag:', searchParams.get('flag'));
    console.log('[useEffect] flag状态类型:', typeof currentFlag, 'flag状态值:', currentFlag);
    
    // 异步调用API
    const callApis = async () => {
      try {
        await fetchWordTaskInfo();
        await fetchProgressInfo();
      } finally {
        isApiCallingRef.current = false;
      }
    };
    
    callApis();
  }, [batchId, flag]);

  // 获取下一个任务信息
  const getNextTask = async (): Promise<WordTaskInfo> => {
    try {
      // 使用ref中的最新值
      const currentBatchId = batchIdRef.current;
      const currentFlag = flagRef.current;
      
      console.log('[getNextTask] 调用API - batchId:', currentBatchId, 'flag:', currentFlag);
      const response = await studyApi.getWordTaskInfo(currentBatchId, currentFlag);
      const nextTask = response.data.data;
      //console.log('[getNextTask] response:', nextTask);
      return nextTask;
    } catch (error) {
      console.error('[getNextTask] error:', error);
      throw error;
    }
  };

  // 新增：处理未全对时的"下一个"逻辑
  const handleNext = async () => {
    //console.log('[handleNext] called, isFlipping:', isFlipping, 'answerInfo:', answerInfo);
    if (isFlipping) return;
    const hasWrongAnswer = answerInfo.some((item: any) => item.user_answer !== '' && !item.is_correct);
    const isAllRequiredFieldsFilled = answerInfo.every((item: any) => item.user_answer !== '');
    const isAllCorrect = answerInfo.length > 0 && answerInfo.every(item => item.is_correct === true);
    // streak 只在点击下一个时更新
    if (isAllCorrect) {
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
    if (hasWrongAnswer || !isAllRequiredFieldsFilled) {
      if (!taskInfo?.word_info) return;
      setShowDetailModal(true);
      //console.log('[handleNext] setShowDetailModal(true)');
      setCountdown(10);
      //console.log('[handleNext] setCountdown(10)');
      setDetailData(null);
      // 计算错误项
      const errorInfo: Record<string, boolean> = {};
      answerInfo.forEach((item: any) => {
        if (item.question_type === 'word' && (item.user_answer === '' || item.is_correct === false)) {
          errorInfo['word'] = true;
        }
        if (item.question_type === 'inflection' && (!item.user_answer || !item.is_correct)) {
          errorInfo[`inflection_${item.question}`] = true;
        }
        if (item.question_type === 'phrase' && (!item.user_answer || !item.is_correct)) {
          errorInfo[`phrase_${item.question}`] = true;
        }
      });
      setDetailErrorInfo(errorInfo);
      getWordDetail(taskInfo.word_info.word, false).then(res => {
        setDetailData(res.data.data);
        //console.log('[handleNext] setDetailData:', res.data.data);
      });
      // 启动倒计时
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current!);
            setShowDetailModal(false);
            //console.log('[倒计时] 结束，setShowDetailModal(false)');
            // 进入下一轮
            setTimeout(async () => {
              // 只触发动画翻页，不切换内容
              if (animationRef.current) animationRef.current.flipPage();
              setIsFlipping(true);
              // 获取下一个单词，记录到 nextTaskInfoRef，等 onTurned 回调时切换内容
              try {
                const next = await getNextTask();
                nextTaskInfoRef.current = next;
                flipSeqRef.current += 1;
                pendingNextRef.current = flipSeqRef.current;
                // 修正：setTaskInfo 后立即 updateContent，保证左侧内容同步
                //console.log('[BattlePage handleNext] 倒计时结束，setTaskInfo前，当前word:', taskInfo?.word_info?.word, '新word:', next.word_info?.word, 'time:', Date.now());
                // 重置 unlock 状态 - 确保在设置新 taskInfo 前重置
                setUnlock({ word: false, inflection: false, phrase: false });
                
                // 新增：重置答题状态
                setAnswerInfo([]);
                setTaskInfo(next);
                //console.log('[BattlePage handleNext] setTaskInfo后，新word:', next.word_info?.word, 'time:', Date.now());
                // 检查是否有新的单词信息
                if (next.word_info && animationRef.current) {
                  animationRef.current.updateContent(next.word_info, { word: false, inflection: false, phrase: false });
                }
              } catch (error) {
                setIsFlipping(false);
              }
            }, 0);
            return 0;
          }
          //console.log('[倒计时] countdown:', prev - 1);
          return prev - 1;
        });
      }, 1000);
      await fetchProgressInfo();
      return;
    }
    //console.log('[handleNext] 开始执行翻页');
    setIsFlipping(true);
    try {
      // 1. 先重置 unlock 状态
      setUnlock({ word: false, inflection: false, phrase: false });
      
      // 新增：重置答题状态
      setAnswerInfo([]);
    
      // 2. 获取下一个单词
    const response = await studyApi.getWordTaskInfo(batchIdRef.current, flagRef.current);
      const next = response.data.data;
      
      // 检查是否还有单词可学习
      if (!next.word_info) {
        //console.log('[BattlePage handleNext] 没有更多单词，设置taskInfo为:', next);
        setTaskInfo(next);
        setIsFlipping(false);
        await fetchProgressInfo();
        return;
      }
      
      // 3. 立即切换左侧内容
      //console.log('[BattlePage handleNext] 正常流程，setTaskInfo前，当前word:', taskInfo?.word_info?.word, '新word:', next.word_info.word, 'time:', Date.now());
      setTaskInfo(next);
      //console.log('[BattlePage handleNext] setTaskInfo后，新word:', next.word_info.word, 'time:', Date.now());
      if (animationRef.current) {
        animationRef.current.updateContent(next.word_info, { word: false, inflection: false, phrase: false });
      }
      
      // 4. 立即触发翻页动画
      //console.log('[handleNext] 触发翻页动画');
      animationRef.current?.flipPage();
      
      // 5. 记录到 ref 供 handleTurned 用
      nextTaskInfoRef.current = next;
    flipSeqRef.current += 1;
    pendingNextRef.current = flipSeqRef.current;
    } catch (error: any) {
      console.error('[handleNext] error:', error);
      setIsFlipping(false);
    }
    await fetchProgressInfo();
  };

  const handleTurned = () => {
    //console.log('[handleTurned] 翻页动画结束');
    if (pendingNextRef.current === flipSeqRef.current) {
      Promise.resolve().then(() => {
        setIsFlipping(false);
        pendingNextRef.current = 0;
        nextTaskInfoRef.current = null;
      });
    }
  };

  // 获取进度信息
  const fetchProgressInfo = useCallback(async () => {
    try {
      const response = await studyApi.getUserWordStatusStats();
      const stats = response.data.data;
      setTotalWordCount(stats.total_word_count);
      setSlainWordCount(stats.slain_word_count);
      setSlainingWordCount(stats.slaining_word_count);
      const recitePercent = (stats.slain_word_count + stats.slaining_word_count) / stats.total_word_count * 100;
      setReciteProgress(Math.round(recitePercent * 10) / 10);
      const slainPercent = stats.slain_word_count / stats.total_word_count * 100;
      setSlainProgress(Math.round(slainPercent * 10) / 10);
    } catch (error) {
      console.error('获取进度信息失败:', error);
    }
  }, []);

  // 获取单词学习任务信息
  const fetchWordTaskInfo = useCallback(async () => {
    setLoading(true);
    try {
      // 使用ref中的最新值
      const currentBatchId = batchIdRef.current;
      const currentFlag = flagRef.current;
      
      console.log('[fetchWordTaskInfo] 调用API - batchId:', currentBatchId, 'flag:', currentFlag);
      console.log('[fetchWordTaskInfo] flag类型:', typeof currentFlag, 'flag值:', currentFlag);
      const response = await studyApi.getWordTaskInfo(currentBatchId, currentFlag);
      const taskData = response.data.data;
      setTaskInfo(taskData);
      if (taskData.is_completed) {
        setStep('completed');
        return;
      }
    } catch (error) {
      console.error('获取单词学习任务信息失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);


  // 解锁回调
  const handleWordUnlock = () => {
    setUnlock(u => {
      const nu = { ...u, word: true };
      if (animationRef.current && taskInfo) {
        animationRef.current.updateContent(taskInfo.word_info, nu);
      }
      return nu;
    });
  };
  
  const handleInflectionUnlock = () => {
    setUnlock(u => {
      const nu = { ...u, inflection: true };
      if (animationRef.current && taskInfo) {
        animationRef.current.updateContent(taskInfo.word_info, nu);
      }
      return nu;
    });
  };
  
  const handlePhraseUnlock = () => {
    //console.log('[BattlePage] handlePhraseUnlock 被调用');
    setUnlock(u => {
      const nu = { ...u, phrase: true };
      //console.log('[BattlePage] 设置 unlock.phrase = true');
      if (animationRef.current && taskInfo) {
        animationRef.current.updateContent(taskInfo.word_info, nu);
      }
      return nu;
    });
  };

  // 斩杀音效
  const handleWordSlain = useCallback(() => {
    if (slainAudioRef.current) {
      slainAudioRef.current.currentTime = 0;
      slainAudioRef.current.play().catch(() => {});
    }
    fetchProgressInfo();
  }, [fetchProgressInfo]);

  // 右侧区域禁用遮罩
  const renderRightMask = showDetailModal ? (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(255,255,255,0.5)', zIndex: 10, pointerEvents: 'all',
      cursor: 'not-allowed'
    }} />
  ) : null;

  useEffect(() => {
    //console.log('[showDetailModal] changed:', showDetailModal);
  }, [showDetailModal]);

  useEffect(() => {
    console.log('[countdown] changed:', countdown);
  }, [countdown]);

  // 新增：独立的完成页面组件
  const StudyCompleteCard: React.FC<{ streak: number; reciteProgress: number; slainProgress: number; reciteNumerator: number; reciteDenominator: number; slainNumerator: number; slainDenominator: number; }> = ({ streak, reciteProgress, slainProgress, reciteNumerator, reciteDenominator, slainNumerator, slainDenominator }) => (
    <div style={{ maxWidth: 1200, margin: '8px auto 0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '0 32px 48px 32px' }}>
      <div className={globalStyles.breadcrumbWrapper}>
        <Breadcrumb />
      </div>
      <div style={{}}>
        <ProgressHeader
          reciteProgress={reciteProgress}
          slainProgress={slainProgress}
          streak={streak}
          reciteNumerator={reciteNumerator}
          reciteDenominator={reciteDenominator}
          slainNumerator={slainNumerator}
          slainDenominator={slainDenominator}
        />
      </div>
      <div style={{ minHeight: 400, paddingTop: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 600, marginBottom: 16 }}>恭喜您！</div>
        <div style={{ fontSize: 18, color: '#888', marginBottom: 0 }}>所有单词都已被斩掉了！</div>
      </div>
    </div>
  );

  const TodayCompleteCard: React.FC<{ streak: number; reciteProgress: number; slainProgress: number; reciteNumerator: number; reciteDenominator: number; slainNumerator: number; slainDenominator: number; }> = ({ streak, reciteProgress, slainProgress, reciteNumerator, reciteDenominator, slainNumerator, slainDenominator }) => (
    <div style={{ maxWidth: 1200, margin: '8px auto 0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '0 32px 48px 32px' }}>
      <div className={globalStyles.breadcrumbWrapper}>
        <Breadcrumb />
      </div>
      <div style={{}}>
        <ProgressHeader
          reciteProgress={reciteProgress}
          slainProgress={slainProgress}
          streak={streak}
          reciteNumerator={reciteNumerator}
          reciteDenominator={reciteDenominator}
          slainNumerator={slainNumerator}
          slainDenominator={slainDenominator}
        />
      </div>
      <div style={{ minHeight: 400, paddingTop: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 600, marginBottom: 16 }}>恭喜您！</div>
        <div style={{ fontSize: 18, color: '#888', marginBottom: 0 }}>今日单词已全部学习完毕！</div>
      </div>
    </div>
  );

  if (loading) {
    //console.log('[BattlePage render] loading=true, 显示loading界面');
    return (
      <Card style={{ margin: '24px', minHeight: 'calc(100vh - 48px)' }}>
        <div className={globalStyles.loadingContainer}>
          <LoadingOutlined spin />
          <div className={globalStyles.loadingText}>加载中...</div>
        </div>
      </Card>
    );
  }
  
  if (step === 'completed' || taskInfo?.is_completed) {
    return (
      <StudyCompleteCard
        streak={streak}
        reciteProgress={reciteProgress}
        slainProgress={slainProgress}
        reciteNumerator={slainWordCount + slainingWordCount}
        reciteDenominator={totalWordCount}
        slainNumerator={slainWordCount}
        slainDenominator={totalWordCount}
      />
    );
  }
  
  if (!loading && taskInfo && !taskInfo.is_completed && !taskInfo.word_info) {
    //console.log('[BattlePage render] 显示今日完成页面, taskInfo:', taskInfo);
    return (
      <TodayCompleteCard
        streak={streak}
        reciteProgress={reciteProgress}
        slainProgress={slainProgress}
        reciteNumerator={slainWordCount + slainingWordCount}
        reciteDenominator={totalWordCount}
        slainNumerator={slainWordCount}
        slainDenominator={totalWordCount}
      />
    );
  }
  
  // console.log('[BattlePage render] 显示正常学习界面, loading:', loading, 'taskInfo:', taskInfo, 'step:', step, 'taskInfo.word_info:', taskInfo?.word_info);
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className={globalStyles.breadcrumbWrapper}>
        <Breadcrumb />
      </div>
      <div className={styles.outer}>
        <ProgressHeader
          reciteProgress={reciteProgress}
          slainProgress={slainProgress}
          streak={streak}
          reciteNumerator={slainWordCount + slainingWordCount}
          reciteDenominator={totalWordCount}
          slainNumerator={slainWordCount}
          slainDenominator={totalWordCount}
        />
        <div className={styles.container}>
          <div className={styles.leftArea}>
            <div className={styles.leftContent}>
              {taskInfo && taskInfo.word_info ? (
                <AnimationArea
                  ref={animationRef}
                  word={taskInfo.word_info}
                  unlock={unlock}
                  className={styles.leftArea}
                  onTurned={handleTurned}
                  onPageFlip={() => {
                    if (pageAudioRef.current) {
                      pageAudioRef.current.currentTime = 0;
                      pageAudioRef.current.play().catch(() => {});
                    }
                  }}
                />
              ) : (
                <div className={styles.leftArea}>加载中...</div>
              )}
              {/* 未*化详情浮窗 */}
              <UnmaskedDetailModal
                visible={showDetailModal}
                detail={detailData}
                errorInfo={detailErrorInfo}
                onClose={() => setShowDetailModal(false)}
              />
            </div>
          </div>
          <div className={styles.rightArea}>
            {taskInfo && taskInfo.word_info && (
              <BusinessArea
                key={taskInfo.task_id}
                taskInfo={taskInfo}
                onNext={handleNext}
                isFlipping={isFlipping}
                onWordUnlock={handleWordUnlock}
                onInflectionUnlock={handleInflectionUnlock}
                onPhraseUnlock={handlePhraseUnlock}
                unlock={unlock}
                onWordSlain={handleWordSlain}
                answerInfo={answerInfo}
                setAnswerInfo={setAnswerInfo}
                countdown={countdown}
              />
            )}
            {/* 右侧禁用遮罩 */}
            {renderRightMask}
          </div>
        </div>
        <audio ref={pageAudioRef} src="/audios/turn_page.mp3" preload="auto" />
        <audio ref={slainAudioRef} src="/audios/slained.mp3" preload="auto" />
      </div>
    </div>
  );
};

export default BattlePage;