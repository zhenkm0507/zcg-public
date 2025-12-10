'use client';

import { useState, useEffect } from 'react';
import { Tabs, Table, Tag } from 'antd';
import type { TabsProps } from 'antd';
import { useRouter } from 'next/navigation';
import { getWordList } from '@/services/word';
import type { UserWordDto } from '@/types/word';
import Breadcrumb from '@/components/Breadcrumb';
import WordFilter from '@/components/WordFilter';
import styles from './page.module.css';

const WordListPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('0');
  const [loading, setLoading] = useState(false);
  const [wordList, setWordList] = useState<UserWordDto[]>([]);
  const [filteredWordList, setFilteredWordList] = useState<UserWordDto[]>([]);

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 500
  });

  const fetchWordList = async (status: number) => {
    setLoading(true);
    try {
      const response = await getWordList(status);
      console.log('获取单词列表响应:', response);
      if (response.data.code === 0) {
        setWordList(response.data.data);
        setFilteredWordList(response.data.data);
        console.log('设置单词列表:', response.data.data);
      }
    } catch (error) {
      console.error('获取单词列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWordList(Number(activeTab));
  }, [activeTab]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    fetchWordList(Number(key));
  };

  const handleFilterChange = (filters: { 
    keyword: string; 
    selectedTags: string[];
    tagFilterMode: 'or' | 'and';
  }) => {
    const { keyword, selectedTags, tagFilterMode } = filters;
    
    const filtered = wordList.filter(word => {
      // 关键词筛选
      const keywordMatch = !keyword || 
        word.unmask_word.toLowerCase().includes(keyword.toLowerCase()) ||
        word.explanation.toLowerCase().includes(keyword.toLowerCase());
      
      // 标签筛选
      const tagMatch = selectedTags.length === 0 || 
        (tagFilterMode === 'and'
          ? selectedTags.every(tag => word.flags?.includes(tag))
          : selectedTags.some(tag => word.flags?.includes(tag)));
      
      return keywordMatch && tagMatch;
    });
    
    setFilteredWordList(filtered);
  };

  const columns = [
    {
      title: '单词',
      dataIndex: 'word',
      key: 'word',
    },
    {
      title: '中文释义',
      dataIndex: 'explanation',
      key: 'explanation',
    },
    {
      title: '标签',
      dataIndex: 'flags',
      key: 'flags',
      width: 300,
      render: (flags: string[]) => {
        if (!flags || flags.length === 0) return '-';
        return (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {flags.map((flag, i) => (
              <Tag key={i} className="primaryTag">{flag}</Tag>
            ))}
          </div>
        );
      },
    },
  ];

  const items: TabsProps['items'] = [
    {
      key: '0',
      label: '未背单词',
    },
    {
      key: '1',
      label: '已背单词',
    },
    {
      key: '2',
      label: '已斩单词',
    },
  ];

  return (
    <div className={styles.container}>
      <Breadcrumb />
      <Tabs
        activeKey={activeTab}
        items={items}
        onChange={handleTabChange}
        className={styles.tabs}
      />
      <WordFilter onFilterChange={handleFilterChange} />
      <div className={styles.tableWrapper}>
        <Table
          columns={columns}
          dataSource={filteredWordList}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ['20', '50', '100', '200', '500'],
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize });
            },
            onShowSizeChange: (current, size) => {
              setPagination({ current, pageSize: size });
            }
          }}
          onRow={(record) => ({
            onClick: () => router.push(`/study/word_bank/detail?word=${record.unmask_word}`),
            style: { cursor: 'pointer' },
          })}
        />
      </div>
    </div>
  );
};

export default WordListPage; 