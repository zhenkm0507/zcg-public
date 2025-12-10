'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tooltip, Button, Tag, Select } from 'antd';
import { getHardWordRecordList } from '@/services/study';
import { HardWordDto } from '@/types/study';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import AnswerRecordPopover from '@/components/AnswerRecordPopover';
import WordFilter from '@/components/WordFilter';

const HardWordRecords: React.FC = () => {
  const [records, setRecords] = useState<HardWordDto[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<HardWordDto[]>([]);
  const [faultCount, setFaultCount] = useState<number>(3); // 默认值为3
  const router = useRouter();

  // 失败次数选项
  const faultCountOptions = [
    { label: '>=1', value: 1 },
    { label: '>=2', value: 2 },
    { label: '>=3', value: 3 },
  ];

  const columns = [
    {
      title: '单词',
      dataIndex: 'word',
      key: 'word',
      width: 80,
      render: (text: string, record: HardWordDto) => (
        <Button type="link" onClick={() => router.push(`/study/word_bank/detail?word=${record.unmask_word}&from=/study/hard_word`)}>
          {text}
        </Button>
      ),
    },
    {
      title: '释义',
      dataIndex: 'explanation',
      key: 'explanation',
      width: 210,
      render: (text: string, record: HardWordDto) => (
        <Tooltip title={text}>
          <Button type="link" onClick={() => router.push(`/study/word_bank/detail?word=${record.unmask_word}&from=/study/hard_word`)}>
            <div style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              maxWidth: 190
            }}>
              {text}
            </div>
          </Button>
        </Tooltip>
      ),
    },
    {
      title: '单词状态',
      dataIndex: 'word_status',
      key: 'word_status',
      width: 80,
      render: (text: string, record: HardWordDto) => {
        const colorMap: Record<string, string> = {
          '未背': '#faad14',
          '已背': '#1890ff',
          '已斩': '#52c41a'
        };
        return (
          <Button type="link" onClick={() => router.push(`/study/word_bank/detail?word=${record.unmask_word}&from=/study/hard_word`)}>
            <span style={{ color: colorMap[text] || '#000000' }}>{text}</span>
          </Button>
        );
      },
    },
    {
      title: '标签',
      dataIndex: 'flags',
      key: 'flags',
      width: 200,
      render: (flags: string[], record: HardWordDto) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {flags.map((flag, i) => (
            <Tag key={i} className="primaryTag">{flag}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: '学习记录',
      dataIndex: 'answer_info',
      key: 'answer_info',
      width: 230,
      render: (answerInfo: any[], record: HardWordDto) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
          {answerInfo.map((item, index) => (
            <AnswerRecordPopover
              key={index}
              recordDate={item.record_date}
              studyResult={item.study_result}
              answerInfo={item.answer_info}
              displayMode="date"
            />
          ))}
        </div>
      ),
    },
  ];

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await getHardWordRecordList(faultCount);
        if (response.data.code === 0) {
          setRecords(response.data.data);
          setFilteredRecords(response.data.data);
        }
      } catch (error) {
        console.error('获取困难单词记录失败:', error);
      }
    };

    fetchRecords();
  }, [faultCount]);

  // 处理失败次数变化
  const handleFaultCountChange = (value: number) => {
    setFaultCount(value);
  };

  const handleFilterChange = (filters: { 
    keyword: string; 
    selectedTags: string[];
    tagFilterMode: 'or' | 'and';
  }) => {
    const { keyword, selectedTags, tagFilterMode } = filters;
    
    const filtered = records.filter(record => {
      // 关键词筛选
      const keywordMatch = !keyword || 
        record.unmask_word.toLowerCase().includes(keyword.toLowerCase()) ||
        record.explanation.toLowerCase().includes(keyword.toLowerCase());
      
      // 标签筛选
      const tagMatch = selectedTags.length === 0 || 
        (tagFilterMode === 'and'
          ? selectedTags.every(tag => record.flags?.includes(tag))
          : selectedTags.some(tag => record.flags?.includes(tag)));
      
      return keywordMatch && tagMatch;
    });
    
    setFilteredRecords(filtered);
  };

  return (
    <div className={styles.container}>
      {/* 失败次数筛选 */}
      <div className={styles.filterSection}>
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>失败次数：</label>
          <Select
            value={faultCount}
            onChange={handleFaultCountChange}
            options={faultCountOptions}
            style={{ width: 120 }}
          />
        </div>
      </div>
      
      <WordFilter onFilterChange={handleFilterChange} />
      <div className={styles.tableWrapper}>
        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          pagination={false}
        />
      </div>
    </div>
  );
};

export default HardWordRecords; 