'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Input, message, Typography } from 'antd';
import { SoundOutlined, CheckCircleFilled, CloseCircleFilled, LoadingOutlined, ThunderboltOutlined, TrophyOutlined } from '@ant-design/icons';
import styles from './index.module.css';
import { WordTaskInfo, AnswerInfo, SubmitAnswerParams, AwardItem } from '@/types';
import { studyApi } from '@/services/study';
import { getWordDetail } from '@/services/word';
import RewardModal from '../RewardModal';
import ResultAnimation from '../ResultAnimation';

interface BusinessAreaProps {
  taskInfo: WordTaskInfo;
  onNext: () => Promise<void>;
  isFlipping: boolean;
  onWordUnlock: () => void;
  onInflectionUnlock: () => void;
  onPhraseUnlock: () => void;
  unlock: { word: boolean; inflection: boolean; phrase: boolean };
  onWordSlain: (isSlain: boolean) => void;
  answerInfo: any[];
  setAnswerInfo: (info: any[]) => void;
  countdown: number;
}

const { Title } = Typography;

const BusinessArea: React.FC<BusinessAreaProps> = ({
  taskInfo,
  onNext,
  isFlipping,
  onWordUnlock,
  onInflectionUnlock,
  onPhraseUnlock,
  unlock,
  onWordSlain,
  answerInfo,
  setAnswerInfo,
  countdown,
}) => {
  // console.log('[BusinessArea] render, taskInfo:', taskInfo, 'isFlipping:', isFlipping);
  
  // 防护检查：如果 taskInfo 或 word_info 为空，不渲染任何内容
  if (!taskInfo || !taskInfo.word_info) {
    //console.log('[BusinessArea] taskInfo 或 word_info 为空，不渲染');
    return null;
  }

  const [wordInput, setWordInput] = useState('');
  const [wordCorrect, setWordCorrect] = useState<null | boolean>(null);
  
  const [shouldUpdateStreak, setShouldUpdateStreak] = useState(false);
  const [shouldUnlockWord, setShouldUnlockWord] = useState(false);
  const [inflectionInputs, setInflectionInputs] = useState<Record<string, string>>({});
  const [inflectionCorrect, setInflectionCorrect] = useState<Record<string, boolean | null>>({});
  
  const [phraseInputs, setPhraseInputs] = useState<Record<string, string>>({});
  const [phraseCorrect, setPhraseCorrect] = useState<Record<string, boolean | undefined>>({});
  const [phraseLoading, setPhraseLoading] = useState<Record<string, boolean>>({});
  const [selectedPhrases, setSelectedPhrases] = useState<any[]>([]);
  const [hasSubmittedAllCorrect, setHasSubmittedAllCorrect] = useState(false);

  // 新增：奖品相关状态
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const pendingAwardsRef = useRef<AwardItem[]>([]);

  // 新增：动画相关状态
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<'slain' | 'correct'>('correct');

  const wordInputRef = useRef<any>(null);
  const inflectionInputRefs = useRef<Record<string, any>>({});
  const phraseInputRefs = useRef<Record<string, any>>({});
  const handledInflectionKeys = useRef<Record<string, boolean>>({});

  // 新增：音效相关ref
  const correctAudioRef = useRef<HTMLAudioElement>(null);

  // 新增：监听taskInfo变化，重置所有状态
  useEffect(() => {
    // 防护检查：如果正在翻页中，不重置状态
    if (isFlipping) {
      //console.log('[BusinessArea] 正在翻页中，跳过状态重置');
      return;
    }
    
    // 当taskInfo变化时，重置所有状态
    //console.log('[BusinessArea] taskInfo变化，开始重置状态，task_id:', taskInfo?.task_id);
    
    // 先清空短语，防止解锁检查使用旧状态
    setSelectedPhrases([]);
    setPhraseCorrect({});
    setPhraseInputs({});
    setPhraseLoading({});
    
    // 然后重置其他状态
    setWordInput('');
    setWordCorrect(null);
    setShouldUpdateStreak(false);
    setShouldUnlockWord(false);
    setInflectionInputs({});
    setInflectionCorrect({});
    setHasSubmittedAllCorrect(false);
    setShowRewardModal(false);
    setAwards([]);
    setShowAnimation(false);
    setAnimationType('correct');
    
    // 重置ref
    handledInflectionKeys.current = {};
    pendingAwardsRef.current = [];
    
    //console.log('[BusinessArea] taskInfo变化，重置所有状态完成');
  }, [taskInfo?.task_id, isFlipping]); // 添加 isFlipping 作为依赖

  useEffect(() => {
    if (wordInputRef.current) {
      wordInputRef.current.focus();
    }
  }, []);

  // 自动跳转到下一个输入框
  const focusNextInput = (currentType: 'word' | 'inflection' | 'phrase', currentKey?: string) => {
    if (currentType === 'inflection' && currentKey) {
      // 如果变形输入正确，跳转到下一个变形输入框或第一个短语输入框
      const inflectionKeys = Object.keys(taskInfo.word_info.inflection).filter(key => taskInfo.word_info.inflection[key]);
      const currentIndex = inflectionKeys.indexOf(currentKey);
      if (currentIndex < inflectionKeys.length - 1) {
        // 跳转到下一个变形输入框
        const nextKey = inflectionKeys[currentIndex + 1];
        if (inflectionInputRefs.current[nextKey]) {
          inflectionInputRefs.current[nextKey].focus();
        }
      } else if (selectedPhrases.length > 0) {
        // 跳转到第一个短语输入框
        const firstPhraseKey = selectedPhrases[0].exp;
        if (phraseInputRefs.current[firstPhraseKey]) {
          phraseInputRefs.current[firstPhraseKey].focus();
        }
      }
    } else if (currentType === 'phrase' && currentKey) {
      // 如果短语输入正确，跳转到下一个短语输入框
      const currentIndex = selectedPhrases.findIndex(p => p.exp === currentKey);
      if (currentIndex < selectedPhrases.length - 1) {
        const nextKey = selectedPhrases[currentIndex + 1].exp;
        if (phraseInputRefs.current[nextKey]) {
          phraseInputRefs.current[nextKey].focus();
        }
      }
    }
  };

  // 处理输入框获得焦点时自动选中内容
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  // 监听变形形式区域的渲染
  useEffect(() => {
    if (wordCorrect) {
      // 等待变形区域渲染完成
      setTimeout(() => {
        // 先检查是否有屈折形式
        const firstInflectionKey = Object.keys(taskInfo.word_info.inflection).find(key => taskInfo.word_info.inflection[key]);
        if (firstInflectionKey && inflectionInputRefs.current[firstInflectionKey]) {
          // 有屈折形式，聚焦到第一个屈折形式输入框
          inflectionInputRefs.current[firstInflectionKey].focus();
        } else if (selectedPhrases.length > 0) {
          // 没有屈折形式但有短语搭配，聚焦到第一个短语输入框
          const firstPhraseKey = selectedPhrases[0].exp;
          if (phraseInputRefs.current[firstPhraseKey]) {
            phraseInputRefs.current[firstPhraseKey].focus();
          }
        }
      }, 100);
    }
  }, [wordCorrect, taskInfo.word_info.inflection, selectedPhrases]);

  // 监听状态变化，触发相应的回调
  useEffect(() => {
    if (shouldUpdateStreak) {
      setShouldUpdateStreak(false);
    }
  }, [shouldUpdateStreak]);

  useEffect(() => {
    if (shouldUnlockWord) {
      onWordUnlock();
      setShouldUnlockWord(false);
    }
  }, [shouldUnlockWord, onWordUnlock]);

  // 使用 useCallback 包装回调函数
  const handleWordCorrect = useCallback((value: string) => {
    if (!taskInfo?.word_info?.word) return;
    
    const isCorrect = normalize(value) === normalize(taskInfo.word_info.word);

    if (isCorrect) {
      setWordCorrect(true);
      setShouldUpdateStreak(true);
      setShouldUnlockWord(true);
      // 使用setTimeout确保状态更新后再跳转
      setTimeout(() => {
        focusNextInput('word');
      }, 0);
    } else {
      setWordCorrect(null);
    }
  }, [taskInfo?.word_info?.word, focusNextInput]);

  // 检查单词输入
  const checkWordInput = useCallback(() => {
    if (!taskInfo?.word_info?.word) return;
    
    const isCorrect = wordInput.trim() === taskInfo.word_info.word.trim();

    setWordCorrect(isCorrect);
    if (isCorrect) {
      setShouldUnlockWord(true);
    }
  }, [wordInput, taskInfo?.word_info?.word]);

  // 检查变形输入
  const checkInflectionInput = (key: string, value: string) => {
    const correctAnswer = taskInfo.word_info.inflection[key];
    const isCorrect = checkInflectionAnswer(value, correctAnswer);
    setInflectionCorrect(prev => {
      const next = { ...prev, [key]: isCorrect };
      const allCorrect = Object.entries(taskInfo.word_info.inflection)
        .filter(([_, v]) => v)
        .every(([k, _]) => next[k] === true);
      if (allCorrect) {
        onInflectionUnlock();
      }
      return next;
    });
  };

  // 检查短语输入（调用后端接口）
  const checkPhraseInput = async (key: string, value: string) => {
    //console.log('[checkPhraseInput] called', key, value, selectedPhrases);
    
    // 新增：防护检查 - 确保不在翻页过程中
    if (isFlipping) {
      //console.log('[checkPhraseInput] 正在翻页中，跳过短语检查');
      return;
    }

    // 新增：防护检查 - 确保当前短语属于当前单词
    const currentPhraseItem = selectedPhrases.find(p => p.exp === key);
    if (!currentPhraseItem) {
      //console.log('[checkPhraseInput] 短语不属于当前单词，跳过检查');
      return;
    }

    // 新增：防护检查 - 确保单词已经正确输入
    if (!wordCorrect) {
      //console.log('[checkPhraseInput] 单词未正确，跳过短语检查');
      return;
    }

    // 新增：防护检查 - 确保变形形式已经全部正确（如果有的话）
    const inflectionEntries = Object.entries(taskInfo.word_info.inflection).filter(([_, v]) => v);
    if (inflectionEntries.length > 0) {
      const allInflectionsCorrect = inflectionEntries.every(([key, _]) => inflectionCorrect[key] === true);
      if (!allInflectionsCorrect) {
        //console.log('[checkPhraseInput] 变形形式未全部正确，跳过短语检查');
        return;
      }
    }
    
    const phraseItem = Array.isArray(taskInfo.word_info.phrases)
      ? taskInfo.word_info.phrases.find((p: any) => p.exp === key)
      : null;
    if (!phraseItem) return;
    try {
      setPhraseLoading(prev => ({ ...prev, [key]: true }));
      const response = await studyApi.judgePhrase({
        question_type: 'phrase',
        question: key,
        correct_answer: phraseItem.phrase,
        user_answer: value,
        is_correct: false
      });
      const result = response.data.data;
      const isCorrect = result.is_correct;
      setPhraseCorrect(prev => {
        const next = { ...prev, [key]: isCorrect };
        const allCorrect = selectedPhrases.every(p => next[p.exp] === true);
        //console.log('[setPhraseCorrect] next:', next, 'selectedPhrases:', selectedPhrases, 'allCorrect:', allCorrect);
        
        // 新增：防护检查 - 确保单词已经正确输入
        if (!wordCorrect) {
          //console.log('[setPhraseCorrect] 单词未正确，不触发解锁');
          return next;
        }
        
        // 新增：防护检查 - 确保变形形式已经全部正确（如果有的话）
        const inflectionEntries = Object.entries(taskInfo.word_info.inflection).filter(([_, v]) => v);
        if (inflectionEntries.length > 0) {
          const allInflectionsCorrect = inflectionEntries.every(([key, _]) => inflectionCorrect[key] === true);
          if (!allInflectionsCorrect) {
            //console.log('[setPhraseCorrect] 变形形式未全部正确，不触发解锁');
            return next;
          }
        }
        
        // 新增：防护检查 - 确保不在翻页过程中
        if (isFlipping) {
          //console.log('[setPhraseCorrect] 正在翻页中，不触发解锁');
          return next;
        }
        
        // 新增：防护检查 - 确保当前短语属于当前单词
        const currentPhraseItem = selectedPhrases.find(p => p.exp === key);
        if (!currentPhraseItem) {
          //console.log('[setPhraseCorrect] 短语不属于当前单词，不触发解锁');
          return next;
        }
        
        if (allCorrect) {
          //console.log('[setPhraseCorrect] allCorrect, 调用onPhraseUnlock');
          onPhraseUnlock();
        }
        return next;
      });
    } catch (error) {
      setPhraseCorrect(prev => ({ ...prev, [key]: false }));
    } finally {
      setPhraseLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // 发音功能
  const speakWord = () => {
    const audio = new Audio(`/audio/${taskInfo.word_info.word}.mp3`);
    audio.play();
  };

  // 提交答题信息
  const submitAnswerInfo = useCallback(async (isAuto = false) => {
    if (!taskInfo) return;
    try {
      //console.log('[submitAnswerInfo] word:', taskInfo.word_info.word, 'answerInfo:', answerInfo, 'time:', Date.now());
      const isAllCorrect = answerInfo.every(item => item.user_answer !== '' && item.is_correct);
      if (!isAuto && isAllCorrect && hasSubmittedAllCorrect) {
        return;
      }
      const submitData: SubmitAnswerParams = {
        task_id: taskInfo.task_id,
        word: taskInfo.word_info.word,
        study_result: isAllCorrect ? 1 : 0,
        answer_info: answerInfo
      };
      const response = await studyApi.submitAnswerInfo(submitData);
      const result = response.data.data;
      
      // 新增：处理奖品信息
      if (result.award_list && result.award_list.length > 0) {
        //console.log('[submitAnswerInfo] 获得奖品:', result.award_list);
        setAwards(result.award_list);
        pendingAwardsRef.current = result.award_list;
        // 不立即显示奖品弹窗，等动画结束后再显示
      }
      
      if (isAllCorrect) {
        setHasSubmittedAllCorrect(true);
      }
      // 只有自动提交时才触发动画和音效
      if (isAuto) {
        if (result.award_list && result.award_list.length > 0) {
          // 有奖品：直接显示奖品弹窗，不显示动画
          setTimeout(() => {
            setShowRewardModal(true);
          }, 200); // 0.2秒后显示，给用户反应时间
        } else {
          // 没有奖品：显示动画
          if (result.is_slain) {
            // 已斩状态：显示"已斩"动画 + 播放slained.mp3
            setAnimationType('slain');
            setShowAnimation(true);
            onWordSlain(true);
          } else {
            // 非已斩状态：显示"正确"动画 + 播放correct.mp3
            setAnimationType('correct');
            setShowAnimation(true);
            if (correctAudioRef.current) {
              correctAudioRef.current.currentTime = 0;
              correctAudioRef.current.play();
            }
          }
        }
      }
    } catch (error) {
      console.error('提交答题信息失败:', error);
    }
  }, [taskInfo, answerInfo, hasSubmittedAllCorrect, onWordSlain]);

  // 新增：处理奖品弹窗关闭
  const handleRewardModalClose = () => {
    setShowRewardModal(false);
    setAwards([]);
    pendingAwardsRef.current = [];
  };

  // 新增：处理动画结束
  const handleAnimationEnd = () => {
    setShowAnimation(false);
  };

  // 处理下一个按钮点击
  const handleNext = async () => {
    if (!taskInfo?.word_info || isFlipping) return;
    // 检查是否有正在进行的短语验证
    const hasPhraseLoading = Object.values(phraseLoading).some(loading => loading === true);
    if (hasPhraseLoading) {
      //console.log('[handleNext] 有短语正在验证中，阻止继续');
      message.warning('短语验证中，请稍等片刻再点击下一个');
      return;
    }
    try {
      //console.log('[handleNext] before submit, word:', taskInfo.word_info.word, 'answerInfo:', answerInfo, 'time:', Date.now());
      await submitAnswerInfo();
      //console.log('[handleNext] after submit, word:', taskInfo.word_info.word, 'answerInfo:', answerInfo, 'time:', Date.now());
        onNext();
    } catch (error) {
      console.error('提交答题信息失败:', error);
      message.error('提交答题信息失败，请重试');
    }
  };

  // 每次切换单词时，随机选择一半短语
  useEffect(() => {
    // 防护检查：如果正在翻页中，不设置短语
    if (isFlipping) {
      //console.log('[BusinessArea] 正在翻页中，跳过短语设置');
      return;
    }
    
    //console.log('[BusinessArea] 设置短语，taskInfo.word_info.word:', taskInfo?.word_info?.word);
    if (taskInfo?.word_info?.phrases && Array.isArray(taskInfo.word_info.phrases)) {
      const phrases = taskInfo.word_info.phrases.filter(item => item && item.exp && item.phrase);
      if (phrases.length > 0) {
        const shuffled = [...phrases].sort(() => Math.random() - 0.5);
        const halfLength = Math.ceil(shuffled.length / 2);
        const selected = shuffled.slice(0, halfLength);
        //console.log('[BusinessArea] 设置 selectedPhrases:', selected.map(s => s.exp));
        setSelectedPhrases(selected);
        // 新增：重置短语相关状态
        const emptyInputs: Record<string, string> = {};
        const emptyCorrect: Record<string, boolean | undefined> = {};
        const emptyLoading: Record<string, boolean> = {};
        selected.forEach(item => {
          emptyInputs[item.exp] = '';
          emptyCorrect[item.exp] = undefined;
          emptyLoading[item.exp] = false;
        });
        setPhraseInputs(emptyInputs);
        setPhraseCorrect(emptyCorrect);
        setPhraseLoading(emptyLoading);
      } else {
        //console.log('[BusinessArea] 没有短语，清空 selectedPhrases');
        setSelectedPhrases([]);
        setPhraseInputs({});
        setPhraseCorrect({});
        setPhraseLoading({});
      }
    }
  }, [taskInfo, isFlipping]); // 添加 isFlipping 作为依赖

  // 生成 answerInfo 的工具函数
  const generateAnswerInfo = (taskInfo: WordTaskInfo, selectedPhrases: any[]): AnswerInfo[] => {
    const arr: AnswerInfo[] = [];
    // 单词
    arr.push({
      question_type: 'word',
      question: 'word',
      correct_answer: taskInfo.word_info.word,
      user_answer: wordInput,
      is_correct: wordCorrect === true
    });
    // 变形形式
    const inflections = taskInfo.word_info.inflection;
    for (const key in inflections) {
      if (inflections[key]) {
        arr.push({
          question_type: 'inflection',
          question: key,
          correct_answer: inflections[key],
          user_answer: inflectionInputs[key] || '',
          is_correct: inflectionCorrect[key] === true
        });
      }
    }
    // 短语
    if (Array.isArray(selectedPhrases)) {
      selectedPhrases.forEach((item) => {
        arr.push({
          question_type: 'phrase',
          question: item.exp,
          correct_answer: item.phrase,
          user_answer: phraseInputs[item.exp] || '',
          is_correct: phraseCorrect[item.exp] === true
        });
      });
    }
    return arr;
  };

  // 自动生成 answerInfo：taskInfo 或 selectedPhrases 变化时
  useEffect(() => {
    if (!taskInfo?.word_info) return;
    setAnswerInfo(generateAnswerInfo(taskInfo, selectedPhrases));
  }, [taskInfo, selectedPhrases]);

  // 用户输入单词时，实时更新 answerInfo
  useEffect(() => {
    if (!taskInfo?.word_info) return;
    setAnswerInfo(generateAnswerInfo(taskInfo, selectedPhrases));
  }, [wordInput, wordCorrect]);

  // 用户输入变形形式时，实时更新 answerInfo
  useEffect(() => {
    if (!taskInfo?.word_info) return;
    setAnswerInfo(generateAnswerInfo(taskInfo, selectedPhrases));
  }, [inflectionInputs, inflectionCorrect]);

  // 用户输入短语时，实时更新 answerInfo
  useEffect(() => {
    if (!taskInfo?.word_info) return;
    setAnswerInfo(generateAnswerInfo(taskInfo, selectedPhrases));
  }, [phraseInputs, phraseCorrect]);

  // 全对时自动提交
  useEffect(() => {
    if (!taskInfo?.word_info) return;
    if (answerInfo.length === 0) return;
    if (isFlipping) return; // 防止翻页时自动提交
    const isAllAnswered = answerInfo.every(item => item.user_answer !== '');
    const isAllCorrect = answerInfo.every(item => item.is_correct === true);
    if (isAllAnswered && isAllCorrect && !hasSubmittedAllCorrect) {
      // 只有这里自动提交时，才触发斩杀音效
      submitAnswerInfo(true);
    }
  }, [answerInfo, taskInfo, hasSubmittedAllCorrect, isFlipping]);

  // 定时自动提交（非全对时）
  useEffect(() => {
    if (!taskInfo?.word_info) return;
    if (answerInfo.length === 0) return;
    if (isFlipping) return; // 防止翻页时自动提交
    const timer = setInterval(() => {
      const isAllAnswered = answerInfo.every(item => item.user_answer !== '');
      const isAllCorrect = answerInfo.every(item => item.is_correct === true);
      const hasAnyInput = answerInfo.some(item => item.user_answer && item.user_answer !== '');
      if (!isAllCorrect && hasAnyInput) {
        submitAnswerInfo();
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [taskInfo, answerInfo, isFlipping]);

  // 在组件主体内添加如下 useEffect
  useEffect(() => {
    // 防护检查：如果正在翻页中，不处理变形形式解锁
    if (isFlipping) {
      //console.log('[BusinessArea] 正在翻页中，跳过变形形式解锁检查');
      return;
    }
    
    if (!taskInfo?.word_info?.inflection) return;
    const inflectionEntries = Object.entries(taskInfo.word_info.inflection).filter(([_, v]) => v);
    if (inflectionEntries.length === 0) return;

    let hasAllCorrect = true;
    for (const [key, _] of inflectionEntries) {
      if (inflectionCorrect[key] === true && !handledInflectionKeys.current[key]) {
        focusNextInput('inflection', key);
        handledInflectionKeys.current[key] = true;
      }
      if (inflectionCorrect[key] !== true) {
        hasAllCorrect = false;
      }
    }
    if (hasAllCorrect && !handledInflectionKeys.current['__all__']) {
      onInflectionUnlock();
      handledInflectionKeys.current['__all__'] = true;
    }
  }, [inflectionCorrect, taskInfo, onInflectionUnlock, focusNextInput, isFlipping]); // 添加 isFlipping 作为依赖

  useEffect(() => {
    handledInflectionKeys.current = {};
  }, [taskInfo]);

  // 在组件顶部添加工具函数：
  const normalize = (str: string) => (str ?? '').replace(/\s+/g, '');

  // 新增：变形形式判断工具函数
  const checkInflectionAnswer = (userInput: string, correctAnswer: string): boolean => {
    const trimmedInput = userInput.trim();
    const trimmedAnswer = correctAnswer.trim();
    
    if (!trimmedInput || !trimmedAnswer) {
      return false;
    }

    // 情况1：答案包含分隔符，表示多个正确答案
    // 支持逗号、"/"、"或"三种分割方式
    if (trimmedAnswer.includes(',') || trimmedAnswer.includes('/') || trimmedAnswer.includes('或')) {
      // 使用正则表达式分割，支持多种分隔符
      const answers = trimmedAnswer.split(/[,/或]/).map(ans => ans.trim()).filter(ans => ans.length > 0);
      return answers.some(answer => trimmedInput === answer);
    }

    // 情况2：答案包含括号，表示括号内内容可选
    if (trimmedAnswer.includes('(') && trimmedAnswer.includes(')')) {
      // 使用正则表达式处理括号内的可选内容
      const regex = /\(([^)]+)\)/g;
      let match: RegExpExecArray | null;
      let possibleAnswers = [trimmedAnswer];
      
      // 生成所有可能的答案组合
      while ((match = regex.exec(trimmedAnswer)) !== null) {
        const optionalContent = match[1];
        const newAnswers: string[] = [];
        
        possibleAnswers.forEach(answer => {
          // 包含可选内容的版本
          newAnswers.push(answer.replace(match![0], optionalContent));
          // 不包含可选内容的版本
          newAnswers.push(answer.replace(match![0], ''));
        });
        
        possibleAnswers = newAnswers;
      }
      
      // 去重并检查用户输入是否匹配任一答案
      const uniqueAnswers = [...new Set(possibleAnswers)];
      return uniqueAnswers.some(answer => trimmedInput === answer);
    }

    // 情况3：普通精确匹配
    return trimmedInput === trimmedAnswer;
  };

  //console.log('[BusinessArea] selectedPhrases:', selectedPhrases);

  useEffect(() => {
    //console.log('[BusinessArea] 短语解锁检查触发，selectedPhrases:', selectedPhrases?.length, 'wordCorrect:', wordCorrect, 'phraseCorrect:', phraseCorrect);
    
    // 新增：防护检查 - 确保不在翻页过程中
    if (isFlipping) {
      //console.log('[BusinessArea] 短语解锁检查：正在翻页中，跳过检查');
      return;
    }
    
    if (!selectedPhrases || selectedPhrases.length === 0) {
      //console.log('[BusinessArea] 短语解锁检查：没有短语，直接返回');
      return;
    }
    
    // 新增：防护检查 - 确保单词已经正确输入
    if (!wordCorrect) {
      //console.log('[BusinessArea] 短语解锁检查：单词未正确，直接返回');
      return;
    }
    
    // 新增：防护检查 - 确保变形形式已经全部正确（如果有的话）
    const inflectionEntries = Object.entries(taskInfo.word_info.inflection).filter(([_, v]) => v);
    if (inflectionEntries.length > 0) {
      const allInflectionsCorrect = inflectionEntries.every(([key, _]) => inflectionCorrect[key] === true);
      if (!allInflectionsCorrect) {
        //console.log('[BusinessArea] 短语解锁检查：变形形式未全部正确，直接返回');
        return;
      }
    }
    
    // 新增：防护检查 - 确保所有短语都属于当前单词
    const currentWordPhrases = taskInfo.word_info.phrases?.filter(item => item && item.exp && item.phrase) || [];
    const currentWordPhraseExps = currentWordPhrases.map(p => p.exp);
    const allPhrasesBelongToCurrentWord = selectedPhrases.every(phrase => 
      currentWordPhraseExps.includes(phrase.exp)
    );
    if (!allPhrasesBelongToCurrentWord) {
      //console.log('[BusinessArea] 短语解锁检查：短语不属于当前单词，直接返回');
      return;
    }
    
    let hasAllCorrect = true;
    for (const item of selectedPhrases) {
      if (phraseCorrect[item.exp] !== true) {
        hasAllCorrect = false;
        //console.log('[BusinessArea] 短语解锁检查：短语', item.exp, '不正确，phraseCorrect[item.exp]:', phraseCorrect[item.exp]);
        break;
      }
    }
    if (hasAllCorrect) {
      //console.log('[BusinessArea] 短语全部正确，触发解锁');
      onPhraseUnlock();
    }
  }, [phraseCorrect, selectedPhrases, onPhraseUnlock, wordCorrect, inflectionCorrect, taskInfo.word_info.inflection, isFlipping]);

  return (
    <div className={styles.rightArea}>
      {/* 单词输入区分组 */}
      <div className={styles.inputGroup} style={{background:'#faf8f2',borderRadius:8,padding:'24px 20px 16px 20px',marginBottom:24,boxShadow:'0 2px 8px rgba(191,167,106,0.06)'}}>
        <div className={styles.wordInputArea} style={{marginBottom:20,borderBottom:'1.5px dashed #e0d7c3',paddingBottom:16}}>
          <Input
            ref={wordInputRef}
            value={wordInput}
            onChange={e => {
              const value = e.target.value;
              setWordInput(value);
              handleWordCorrect(value);
            }}
            onFocus={handleFocus}
            placeholder="请输入单词"
            className={
              styles.wordInput +
              (wordCorrect === true
                ? ' ' + styles.inputReadOnly + ' ' + styles.inputCorrect
                : wordCorrect === false
                ? ' ' + styles.inputError
                : '')
            }
            onBlur={() => {
              if (wordInput.trim() !== '') {
                checkWordInput();
              } else {
                setWordCorrect(null);
              }
            }}
            onPressEnter={checkWordInput}
            status={wordCorrect === false ? 'error' : undefined}
            readOnly={wordCorrect === true}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
          />
          {wordCorrect === true && (
            <CheckCircleFilled className={styles.correctMark} style={{color:'#52c41a',fontSize:24,marginLeft:8}} />
          )}
          {wordCorrect === false && (
            <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 24, fontWeight: 'bold',marginLeft:8 }} />
          )}
      </div>
        {/* 变形输入区，仅在单词输入正确且有内容时显示 */}
        {wordCorrect && (() => {
          const inflectionEntries = Object.entries(taskInfo.word_info.inflection).filter(([_, v]) => v);
          if (inflectionEntries.length === 0) return null;
          const inflectionNames: Record<string, string> = {
            past_tense: '过去式',
            past_participle: '过去分词',
            present_participle: '现在分词',
            comparative: '比较级',
            superlative: '最高级',
            plural: '名词复数',
            third_person: '第三人称单数',
          };
          return (
            <div className={styles.inflectionArea} style={{marginBottom:20,borderBottom:'1.5px dashed #e0d7c3',paddingBottom:16}}>
              <Title level={4} className={styles.sectionTitle}>变形形式</Title>
              <table style={{ width: '100%' }}>
                <tbody>
                  {inflectionEntries.map(([key, value]) => (
                    <tr key={key}>
                      <td className={styles.inflectionLabel} >{inflectionNames[key] || key}：</td>
                      <td>
                        <Input
                          ref={el => inflectionInputRefs.current[key] = el}
                          value={inflectionInputs[key] || ''}
                          onChange={e => {
                            const value = e.target.value;
                            setInflectionInputs(prev => ({
                            ...prev,
                              [key]: value
                            }));
                            const correctAnswer = taskInfo.word_info.inflection[key];
                            const isCorrect = checkInflectionAnswer(value, correctAnswer);
                            if (isCorrect) {
                              setInflectionCorrect(prev => ({ ...prev, [key]: true }));
                            } else {
                              setInflectionCorrect(prev => ({ ...prev, [key]: null }));
                            }
                          }}
                          onFocus={handleFocus}
                          placeholder={`请输入${inflectionNames[key] || key}`}
                          className={styles.inflectionInput + (inflectionCorrect && inflectionCorrect[key] === true ? ' ' + styles.inputReadOnly + ' ' + styles.inputCorrect : inflectionCorrect && inflectionCorrect[key] === false ? ' ' + styles.inputError : '')}
                          onBlur={() => {
                            const inputValue = (inflectionInputs[key] || '').trim();
                            if (inputValue !== '') {
                              checkInflectionInput(key, inputValue);
                            } else {
                              setInflectionCorrect(prev => ({ ...prev, [key]: null }));
                            }
                          }}
                          onPressEnter={() => checkInflectionInput(key, inflectionInputs[key] || '')}
                          status={inflectionCorrect && inflectionCorrect[key] === false ? 'error' : undefined}
                          readOnly={inflectionCorrect && inflectionCorrect[key] === true}
                          disabled={inflectionCorrect && inflectionCorrect[key] === true}
                          autoCapitalize="off"
                          autoCorrect="off"
                          autoComplete="off"
                          spellCheck="false"
                        />
                        {inflectionCorrect && inflectionCorrect[key] === true && (
                          <CheckCircleFilled className={styles.correctMark} style={{color:'#52c41a',fontSize:22,marginLeft:8}} />
                        )}
                        {inflectionCorrect && inflectionCorrect[key] === false && (
                          <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 22, fontWeight: 'bold',marginLeft:8 }} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
      </div>
          );
        })()}
        {/* 短语输入区，仅在单词输入正确且有内容时显示 */}
        {wordCorrect && Array.isArray(selectedPhrases) && selectedPhrases.length > 0 && (
          <div className={styles.phraseArea} style={{marginBottom:0}}>
            <Title level={4} className={styles.sectionTitle}>短语搭配</Title>
            <table style={{ width: '100%' }}>
              <tbody>
                {selectedPhrases.map((item: any, idx: number) => (
                  <tr key={item.exp || idx}>
                    <td className={styles.phraseLabel}>{item.exp}：</td>
                    <td>
                      <Input
                        ref={el => phraseInputRefs.current[item.exp] = el}
                        value={phraseInputs[item.exp] || ''}
                        onChange={e => {
                          const value = e.target.value;
                          setPhraseInputs(prev => ({
                            ...prev,
                            [item.exp]: value
                          }));
                          if (normalize(value) === normalize((item.phrase || ''))) {
                            // 新增：防护检查 - 确保不在翻页过程中
                            if (isFlipping) {
                              //console.log('[phrase onChange] 正在翻页中，不设置短语正确状态');
                              return;
                            }
                            
                            // 新增：防护检查 - 确保单词已经正确输入
                            if (!wordCorrect) {
                              //console.log('[phrase onChange] 单词未正确，不设置短语正确状态');
                              return;
                            }
                            
                            // 新增：防护检查 - 确保变形形式已经全部正确（如果有的话）
                            const inflectionEntries = Object.entries(taskInfo.word_info.inflection).filter(([_, v]) => v);
                            if (inflectionEntries.length > 0) {
                              const allInflectionsCorrect = inflectionEntries.every(([key, _]) => inflectionCorrect[key] === true);
                              if (!allInflectionsCorrect) {
                                //console.log('[phrase onChange] 变形形式未全部正确，不设置短语正确状态');
                                return;
                              }
                            }
                            
                            // 新增：防护检查 - 确保当前短语属于当前单词
                            const currentWordPhrases = taskInfo.word_info.phrases?.filter(p => p && p.exp && p.phrase) || [];
                            const currentWordPhraseExps = currentWordPhrases.map(p => p.exp);
                            if (!currentWordPhraseExps.includes(item.exp)) {
                              //console.log('[phrase onChange] 短语不属于当前单词，不设置短语正确状态');
                              return;
                            }
                            
                            setPhraseCorrect(prev => ({ ...prev, [item.exp]: true }));
                            focusNextInput('phrase', item.exp);
                          } else {
                            setPhraseCorrect(prev => ({ ...prev, [item.exp]: null }));
                          }
                        }}
                        onFocus={handleFocus}
                        placeholder={`请输入短语`}
                        className={
                          styles.phraseInput +
                          (phraseCorrect && phraseCorrect[item.exp] === true
                            ? ' ' + styles.inputReadOnly + ' ' + styles.inputCorrect
                            : phraseCorrect && phraseCorrect[item.exp] === false
                            ? ' ' + styles.inputError
                            : '')
                        }
                        onBlur={e => {
                          const inputValue = ((e.target as HTMLInputElement).value || '').trim();
                          if (inputValue !== '' && normalize(inputValue) !== normalize((item.phrase || ''))) {
                            checkPhraseInput(item.exp, inputValue);
                          } else if (normalize(inputValue) === normalize((item.phrase || ''))) {
                            // 新增：防护检查 - 确保不在翻页过程中
                            if (isFlipping) {
                              //console.log('[phrase onBlur] 正在翻页中，不设置短语正确状态');
                              return;
                            }
                            
                            // 新增：防护检查 - 确保单词已经正确输入
                            if (!wordCorrect) {
                              //console.log('[phrase onBlur] 单词未正确，不设置短语正确状态');
                              return;
                            }
                            
                            // 新增：防护检查 - 确保变形形式已经全部正确（如果有的话）
                            const inflectionEntries = Object.entries(taskInfo.word_info.inflection).filter(([_, v]) => v);
                            if (inflectionEntries.length > 0) {
                              const allInflectionsCorrect = inflectionEntries.every(([key, _]) => inflectionCorrect[key] === true);
                              if (!allInflectionsCorrect) {
                                //console.log('[phrase onBlur] 变形形式未全部正确，不设置短语正确状态');
                                return;
                              }
                            }
                            
                            setPhraseCorrect(prev => ({ ...prev, [item.exp]: true }));
                          } else {
                            setPhraseCorrect(prev => ({ ...prev, [item.exp]: null }));
                          }
                        }}
                        onPressEnter={e => {
                          const inputValue = ((e.target as HTMLInputElement).value || '').trim();
                          if (inputValue !== '' && normalize(inputValue) !== normalize((item.phrase || ''))) {
                            checkPhraseInput(item.exp, inputValue);
                          } else if (normalize(inputValue) === normalize((item.phrase || ''))) {
                            // 新增：防护检查 - 确保不在翻页过程中
                            if (isFlipping) {
                              //console.log('[phrase onPressEnter] 正在翻页中，不设置短语正确状态');
                              return;
                            }
                            
                            // 新增：防护检查 - 确保单词已经正确输入
                            if (!wordCorrect) {
                              //console.log('[phrase onPressEnter] 单词未正确，不设置短语正确状态');
                              return;
                            }
                            
                            // 新增：防护检查 - 确保变形形式已经全部正确（如果有的话）
                            const inflectionEntries = Object.entries(taskInfo.word_info.inflection).filter(([_, v]) => v);
                            if (inflectionEntries.length > 0) {
                              const allInflectionsCorrect = inflectionEntries.every(([key, _]) => inflectionCorrect[key] === true);
                              if (!allInflectionsCorrect) {
                                //console.log('[phrase onPressEnter] 变形形式未全部正确，不设置短语正确状态');
                                return;
                              }
                            }
                            
                            setPhraseCorrect(prev => ({ ...prev, [item.exp]: true }));
                          } else {
                            setPhraseCorrect(prev => ({ ...prev, [item.exp]: null }));
                          }
                        }}
                        status={phraseCorrect && phraseCorrect[item.exp] === false ? 'error' : undefined}
                        readOnly={phraseCorrect && phraseCorrect[item.exp] === true}
                        disabled={phraseCorrect && phraseCorrect[item.exp] === true || phraseLoading[item.exp]}
                        autoCapitalize="off"
                        autoCorrect="off"
                        autoComplete="off"
                        spellCheck="false"
                      />
                      {phraseLoading[item.exp] && <LoadingOutlined className={styles.loadingIcon} />}
                      {phraseCorrect && phraseCorrect[item.exp] === true && !phraseLoading[item.exp] && (
                        <CheckCircleFilled className={styles.correctMark} style={{color:'#52c41a',fontSize:22,marginLeft:8}} />
                      )}
                      {phraseCorrect && phraseCorrect[item.exp] === false && !phraseLoading[item.exp] && (
                        <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 22, fontWeight: 'bold',marginLeft:8 }} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* 下一个按钮分组 */}
      <div className={styles.nextButtonWrapper}>
        <Button
          type="primary"
          onClick={handleNext}
          disabled={isFlipping || countdown > 0}
          className={styles.nextButton}
          icon={<ThunderboltOutlined />}
          style={{minWidth:160,fontSize:22,borderRadius:8,background:'#f8f5ec',color:'#4b3a1e',border:'1.5px solid #bfa76a',fontWeight:'bold',boxShadow:'none'}}
          onTouchStart={(e) => {
            // 防止 iPad 上的触摸事件问题
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            // 确保触摸结束时触发点击
            e.preventDefault();
            e.stopPropagation();
            if (!isFlipping && countdown === 0) {
              handleNext();
            }
          }}
        >
          {countdown > 0 ? `${countdown}秒后下一个` : '下一个'}
        </Button>
      </div>
      
      {/* 奖品弹窗 */}
      <RewardModal
        visible={showRewardModal}
        awards={awards}
        onClose={handleRewardModalClose}
      />

      {/* 结果动画 */}
      <ResultAnimation
        visible={showAnimation}
        type={animationType}
        onAnimationEnd={handleAnimationEnd}
      />

      {/* 音效元素 */}
      <audio ref={correctAudioRef} src="/audios/correct.mp3" preload="auto" />
    </div>
  );
};

export default BusinessArea;