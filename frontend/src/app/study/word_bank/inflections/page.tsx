'use client';

import { useState, useEffect } from 'react';
import { Table, Tabs, message, Spin, Tag } from 'antd';
import type { TabsProps } from 'antd';
import { useRouter } from 'next/navigation';
import { getInflections } from '@/services/word';
import type { InflectionDto } from '@/types/word';
import { getTablePagination } from '@/components/TablePagination';
import Breadcrumb from '@/components/Breadcrumb';
import WordFilter from '@/components/WordFilter';
import styles from './page.module.css';

const InflectionsPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [inflectionData, setInflectionData] = useState<InflectionDto | null>(null);
  const [filteredData, setFilteredData] = useState<InflectionDto | null>(null);
  const [activeTab, setActiveTab] = useState('verbs');

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 500
  });

  const fetchInflections = async (type: number) => {
    setLoading(true);
    try {
      const response = await getInflections(type);
      if (response.data.code === 0) {
        setInflectionData(response.data.data);
        setFilteredData(response.data.data);
      } else {
        message.error(response.data.message || '获取变形形式列表失败');
      }
    } catch (error) {
      console.error('获取变形形式列表失败:', error);
      message.error('获取变形形式列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 根据当前选中的标签获取对应的变形形式类型
    const typeMap = {
      'verbs': 1,
      'adjectives': 2,
      'nouns': 3
    };
    
    fetchInflections(typeMap[activeTab as keyof typeof typeMap]);
  }, [activeTab]);

  const handleFilterChange = (filters: { 
    keyword: string; 
    selectedTags: string[];
    tagFilterMode: 'or' | 'and';
  }) => {
    if (!inflectionData) return;

    const { keyword, selectedTags, tagFilterMode } = filters;
    
    const filteredTableData = inflectionData.table_data.filter(row => {
      // 关键词筛选（检查单词列和释义列）
      const keywordMatch = !keyword || 
        row[0].toLowerCase().includes(keyword.toLowerCase()) ||
        row[1].toLowerCase().includes(keyword.toLowerCase());
      
      // 标签筛选（检查标签列）
      const tagMatch = selectedTags.length === 0 || 
        (tagFilterMode === 'and'
          ? selectedTags.every(tag => {
              const flags = row[inflectionData.table_header.indexOf('标签')];
              return flags && flags.includes(tag);
            })
          : selectedTags.some(tag => {
              const flags = row[inflectionData.table_header.indexOf('标签')];
              return flags && flags.includes(tag);
            }));
      
      return keywordMatch && tagMatch;
    });
    
    setFilteredData({
      ...inflectionData,
      table_data: filteredTableData
    });
  };

  const getColumns = () => {
    if (!filteredData) return [];
    
    return filteredData.table_header.map((header, index) => {
      // 如果是标签列，使用自定义渲染
      if (header === '标签') {
        return {
          title: header,
          dataIndex: `col${index}`,
          key: `col${index}`,
          width: 220,
          render: (flags: string | string[]) => {
            if (!flags) return null;
            // 如果已经是数组，直接使用；如果是字符串，则分割
            const flagArray = Array.isArray(flags) ? flags : flags.split(',').filter(Boolean);
            return (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {flagArray.map((flag, i) => (
                  <Tag key={i} className="primaryTag">{flag}</Tag>
                ))}
              </div>
            );
          },
          onCell: (record: any) => ({
            onClick: () => {
              router.push(`/study/word_bank/detail?word=${record.col0}`);
            },
            style: { cursor: 'pointer' }
          })
        };
      }
      // 释义列自适应宽度，允许自动换行
      if (header === '释义' || header.toLowerCase() === 'definition') {
        return {
          title: header,
          dataIndex: `col${index}`,
          key: `col${index}`,
          render: (text: string) => <span style={{whiteSpace: 'pre-line'}}>{text}</span>,
          onCell: (record: any) => ({
            onClick: () => {
              router.push(`/study/word_bank/detail?word=${record.col0}`);
            },
            style: { cursor: 'pointer' }
          })
        };
      }
      // 原形、过去式、过去分词、现在分词宽度80px
      if (["原形", "过去式", "过去分词", "现在分词"].includes(header)) {
        return {
          title: header,
          dataIndex: `col${index}`,
          key: `col${index}`,
          width: 80,
          ellipsis: true,
          onCell: (record: any) => ({
            onClick: () => {
              router.push(`/study/word_bank/detail?word=${record.col0}`);
            },
            style: { cursor: 'pointer' }
          })
        };
      }
      // 其他列固定宽度100px
      return {
        title: header,
        dataIndex: `col${index}`,
        key: `col${index}`,
        width: 100,
        ellipsis: true,
        onCell: (record: any) => ({
          onClick: () => {
            router.push(`/study/word_bank/detail?word=${record.col0}`);
          },
          style: { cursor: 'pointer' }
        })
      };
    });
  };

  const getDataSource = () => {
    if (!filteredData) return [];
    
    return filteredData.table_data.map((row, index) => {
      const data: Record<string, string> = {};
      row.forEach((value, colIndex) => {
        data[`col${colIndex}`] = value;
      });
      return {
        key: index,
        ...data
      };
    });
  };

  const items: TabsProps['items'] = [
    {
      key: 'verbs',
      label: '动词',
      children: null,
    },
    {
      key: 'adjectives',
      label: '形容词',
      children: null,
    },
    {
      key: 'nouns',
      label: '名词',
      children: null,
    },
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Breadcrumb />
      <Tabs
        activeKey={activeTab}
        items={items}
        onChange={setActiveTab}
        className={styles.tabs}
      />
      <WordFilter onFilterChange={handleFilterChange} />
      <div className={styles.tableWrapper}>
        <Table
          columns={getColumns()}
          dataSource={getDataSource()}
          loading={loading}
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
        />
      </div>
    </div>
  );
};

export default InflectionsPage; 