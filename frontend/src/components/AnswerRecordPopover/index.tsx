import React from 'react';
import { Tooltip } from 'antd';
import { AnswerInfo } from '@/types/study';

interface AnswerRecordPopoverProps {
  recordDate: string;
  studyResult: number | string;
  answerInfo: AnswerInfo[];
  style?: React.CSSProperties;
  displayMode?: 'result' | 'date';
}

const AnswerRecordPopover: React.FC<AnswerRecordPopoverProps> = ({
  recordDate,
  studyResult,
  answerInfo,
  style,
  displayMode = 'result'
}) => {
  const getResultColor = (result: number | string) => {
    if (typeof result === 'number') {
      return result === 1 ? '#52c41a' : '#ff4d4f';
    }
    return result === '正确' ? '#52c41a' : '#ff4d4f';
  };

  const formatAnswerInfo = () => {
    return (
      <div style={{ maxWidth: 400 }}>
        <div style={{ marginLeft: 16 }}>
          {answerInfo.map((answer, idx) => (
            <div key={idx} style={{ marginBottom: 4 }}>
              <div>
                {answer.question_type === 'word' ? '单词' : 
                 answer.question_type === 'inflection' ? '变形' : 
                 answer.question_type === 'phrase' ? '短语' : answer.question_type}
              </div>
              <div style={{ marginLeft: 16 }}>
                {answer.question_type !== 'word' && (
                  <div>问题：{
                    answer.question_type === 'inflection' ? 
                      (answer.question === 'past_tense' ? '过去式' :
                       answer.question === 'past_participle' ? '过去分词' :
                       answer.question === 'present_participle' ? '现在分词' :
                       answer.question === 'comparative' ? '比较级' :
                       answer.question === 'superlative' ? '最高级' :
                       answer.question === 'plural' ? '复数形式' : answer.question)
                    : answer.question
                  }</div>
                )}
                <div>
                  答案：<span style={{ color: '#52c41a' }}>{answer.correct_answer}</span>
                  <span style={{ margin: '0 8px', color: '#d9d9d9' }}>|</span>
                  你的答案：<span style={{ color: answer.is_correct ? '#52c41a' : '#ff4d4f' }}>{answer.user_answer || '空'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Tooltip 
      title={formatAnswerInfo()}
      overlayStyle={{ maxWidth: 500 }}
    >
      <span 
        style={{ 
          color: getResultColor(studyResult),
          cursor: 'pointer',
          display: 'inline-block',
          whiteSpace: 'nowrap',
          fontSize: '13px',
          padding: '0 4px',
          ...style
        }}
      >
        {displayMode === 'result' ? studyResult : recordDate}
      </span>
    </Tooltip>
  );
};

export default AnswerRecordPopover; 