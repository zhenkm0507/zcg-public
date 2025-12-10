import React from 'react';
import { Spin, Tag } from 'antd';
import { SoundOutlined } from '@ant-design/icons';

interface UnmaskedDetailModalProps {
  visible: boolean;
  detail: any;
  errorInfo: Record<string, boolean>;
  onClose: () => void;
}

const inflectionLabels: Record<string, string> = {
  past_tense: '过去式',
  past_participle: '过去分词',
  present_participle: '现在分词',
  comparative: '比较级',
  superlative: '最高级',
  plural: '名词复数',
};

const speak = (word: string) => {
  if ('speechSynthesis' in window) {
    const utter = new window.SpeechSynthesisUtterance(word);
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  } else {
    alert('当前浏览器不支持语音合成');
  }
};

const fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif';

const UnmaskedDetailModal: React.FC<UnmaskedDetailModalProps> = ({ visible, detail, errorInfo, onClose }) => {
  if (!visible) return null;
  if (!detail) {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        background: 'rgba(255,255,255,0.98) url(/images/paper-texture.jpg) center center/cover no-repeat',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily
      }}>
        <Spin size="large" />
      </div>
    );
  }
  const inflections = detail.inflection ? Object.entries(detail.inflection).filter(([_, v]) => v) : [];
  const phrases = Array.isArray(detail.phrases) ? detail.phrases : [];
  const infoList = [
    { label: '释义', value: detail.explanation },
    { label: '例句', value: detail.example_sentences },
    { label: '拓展', value: detail.expansions },
    { label: '记忆方法', value: detail.memory_techniques },
    { label: '辨析', value: detail.discrimination },
    { label: '用法', value: detail.usage },
    { label: '注意事项', value: detail.notes },
  ];
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
      background: 'rgba(255,255,255,0.98) url(/images/paper-texture.jpg) center center/cover no-repeat',
      borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      padding: 32,
      fontFamily: 'var(--font-main)',
      maxHeight: '100%',
      overflowY: 'auto'
    }}>
      <div style={{ width: '100%', maxWidth: 600, padding: 0 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 30, fontWeight: 600, color: errorInfo['word'] ? '#ff4d4f' : '#222', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
            {detail.word}
            <span style={{ fontSize: 18, color: '#888', marginLeft: 12 }}>{detail.phonetic_symbol}</span>
            <SoundOutlined style={{ fontSize: 20, color: '#bfa76a', marginLeft: 8, cursor: 'pointer' }} onClick={() => speak(detail.word)} />
          </div>
        </div>
        {infoList.map(item => item.value && (
          <div key={item.label} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 2, marginLeft: 0 }}>{item.label}</div>
            <div style={{ fontSize: 16, color: '#222', marginLeft: 24, whiteSpace: 'pre-line' }}>{item.value}</div>
          </div>
        ))}
        {inflections.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, marginLeft: 0 }}>变形形式</div>
            <div style={{ fontSize: 16, color: '#222', marginLeft: 24, display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: 10 }}>
              {inflections.map(([key, value], idx) => (
                <span key={String(key)} style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center',
                  color: errorInfo[`inflection_${key}`] ? '#ff4d4f' : '#222', 
                  fontWeight: errorInfo[`inflection_${key}`] ? 600 : 400,
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content'
                }}>
                  <span style={{ color: '#666', marginRight: 2 }}>{inflectionLabels[String(key)] || String(key)}：</span>
                  {String(value)}
                  {idx !== inflections.length - 1 && <span style={{ color: '#bfa76a', marginLeft: 8 }}>|</span>}
                </span>
              ))}
            </div>
          </div>
        )}
        {phrases.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 2, marginLeft: 0 }}>短语搭配</div>
            <table style={{ marginLeft: 24, borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'auto' }}>
              <tbody>
                {phrases.map((item: any) => (
                  <tr key={item.exp}>
                    <td style={{ minWidth: 90, fontSize: 16, color: errorInfo[`phrase_${item.exp}`] ? '#ff4d4f' : '#666', fontWeight: errorInfo[`phrase_${item.exp}`] ? 600 : 500, textAlign: 'left', verticalAlign: 'top', padding: 0, paddingRight: 6 }}>{item.exp}：</td>
                    <td style={{ fontSize: 16, color: errorInfo[`phrase_${item.exp}`] ? '#ff4d4f' : '#222', fontWeight: errorInfo[`phrase_${item.exp}`] ? 600 : 400, textAlign: 'left', verticalAlign: 'top', padding: 0 }}>{item.phrase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {Array.isArray(detail.flags) && detail.flags.length > 0 && (
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'baseline' }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginRight: 8, whiteSpace: 'nowrap' }}>标签</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
              {detail.flags.map((flag: string, idx: number) => (
                <span key={idx} style={{ display: 'inline-block', background: '#f8f5ec', color: '#bfa76a', borderRadius: 4, padding: '2px 10px', fontSize: 14, border: '1px solid #e0d7c3', fontFamily: 'inherit', marginBottom: 2 }}>{flag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnmaskedDetailModal; 