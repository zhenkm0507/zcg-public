'use client';

import { useState, useEffect } from 'react';
import { Input, Table, ConfigProvider } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { proverbApi } from '@/services/study';
import { ProverbItem } from '@/types/study';
import styles from './page.module.css';

const { Search } = Input;

export default function ProverbsPage() {
  const [proverbs, setProverbs] = useState<ProverbItem[]>([]);
  const [filteredProverbs, setFilteredProverbs] = useState<ProverbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 获取谚语列表
  const fetchProverbs = async () => {
    setLoading(true);
    try {
      const response = await proverbApi.getProverbList();
      if (response.data && response.data.code === 0) {
        const proverbData = response.data.data;
        setProverbs(proverbData);
        setFilteredProverbs(proverbData);
        setPagination(prev => ({ ...prev, total: proverbData.length }));
      }
    } catch (error) {
      console.error('获取谚语列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索过滤
  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    const filtered = proverbs.filter(proverb => 
      proverb.proverb.toLowerCase().includes(keyword.toLowerCase()) ||
      proverb.chinese_exp.includes(keyword)
    );
    setFilteredProverbs(filtered);
    setPagination(prev => ({ ...prev, current: 1, total: filtered.length }));
  };

  // 分页处理
  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: filteredProverbs.length,
    });
  };

  useEffect(() => {
    fetchProverbs();
  }, []);

  // 表格列定义
  const columns = [
    {
      title: '谚语',
      dataIndex: 'proverb',
      key: 'proverb',
      width: '40%',
      className: styles.proverbCell,
    },
    {
      title: '中文释义',
      dataIndex: 'chinese_exp',
      key: 'chinese_exp',
      width: '60%',
      className: styles.chineseExpCell,
    },
  ];

  // 分页数据
  const paginatedData = filteredProverbs.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#bfa76a',
        },
      }}
    >
      <div className={styles.container}>
        {/* 筛选区域 */}
        <div className={styles.filterSection}>
          <Search
            placeholder="搜索谚语或中文释义"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            className={styles.searchInput}
            value={searchKeyword}
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* 列表区域 */}
        <div className={styles.tableSection}>
          <Table
            className={styles.proverbTable}
            columns={columns}
            dataSource={paginatedData}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: filteredProverbs.length,
              onChange: (page: number, pageSize?: number) => {
                setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || 20 }));
              },
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ['20', '50', '100', '200', '500'],
              showTotal: (total: number) => `共 ${total} 条谚语`,
            }}
            onChange={handleTableChange}
            scroll={{ y: 600 }}
          />
        </div>
      </div>
    </ConfigProvider>
  );
}