'use client';

import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import WordFilter from '@/components/WordFilter';
import Breadcrumb from '@/components/Breadcrumb';
import { getTablePagination } from '@/components/TablePagination';
import { proverbApi } from '@/services/study';
import styles from './page.module.css';

interface Proverb {
  id: number;
  proverb: string;
  chinese_exp: string;
}

const ProverbPage: React.FC = () => {
  const [proverbs, setProverbs] = useState<Proverb[]>([]);
  const [filteredProverbs, setFilteredProverbs] = useState<Proverb[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取谚语列表
  const fetchProverbs = async () => {
    try {
      setLoading(true);
      const response = await proverbApi.getProverbList();
      if (response.data.code === 0) {
        setProverbs(response.data.data);
        setFilteredProverbs(response.data.data);
      }
    } catch (error) {
      console.error('获取谚语列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 筛选处理
  const handleFilterChange = (filters: { keyword: string; selectedTags: string[]; tagFilterMode: 'or' | 'and' }) => {
    const { keyword } = filters;
    
    if (!keyword.trim()) {
      setFilteredProverbs(proverbs);
      return;
    }

    const filtered = proverbs.filter(proverb => 
      proverb.proverb.toLowerCase().includes(keyword.toLowerCase()) ||
      proverb.chinese_exp.includes(keyword)
    );
    setFilteredProverbs(filtered);
  };

  // 表格列定义
  const columns = [
    {
      title: '谚语',
      dataIndex: 'proverb',
      key: 'proverb',
      ellipsis: true,
      render: (text: string) => <span className={styles.proverbText} title={text}>{text}</span>,
    },
    {
      title: '中文释义',
      dataIndex: 'chinese_exp',
      key: 'chinese_exp',
      ellipsis: true,
      render: (text: string) => <span className={styles.chineseExpText} title={text}>{text}</span>,
    },
  ];

  // 分页配置
  const pagination = getTablePagination({
    pageSize: 20,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: true,
    totalText: '共 {total} 条谚语',
    pageSizeOptions: ['20', '50', '100'],
  });

  useEffect(() => {
    fetchProverbs();
  }, []);

  return (
    <div className={styles.container}>
      <Breadcrumb />
      <WordFilter 
        onFilterChange={handleFilterChange}
        showTagFilter={false}
        placeholder="输入谚语或中文释义进行搜索"
      />
      <div className={styles.tableWrapper}>
        <Table
          columns={columns}
          dataSource={filteredProverbs}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          locale={{
            emptyText: '暂无谚语数据',
          }}
        />
      </div>
    </div>
  );
};

export default ProverbPage;
