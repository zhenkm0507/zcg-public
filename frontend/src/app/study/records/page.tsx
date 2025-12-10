'use client';

import React, { useEffect, useState } from 'react';
import { Table, Collapse, Tooltip, Button, Typography, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownOutlined } from '@ant-design/icons';
import { getStudyRecordList } from '@/services/study';
import type { StudyRecordDto } from '@/types/study';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import AnswerRecordPopover from '@/components/AnswerRecordPopover';
import WordFilter from '@/components/WordFilter';

const { Panel } = Collapse;
const { Text } = Typography;

type StudyRecordItem = StudyRecordDto['study_record_list'][0] & { key: string };

const StudyRecords: React.FC = () => {
  const [records, setRecords] = useState<StudyRecordDto[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<StudyRecordDto[]>([]);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const router = useRouter();

  const columns: ColumnsType<StudyRecordItem> = [
    {
      title: '单词',
      dataIndex: 'word',
      key: 'word',
      width: 100,
      fixed: 'left' as const,
      render: (text: string, record: StudyRecordItem) => (
        <Button type="link" onClick={() => router.push(`/study/word_bank/detail?word=${record.unmask_word}&from=/study/records`)}>
          {text}
        </Button>
      ),
    },
    {
      title: '释义',
      dataIndex: 'explanation',
      key: 'explanation',
      width: 300,
      render: (text: string, record: StudyRecordItem) => (
        <Tooltip placement="topLeft" title={text}>
          <Button type="link" onClick={() => router.push(`/study/word_bank/detail?word=${record.unmask_word}&from=/study/records`)}>
            <Text style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
              {text}
            </Text>
          </Button>
        </Tooltip>
      ),
    },
    {
      title: '背词结果',
      dataIndex: 'study_result',
      key: 'study_result',
      width: 80,
      render: (text: string, record: StudyRecordItem) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', alignItems: 'center' }}>
          <AnswerRecordPopover
            recordDate={record.record_time}
            studyResult={record.study_result}
            answerInfo={record.answer_info}
            displayMode="result"
          />
        </div>
      ),
    },
    {
      title: '单词状态',
      dataIndex: 'word_status',
      key: 'word_status',
      width: 80,
      render: (text: string, record: StudyRecordItem) => {
        const colorMap: Record<string, string> = {
          '未背': '#faad14',
          '已背': '#1890ff',
          '已斩': '#52c41a'
        };
        return (
          <Button type="link" onClick={() => router.push(`/study/word_bank/detail?word=${record.unmask_word}&from=/study/records`)}>
            <span style={{ color: colorMap[text] || '#000000' }}>{text}</span>
          </Button>
        );
      },
    },
    {
      title: '标签',
      dataIndex: 'flags',
      key: 'flags',
      width: 180,
      render: (flags: string[], record: StudyRecordItem) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {flags.map((flag, i) => (
            <Tag key={i} className="primaryTag">{flag}</Tag>
          ))}
        </div>
      ),
      onCell: (record: StudyRecordItem) => ({
        onClick: () => {
          router.push(`/study/word_bank/detail?word=${record.unmask_word}&from=/study/records`);
        },
        style: { cursor: 'pointer' }
      })
    },
  ];

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await getStudyRecordList();
        if (response.data.code === 0) {
          setRecords(response.data.data);
          setFilteredRecords(response.data.data);
          // 设置默认展开的日期
          const dates = response.data.data.map((item: StudyRecordDto) => item.record_date);
          const initialActiveKeys = dates.slice(0, 2);
          setActiveKeys(initialActiveKeys);
        }
      } catch (error) {
        console.error('获取学习记录失败:', error);
      }
    };

    fetchRecords();
  }, []);

  const handleFilterChange = (filters: { 
    keyword: string; 
    selectedTags: string[];
    tagFilterMode: 'or' | 'and';
  }) => {
    const { keyword, selectedTags, tagFilterMode } = filters;
    
    const filtered = records.map(record => ({
      ...record,
      study_record_list: record.study_record_list.filter(item => {
        // 关键词筛选
        const keywordMatch = !keyword || 
          item.unmask_word.toLowerCase().includes(keyword.toLowerCase()) ||
          item.explanation.toLowerCase().includes(keyword.toLowerCase());
        
        // 标签筛选
        const tagMatch = selectedTags.length === 0 || 
          (tagFilterMode === 'and'
            ? selectedTags.every(tag => item.flags?.includes(tag))
            : selectedTags.some(tag => item.flags?.includes(tag)));
        
        return keywordMatch && tagMatch;
      })
    })).filter(record => record.study_record_list.length > 0);
    
    setFilteredRecords(filtered);
  };

  // 计算每个日期的汇总信息
  const getDateSummary = (record: StudyRecordDto) => {
    const correctCount = record.study_record_list.filter(item => item.study_result === '正确').length;
    const errorCount = record.study_record_list.filter(item => item.study_result === '错误').length;
    return { correctCount, errorCount };
  };

  return (
    <div className={styles.container}>
      <WordFilter onFilterChange={handleFilterChange} />
      <Collapse
        activeKey={activeKeys}
        onChange={setActiveKeys}
        className={styles.collapse}
      >
        {filteredRecords.map((record) => {
          const { correctCount, errorCount } = getDateSummary(record);
          return (
            <Panel 
              header={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{record.record_date}</span>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    （
                    <span style={{ color: '#52c41a' }}>正确：{correctCount}</span>
                    ；<span style={{ color: '#ff4d4f' }}>错误：{errorCount}</span>
                    ）
                  </span>
                </div>
              } 
              key={record.record_date}
            >
              <Table
                columns={columns}
                dataSource={record.study_record_list.map(item => ({ ...item, key: String(item.id) }))}
                pagination={false}
                scroll={{ x: 800 }}
              />
            </Panel>
          );
        })}
      </Collapse>
    </div>
  );
};

export default StudyRecords; 