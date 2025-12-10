'use client';

import { useState, useEffect } from 'react';
import { Button, Space, message, Table, Modal, Radio, Tag, Skeleton, Typography, Row, Col, Checkbox } from 'antd';
import { TagsOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import WordFilter from '@/components/WordFilter';
import { studyApi, flagApi } from '@/services/study';
import styles from './page.module.css';

const { Text, Title } = Typography;

interface WordItem {
  id: number;
  word: string;
  unmask_word: string;
  explanation: string;
  flags?: string[]; 
}

// 文本常量
const TEXT = {
  PAGE_TITLE: '标签设置',
  SET_FLAGS: '设置标签',
  ADD_FLAGS: '增加标签',
  REMOVE_FLAGS: '删除标签',
  SELECT_WORDS: '请选择要设置标签的单词',
  SELECT_FLAGS: '请选择要设置的标签',
  SUCCESS: '设置标签成功',
  FAILED: '设置标签失败',
  GET_WORDS_FAILED: '获取单词列表失败',
  GET_FLAGS_FAILED: '获取标签列表失败',
  NO_WORDS: '暂无单词数据',
  NO_FLAGS: '暂无标签数据',
  TOTAL_RECORDS: (total: number) => `共 ${total} 条记录`,
  SELECTED_WORDS: (count: number) => `已选择 ${count} 个单词`,
  SELECTED_FLAGS: (count: number) => `已选择 ${count} 个标签`,
} as const;

/**
 * 墨耕斋-标签设置页面
 * 
 * 功能说明：
 * 1. 顶部显示面包屑导航
 * 2. 筛选区域支持关键词和标签筛选
 * 3. 词汇列表支持多选
 * 4. 标签设置弹窗支持批量操作
 * 
 * 主要特性：
 * - 响应式设计
 * - 批量标签操作
 * - 实时筛选
 * - 操作确认
 * 
 * 使用说明：
 * 1. 使用筛选功能查找单词
 * 2. 选择要设置标签的单词
 * 3. 点击"设置标签"按钮
 * 4. 在弹窗中选择标签和操作类型
 * 5. 确认操作
 */
export default function SetFlagsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [wordList, setWordList] = useState<WordItem[]>([]);
  const [filteredWordList, setFilteredWordList] = useState<WordItem[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableFlags, setAvailableFlags] = useState<string[]>([]);
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);
  const [operateType, setOperateType] = useState<1 | 2>(1);
  const [flagsModalVisible, setFlagsModalVisible] = useState(false);
  const [flagsLoading, setFlagsLoading] = useState(false);

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50
  });

  // 获取单词列表
  const fetchWordList = async () => {
    setLoading(true);
    try {
      console.log('开始获取单词列表');
      const response = await studyApi.getUserWordList();
      console.log('获取单词列表响应:', response);
      if (response.data.code === 0) {
        setWordList(response.data.data);
        setFilteredWordList(response.data.data);
        console.log('设置单词列表:', response.data.data);
      } else {
        message.error(response.data.message || TEXT.GET_WORDS_FAILED);
      }
    } catch (error) {
      console.error(TEXT.GET_WORDS_FAILED, error);
      message.error(TEXT.GET_WORDS_FAILED);
    } finally {
      setLoading(false);
    }
  };

  // 获取标签列表
  const fetchFlags = async () => {
    setFlagsLoading(true);
    try {
      console.log('开始获取标签列表');
      const response = await flagApi.getUserCustomFlags();
      console.log('获取标签列表响应:', response);
      if (response.data.code === 0) {
        setAvailableFlags(response.data.data);
        console.log('设置标签列表:', response.data.data);
      } else {
        message.error(response.data.message || TEXT.GET_FLAGS_FAILED);
      }
    } catch (error) {
      console.error(TEXT.GET_FLAGS_FAILED, error);
      message.error(TEXT.GET_FLAGS_FAILED);
    } finally {
      setFlagsLoading(false);
    }
  };

  // 筛选变化处理
  const handleFilterChange = (filters: { 
    keyword: string; 
    selectedTags: string[];
    tagFilterMode: 'or' | 'and';
  }) => {
    let filtered = wordList;

    // 关键词筛选
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(word => 
        word.unmask_word.toLowerCase().includes(keyword) || 
        word.explanation.toLowerCase().includes(keyword)
      );
    }

    // 标签筛选
    if (filters.selectedTags.length > 0) {
      if (filters.tagFilterMode === 'or') {
        // 取并集：满足任一标签
        filtered = filtered.filter(word => 
          word.flags && filters.selectedTags.some(tag => word.flags!.includes(tag))
        );
      } else {
        // 取交集：满足所有标签
        filtered = filtered.filter(word => 
          word.flags && filters.selectedTags.every(tag => word.flags!.includes(tag))
        );
      }
    }

    setFilteredWordList(filtered);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 单词选择变化
  const handleWordSelectionChange = (selectedRowKeys: React.Key[]) => {
    // 根据选中的行键，获取对应的 unmask_word 值
    const selectedUnmaskWords = selectedRowKeys.map(key => {
      const wordItem = wordList.find(item => item.word === key);
      return wordItem ? wordItem.unmask_word : key.toString();
    });
    setSelectedWords(selectedUnmaskWords);
  };

  // 打开标签设置弹窗
  const handleOpenFlagsModal = () => {
    if (selectedWords.length === 0) {
      message.warning({
        content: '请先选择单词',
        style: { color: 'var(--color-primary-dark, #4b3a1e)' }
      });
      return;
    }
    setSelectedFlags([]);
    setOperateType(1);
    setFlagsModalVisible(true);
  };

  // 确认设置标签
  const handleConfirmSetFlags = async () => {
    if (selectedFlags.length === 0) {
      message.warning({
        content: TEXT.SELECT_FLAGS,
        style: { color: 'var(--color-primary-dark, #4b3a1e)' }
      });
      return;
    }

    const operationText = operateType === 1 ? '增加' : '减少';
    
    Modal.confirm({
      title: TEXT.SET_FLAGS,
      content: `确定为${selectedWords.length}个单词${operationText}${selectedFlags.length}个标签吗？`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: {
        style: { background: 'var(--color-primary, #bfa76a)', borderColor: 'var(--color-primary, #bfa76a)', color: '#fff' },
      },
      cancelButtonProps: {
        style: { color: '#4b3a1e', borderColor: '#e0e0e0', background: '#fff' },
      },
      onOk: async () => {
        try {
          console.log('开始设置标签:', {
            operate_type: operateType,
            flags: selectedFlags,
            words: selectedWords, // 这里现在存储的是 unmask_word 的值
            selectedWordsCount: selectedWords.length
          });
          
          const response = await flagApi.setUserWordFlags({
            operate_type: operateType,
            flags: selectedFlags,
            words: selectedWords
          });
          
          console.log('设置标签响应:', response);
          if (response.data.code === 0) {
            message.success({
              content: TEXT.SUCCESS,
              style: { color: 'var(--color-primary-dark, #4b3a1e)' },
              className: 'custom-success-message'
            });
            setFlagsModalVisible(false);
            setSelectedWords([]);
            // 刷新单词列表以显示更新后的标签
            fetchWordList();
          } else {
            message.error(response.data.message || TEXT.FAILED);
          }
        } catch (error) {
          console.error(TEXT.FAILED, error);
          message.error(TEXT.FAILED);
        }
      },
    });
  };

  // 表格列配置
  const columns = [
    {
      title: '单词',
      dataIndex: 'word',
      key: 'word',
      width: 120,
      render: (text: string, record: WordItem) => (
        <Button type="link" onClick={() => router.push(`/study/word_bank/detail?word=${record.unmask_word}&from=/study/battle`)}>
          <Text strong style={{ color: 'var(--color-primary-dark, #4b3a1e)' }}>
            {text}
          </Text>
        </Button>
      ),
    },
    {
      title: '释义',
      dataIndex: 'explanation',
      key: 'explanation',
      width: 400,
      ellipsis: true,
      render: (text: string, record: WordItem) => (
        <Button type="link" onClick={() => router.push(`/study/word_bank/detail?word=${record.unmask_word}&from=/study/battle`)}>
          <Text style={{ color: '#666' }}>
            {text}
          </Text>
        </Button>
      ),
    },
    {
      title: '标签',
      dataIndex: 'flags',
      key: 'flags',
      width: 350,
      render: (flags: string[], record: WordItem) => (
        <Space wrap>
          {flags && flags.length > 0 ? (
            flags.map((flag, index) => (
              <Tag 
                key={index}
                color="var(--color-primary, #bfa76a)"
                style={{ 
                  color: 'var(--color-primary-dark, #4b3a1e)',
                  borderColor: 'var(--color-primary, #bfa76a)',
                  background: 'var(--color-primary-bg, #f8f5ec)',
                  fontWeight: 'bold',
                  borderRadius: '4px'
                }}
              >
                {flag}
              </Tag>
            ))
          ) : (
            <Text type="secondary" style={{ fontSize: '12px' }}>无标签</Text>
          )}
        </Space>
      ),
      onCell: (record: WordItem) => ({
        onClick: () => {
          router.push(`/study/word_bank/detail?word=${record.unmask_word}&from=/study/battle`);
        },
        style: { cursor: 'pointer' }
      })
    },
  ];

  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys: selectedWords.map(unmaskWord => {
      // 根据 unmask_word 找到对应的 word 作为行键
      const wordItem = wordList.find(item => item.unmask_word === unmaskWord);
      return wordItem ? wordItem.word : unmaskWord;
    }),
    onChange: handleWordSelectionChange,
    getCheckboxProps: (record: WordItem) => ({
      name: record.word,
    }),
  };

  // 分页配置
  const paginationConfig = {
    ...pagination,
    total: filteredWordList.length,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => TEXT.TOTAL_RECORDS(total),
    onChange: (page: number, pageSize: number) => {
      setPagination({ current: page, pageSize });
    },
  };

  // 初始化数据
  useEffect(() => {
    fetchWordList();
    fetchFlags();
  }, []);

  return (
    <div className={styles.container}>
      <Breadcrumb />
      
      <div className={styles.header}>
        <Title level={4} style={{ margin: 0, color: 'var(--color-primary-dark, #4b3a1e)' }}>
          {TEXT.PAGE_TITLE}
        </Title>
        <Space>
          <Text type="secondary">
            {TEXT.SELECTED_WORDS(selectedWords.length)}
          </Text>
          <Button
            type="primary"
            icon={<TagsOutlined />}
            onClick={handleOpenFlagsModal}
            style={{
              background: 'var(--color-primary, #bfa76a)',
              borderColor: 'var(--color-primary, #bfa76a)',
              color: '#fff'
            }}
          >
            {TEXT.SET_FLAGS}
          </Button>
        </Space>
      </div>

      <div className={styles.filterWrapper}>
        <WordFilter onFilterChange={handleFilterChange} />
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : (
          <Table
            rowKey="word"
            columns={columns}
            dataSource={filteredWordList}
            rowSelection={rowSelection}
            pagination={paginationConfig}
            loading={loading}
            size="middle"
            scroll={{ x: 800 }}
            locale={{
              emptyText: TEXT.NO_WORDS
            }}
          />
        )}
      </div>

      {/* 标签设置弹窗 */}
      <Modal
        title={
          <Space>
            <TagsOutlined style={{ color: 'var(--color-primary, #bfa76a)' }} />
            <span>{TEXT.SET_FLAGS}</span>
          </Space>
        }
        open={flagsModalVisible}
        onOk={handleConfirmSetFlags}
        onCancel={() => setFlagsModalVisible(false)}
        width={600}
        okText="确定"
        cancelText="取消"
        okButtonProps={{
          style: { 
            background: 'var(--color-primary, #bfa76a)', 
            borderColor: 'var(--color-primary, #bfa76a)', 
            color: '#fff' 
          },
        }}
        cancelButtonProps={{
          style: { 
            color: '#4b3a1e', 
            borderColor: '#e0e0e0', 
            background: '#fff' 
          },
        }}
      >
        <div className={styles.modalContent}>
          {/* 操作类型选择 */}
          <div className={styles.section}>
            <Text strong style={{ display: 'block', marginBottom: '12px', color: 'var(--color-primary-dark, #4b3a1e)' }}>
              操作类型
            </Text>
            <Radio.Group 
              value={operateType} 
              onChange={(e) => setOperateType(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%', paddingLeft: '20px' }}>
                <Radio value={1} style={{ width: '100%' }}>
                  <Space>
                    <PlusOutlined style={{ color: 'var(--color-primary, #bfa76a)' }} />
                    <span>{TEXT.ADD_FLAGS}</span>
                  </Space>
                </Radio>
                <Radio value={2} style={{ width: '100%' }}>
                  <Space>
                    <MinusOutlined style={{ color: 'var(--color-primary, #bfa76a)' }} />
                    <span>{TEXT.REMOVE_FLAGS}</span>
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </div>

          {/* 标签选择 */}
          <div className={styles.section}>
            <Text strong style={{ display: 'block', marginBottom: '12px', color: 'var(--color-primary-dark, #4b3a1e)' }}>
              选择标签
            </Text>
            <div style={{ paddingLeft: '20px' }}>
              {flagsLoading ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : availableFlags.length > 0 ? (
                <Checkbox.Group
                  value={selectedFlags}
                  onChange={(checkedValues) => setSelectedFlags(checkedValues as string[])}
                  style={{ width: '100%' }}
                >
                  <Row gutter={[2, 8]}>
                    {availableFlags.map((flag, index) => (
                      <Col key={index} xs={12} sm={8} md={6} lg={4}>
                        <Checkbox value={flag}>
                          <Tag 
                            color="var(--color-primary, #bfa76a)"
                            style={{ 
                              color: 'var(--color-primary-dark, #4b3a1e)',
                              borderColor: 'var(--color-primary, #bfa76a)',
                              background: 'var(--color-primary-bg, #f8f5ec)',
                              fontWeight: 'bold',
                              borderRadius: '4px'
                            }}
                          >
                            {flag}
                          </Tag>
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                </Checkbox.Group>
              ) : (
                <Text type="secondary">{TEXT.NO_FLAGS}</Text>
              )}
            </div>
          </div>

          {/* 统计信息 */}
          <div className={styles.stats}>
            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary">
                  {TEXT.SELECTED_WORDS(selectedWords.length)}
                </Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">
                  {TEXT.SELECTED_FLAGS(selectedFlags.length)}
                </Text>
              </Col>
            </Row>
          </div>
        </div>
      </Modal>
    </div>
  );
} 