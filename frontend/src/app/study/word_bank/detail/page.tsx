'use client';

import { useEffect, useState } from 'react';


import { useSearchParams, useRouter } from 'next/navigation';
import { Descriptions, Tag, Spin, message, Typography, Button } from 'antd';
import { LeftCircleOutlined, SoundOutlined } from '@ant-design/icons';
import { getWordDetail } from '@/services/word';
import type { WordInfoDto } from '@/types/word';
import Breadcrumb from '@/components/Breadcrumb';
import styles from './page.module.css';

const { Paragraph, Title } = Typography;

const WordDetailPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const word = searchParams.get('word');
  const from = searchParams.get('from');
  const [loading, setLoading] = useState(false);
  const [wordInfo, setWordInfo] = useState<WordInfoDto | null>(null);

  const handleBack = () => {
    switch (from) {
      case 'list':
        router.push('/study/word_bank/list');
        break;
      // 可以添加其他来源的处理
      default:
        router.back();
    }
  };

  useEffect(() => {
    const fetchWordDetail = async () => {
      if (!word) {
        message.error('参数缺失');
        return;
      }

      setLoading(true);
      try {
        const response = await getWordDetail(word);
        console.log('获取单词详情响应:', response);
        if (response.data.code === 0) {
          // 确保所有必需字段都有默认值
          const wordData = {
            word: response.data.data.word || '',
            phonetic_symbol: response.data.data.phonetic_symbol || '-',
            inflection: response.data.data.inflection || {},
            explanation: response.data.data.explanation || '-',
            example_sentences: response.data.data.example_sentences || '-',
            phrases: response.data.data.phrases || [],
            expansions: response.data.data.expansions || '',
            memory_techniques: response.data.data.memory_techniques || '',
            discrimination: response.data.data.discrimination || '',
            usage: response.data.data.usage || '',
            notes: response.data.data.notes || '',
            flags: response.data.data.flags || [],
            unmask_word: response.data.data.unmask_word || ''
          };
          setWordInfo(wordData);
        } else {
          message.error(response.data.message || '获取单词详情失败');
        }
      } catch (error) {
        console.error('获取单词详情失败:', error);
        message.error('获取单词详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchWordDetail();
  }, [word]);

  if (!word) {
    return <div className={styles.container}>参数缺失</div>;
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <Spin size="large" />
      </div>
    );
  }

  if (!wordInfo) {
    return <div className={styles.container}>未找到单词信息</div>;
  }

  // 发音功能
  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(word);
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    } else {
      alert('当前浏览器不支持语音合成');
    }
  };

  // 处理例句，按换行符分割
  const exampleSentences = wordInfo.example_sentences.split('\n').filter(sentence => sentence.trim());

  return (
    <div className={styles.container}>
      <Breadcrumb />
      <div className={styles.header}>
        <Button 
          type="text" 
          icon={<LeftCircleOutlined />} 
          onClick={handleBack}
          className={styles.backButton}
        />
      </div>
      
      <div className={styles.content}>
        <Title level={2} className={styles.wordTitle}>{wordInfo.word}</Title>
        
        <Descriptions column={1} className={styles.descriptions}>
          <Descriptions.Item label="音标">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span>{wordInfo.phonetic_symbol}</span>
              <SoundOutlined 
                style={{ fontSize: 20, color: '#bfa76a', marginLeft: 8, cursor: 'pointer' }} 
                onClick={() => speakWord(wordInfo.unmask_word)} 
              />
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="释义">
            {wordInfo.explanation}
          </Descriptions.Item>
          {(() => {
            // 检查是否有任何变形形式
            const hasInflection = Object.values(wordInfo.inflection).some(value => value);
            if (!hasInflection) return null;

            // 获取所有有值的变形形式
            const inflectionItems = [
              { label: '过去式', value: wordInfo.inflection.past_tense },
              { label: '过去分词', value: wordInfo.inflection.past_participle },
              { label: '现在分词', value: wordInfo.inflection.present_participle },
              { label: '比较级', value: wordInfo.inflection.comparative },
              { label: '最高级', value: wordInfo.inflection.superlative },
              { label: '复数', value: wordInfo.inflection.plural }
            ].filter(item => item.value);

            return (
              <Descriptions.Item label="变形形式">
                <div className={styles.inflection}>
                  {inflectionItems.map((item, index) => (
                    <div key={index} className={styles.inflectionItem}>
                      <span className={styles.inflectionLabel}>{item.label}：</span>
                      <span className={styles.inflectionValue}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </Descriptions.Item>
            );
          })()}
          {exampleSentences.length > 0 && (
            <Descriptions.Item label="例句">
              <div className={styles.exampleSentences}>
                {exampleSentences.map((sentence, index) => (
                  <div key={index} className={styles.exampleSentence}>
                    <span className={styles.sentenceNumber}>{index + 1}.</span>
                    <Paragraph className={styles.sentenceText}>{sentence}</Paragraph>
                  </div>
                ))}
              </div>
            </Descriptions.Item>
          )}
          {wordInfo.phrases && wordInfo.phrases.length > 0 && (
            <Descriptions.Item label="短语">
              <div className={styles.phrases}>
                {wordInfo.phrases.map((phrase, index) => (
                  <div key={index} className={styles.phrase}>
                    <div className={styles.phraseHeader}>
                      <span className={styles.phraseNumber}>{index + 1}.</span>
                      <span className={styles.phraseText}>{phrase.phrase}</span>
                      <span className={styles.phraseExp}>{phrase.exp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Descriptions.Item>
          )}
          {wordInfo.expansions && (
            <Descriptions.Item label="拓展">
              {wordInfo.expansions}
            </Descriptions.Item>
          )}
          {wordInfo.memory_techniques && (
            <Descriptions.Item label="记忆方法">
              {wordInfo.memory_techniques}
            </Descriptions.Item>
          )}
          {wordInfo.discrimination && (
            <Descriptions.Item label="辨析">
              {wordInfo.discrimination}
            </Descriptions.Item>
          )}
          {wordInfo.usage && (
            <Descriptions.Item label="用法">
              {wordInfo.usage}
            </Descriptions.Item>
          )}
          {wordInfo.notes && (
            <Descriptions.Item label="注意事项">
              {wordInfo.notes}
            </Descriptions.Item>
          )}
          {wordInfo.flags && wordInfo.flags.length > 0 && (
            <Descriptions.Item label="标签">
              {wordInfo.flags.map((flag, index) => (
                <Tag key={index} className={styles.flagTag}>
                  {flag}
                </Tag>
              ))}
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>
    </div>
  );
};

export default WordDetailPage;