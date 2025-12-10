'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Input, message, Progress, Spin } from 'antd';
import { wordApi } from '@/services';
import { StatisticResponse, WordInitDto } from '@/types';

const WordInitPage: React.FC = () => {
  const [statistic, setStatistic] = useState<StatisticResponse>({ 
    total_files: 0, 
    completed_files: 0, 
    completion_percentage: '0%' 
  });
  const [currentImage, setCurrentImage] = useState<string>('');
  const [currentFilePath, setCurrentFilePath] = useState<string>('');
  const [words, setWords] = useState<WordInitDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchStatistic = async () => {
    try {
      const { data } = await wordApi.getStatistic();
      setStatistic(data.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const handleNext = async () => {
    if (loading || processing) return;
    
    setLoading(true);
    try {
      const { image, filePath } = await wordApi.getNextPicture();
      setCurrentImage(image);
      setCurrentFilePath(filePath);
      
      const { data } = await wordApi.parsePicture(filePath);
      setWords(data.data);
      setProcessing(true);
    } catch (error) {
      console.error('处理下一张图片失败:', error);
      setCurrentImage('');
      setCurrentFilePath('');
      setWords([]);
      setProcessing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentFilePath) return;
    
    try {
      await wordApi.saveWords(words, currentFilePath);
      message.success('保存成功');
      setCurrentImage('');
      setWords([]);
      setProcessing(false);
      setCurrentFilePath('');
      await fetchStatistic();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleReparse = async () => {
    if (!currentFilePath) return;
    
    setWords([]);
    setLoading(true);
    try {
      const { data } = await wordApi.parsePicture(currentFilePath);
      setWords(data.data);
    } catch (error) {
      console.error('重新解析失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWordChange = (index: number, field: keyof WordInitDto, value: string | number | string[] | Record<string, string>) => {
    setWords(prev => {
      const newWords = [...prev];
      const word = { ...newWords[index] } as WordInitDto;
      
      switch (field) {
        case 'inflection':
          word.inflection = value as Record<string, string>;
          break;
        case 'phrases':
          word.phrases = value as string[];
          break;
        case 'page':
          word.page = Number(value);
          break;
        case 'word':
        case 'phonetic_symbol':
        case 'explanation':
        case 'example_sentences':
        case 'expansions':
        case 'memory_techniques':
        case 'discrimination':
        case 'usage':
        case 'notes':
          word[field] = value as string;
          break;
        case 'flags':
          word.flags = value as string[];
          break;
        case 'word_bank_id':
          word.word_bank_id = Number(value);
          break;
      }
      
      newWords[index] = word;
      return newWords;
    });
  };

  useEffect(() => {
    fetchStatistic();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 顶部区域 */}
      <Card className="mb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-lg font-medium text-gray-700">词典初始化进度</div>
            <div className="space-y-1">
              <p className="text-gray-600">总文件数：<span className="font-medium">{statistic.total_files}</span></p>
              <p className="text-gray-600">已完成：<span className="font-medium">{statistic.completed_files}</span></p>
              <Progress 
                percent={parseFloat(statistic.completion_percentage)} 
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                format={percent => `${Math.round((percent || 0) * 10) / 10}%`}
              />
            </div>
          </div>
          <Button 
            type="primary" 
            onClick={handleNext}
            disabled={loading || processing}
            size="large"
            className="h-12 px-8"
          >
            处理下一个
          </Button>
        </div>
      </Card>

      <div className="flex gap-6">
        {/* 中间左部区域 */}
        <Card className="flex-1 shadow-md" style={{ position: 'sticky', top: 24, height: 'fit-content' }}>
          {currentImage ? (
            <img src={currentImage} alt="当前图片" className="w-full rounded-lg" />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
              暂无图片
            </div>
          )}
        </Card>

        {/* 中间右部区域 */}
        <Card className="flex-1 shadow-md">
          <div className="mb-6 flex gap-3">
            <Button 
              type="primary" 
              onClick={handleSave} 
              disabled={!processing}
              size="large"
              className="flex-1"
            >
              保存
            </Button>
            <Button 
              onClick={handleReparse} 
              disabled={!currentFilePath}
              size="large"
              className="flex-1"
            >
              重新解析
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spin tip="加载中..." size="large" />
            </div>
          ) : (
            <div className="space-y-6">
              {words.map((word, index) => (
                <Card 
                  key={index} 
                  size="small" 
                  className="border-2 border-blue-500 hover:border-blue-600 transition-colors"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <span className="w-24 text-gray-600">单词：</span>
                        <Input
                          value={word.word}
                          onChange={(e) => handleWordChange(index, 'word', e.target.value)}
                          placeholder="单词"
                          className="flex-1"
                          autoCapitalize="off"
                          autoCorrect="off"
                        />
                      </div>
                      <div className="flex items-center">
                        <span className="w-24 text-gray-600">音标：</span>
                        <Input
                          value={word.phonetic_symbol}
                          onChange={(e) => handleWordChange(index, 'phonetic_symbol', e.target.value)}
                          placeholder="音标"
                          className="flex-1"
                          autoCapitalize="off"
                          autoCorrect="off"
                        />
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 text-gray-600 mt-2">中文释义：</span>
                      <Input.TextArea
                        value={word.explanation}
                        onChange={(e) => handleWordChange(index, 'explanation', e.target.value)}
                        placeholder="中文释义"
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        className="flex-1"
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 text-gray-600 mt-2">例句：</span>
                      <Input.TextArea
                        value={word.example_sentences}
                        onChange={(e) => handleWordChange(index, 'example_sentences', e.target.value)}
                        placeholder="例句"
                        autoSize={{ minRows: 2, maxRows: 6 }}
                        className="flex-1"
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 text-gray-600 mt-2">拓展：</span>
                      <Input.TextArea
                        value={word.expansions}
                        onChange={(e) => handleWordChange(index, 'expansions', e.target.value)}
                        placeholder="拓展"
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        className="flex-1"
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 text-gray-600 mt-2">记忆方法：</span>
                      <Input.TextArea
                        value={word.memory_techniques}
                        onChange={(e) => handleWordChange(index, 'memory_techniques', e.target.value)}
                        placeholder="记忆方法"
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        className="flex-1"
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 text-gray-600 mt-2">辨析：</span>
                      <Input.TextArea
                        value={word.discrimination}
                        onChange={(e) => handleWordChange(index, 'discrimination', e.target.value)}
                        placeholder="辨析"
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        className="flex-1"
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 text-gray-600 mt-2">用法：</span>
                      <Input.TextArea
                        value={word.usage}
                        onChange={(e) => handleWordChange(index, 'usage', e.target.value)}
                        placeholder="用法"
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        className="flex-1"
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 text-gray-600 mt-2">注意事项：</span>
                      <Input.TextArea
                        value={word.notes}
                        onChange={(e) => handleWordChange(index, 'notes', e.target.value)}
                        placeholder="注意事项"
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        className="flex-1"
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 text-gray-600 mt-2">词形变化：</span>
                      <Input.TextArea
                        value={JSON.stringify(word.inflection, null, 2)}
                        onChange={(e) => {
                          try {
                            handleWordChange(index, 'inflection', JSON.parse(e.target.value));
                          } catch {
                            handleWordChange(index, 'inflection', {});
                          }
                        }}
                        placeholder="词形变化"
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        className="flex-1 font-mono"
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 text-gray-600 mt-2">短语：</span>
                      <Input.TextArea
                        value={JSON.stringify(word.phrases, null, 2)}
                        onChange={(e) => {
                          try {
                            handleWordChange(index, 'phrases', JSON.parse(e.target.value));
                          } catch {
                            handleWordChange(index, 'phrases', []);
                          }
                        }}
                        placeholder="短语"
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        className="flex-1 font-mono"
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <span className="w-24 text-gray-600">页码：</span>
                        <Input
                          value={word.page?.toString() || ''}
                          onChange={(e) => handleWordChange(index, 'page', e.target.value)}
                          placeholder="页码"
                          className="flex-1"
                          autoCapitalize="off"
                          autoCorrect="off"
                        />
                      </div>
                      <div className="flex items-start">
                        <span className="w-24 text-gray-600 mt-2">标签：</span>
                        <Input.TextArea
                          value={JSON.stringify(word.flags, null, 2)}
                          onChange={(e) => {
                            try {
                              handleWordChange(index, 'flags', JSON.parse(e.target.value));
                            } catch {
                              handleWordChange(index, 'flags', []);
                            }
                          }}
                          placeholder="标签"
                          autoSize={{ minRows: 1, maxRows: 4 }}
                          className="flex-1 font-mono"
                          autoCapitalize="off"
                          autoCorrect="off"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default WordInitPage; 