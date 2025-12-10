'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Button, Space, message, Checkbox, Table, Row, Col, Modal, Tooltip, Skeleton, Tag } from 'antd';
import { PlusOutlined, SettingOutlined, PlayCircleOutlined, EyeOutlined, BookOutlined, DownloadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import WordFilter from '@/components/WordFilter';
import { studyApi } from '@/services/study';
import request from '@/utils/request';
import { BatchRecord, BatchListResponse, SetWordsParams } from '@/types/study';
import styles from './page.module.css';

interface WordItem {
  id: number;
  word: string;
  explanation: string;
  flags?: string[];
}

// 文本常量
const TEXT = {
  BATCH_LIST: '批次列表',
  CREATE_BATCH: '新建批次',
  SET_WORDS: '设置单词集',
  START_LEARNING: '开始学习',
  SAVE: '保存',
  NO_BATCHES: '暂无批次，点击上方按钮创建新批次',
  SELECT_BATCH: '请选择左侧批次进行单词集设置',
  LOADING: '加载中...',
  NO_WORDS: '暂无单词数据',
  CONFIRM_START: '确认开始学习',
  CONFIRM_START_CONTENT: '确定要开始学习这个批次吗？',
  CONFIRM_SET_WORDS: '确认设置单词集',
  CONFIRM_SET_WORDS_CONTENT: (count: number) => `确定要为批次设置 ${count} 个单词吗？`,
  PLEASE_SELECT_BATCH: '请选择批次',
  PLEASE_SELECT_WORDS: '请选择至少一个单词',
  TOO_MANY_WORDS: '单次最多只能选择100个单词',
  BATCH: '批次',
  WORD_COUNT: '单词数',
  FINISHED: '已完成',
  UNFINISHED: '未完成',
  TOTAL_RECORDS: (total: number) => `共 ${total} 条记录`,
  SAVE_WORDS: (count: number) => `保存 (${count} 个单词)`,
  SHORTCUT_HINT: 'Ctrl/Cmd + Enter 保存单词集',
  // 错误信息
  CREATE_BATCH_SUCCESS: '创建新批次成功',
  CREATE_BATCH_FAILED: '创建新批次失败',
  RESET_BATCH_FAILED: '重置批次设置失败',
  SET_WORDS_SUCCESS: '设置单词集成功',
  SET_WORDS_FAILED: '设置单词集失败',
  GET_BATCH_LIST_FAILED: '获取批次列表失败',
  GET_WORD_LIST_FAILED: '获取单词列表失败',
  NETWORK_ERROR: '获取批次列表失败，请检查网络连接',
} as const;

/**
 * 墨耕斋-批次设置页面
 * 
 * 功能说明：
 * 1. 左侧显示批次列表，支持创建新批次
 * 2. 右侧显示单词选择区域，支持筛选和批量选择
 * 3. 支持为批次设置单词集
 * 4. 支持开始学习批次
 * 
 * 主要特性：
 * - 左右分栏布局
 * - 批次状态管理
 * - 单词筛选和选择
 * - 键盘快捷键支持
 * - 响应式设计
 * 
 * 使用说明：
 * 1. 点击"新建批次"按钮创建新批次
 * 2. 点击"设置单词集"按钮为批次选择单词
 * 3. 在右侧使用筛选功能查找单词
 * 4. 使用全选或单独选择单词
 * 5. 点击"保存"按钮或使用Ctrl/Cmd+Enter快捷键保存
 * 6. 点击"开始学习"按钮开始学习批次
 * 
 * 快捷键：
 * - Ctrl/Cmd + Enter: 保存单词集
 */
export default function BatchesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [batchList, setBatchList] = useState<BatchRecord[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [wordList, setWordList] = useState<WordItem[]>([]);
  const [filteredWordList, setFilteredWordList] = useState<WordItem[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [wordLoading, setWordLoading] = useState(false);
  const [viewWordsModal, setViewWordsModal] = useState<{ 
    visible: boolean; 
    words: { word: string; is_memorized: boolean }[]; 
    batchNo: string | number 
  }>({ visible: false, words: [], batchNo: '' });

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50
  });

  // 获取批次列表
  const fetchBatchList = async () => {
    setLoading(true);
    try {
      console.log('开始获取批次列表');
      const response = await studyApi.getBatchList();
      console.log('获取批次列表响应:', response);
      if (response.data.code === 0) {
        setBatchList(response.data.data);
        console.log('设置批次列表:', response.data.data);
      } else {
        message.error(response.data.message || TEXT.GET_BATCH_LIST_FAILED);
      }
    } catch (error) {
      console.error(TEXT.GET_BATCH_LIST_FAILED, error);
      message.error(TEXT.NETWORK_ERROR);
      // 如果是网络错误，可以在这里添加重试逻辑
    } finally {
      setLoading(false);
    }
  };

  // 创建新批次
  const handleCreateBatch = async () => {
    try {
      console.log('开始创建新批次');
      const response = await studyApi.createBatch();
      console.log('创建新批次响应:', response);
              if (response.data.code === 0) {
          message.success({
            content: TEXT.CREATE_BATCH_SUCCESS,
            style: { color: 'var(--color-primary-dark, #4b3a1e)' },
            className: 'custom-success-message'
          });
          // 延迟刷新，让用户看到成功消息
          setTimeout(() => {
            fetchBatchList();
          }, 500);
        } else {
        message.error(response.data.message || TEXT.CREATE_BATCH_FAILED);
      }
    } catch (error) {
      console.error(TEXT.CREATE_BATCH_FAILED, error);
      message.error(TEXT.CREATE_BATCH_FAILED);
    }
  };

  // 重置批次设置
  const handleResetBatch = async (batchId: number) => {
    Modal.confirm({
      title: TEXT.CONFIRM_START,
      content: TEXT.CONFIRM_START_CONTENT,
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
          console.log('开始重置批次设置, batchId:', batchId);
          const response = await studyApi.resetBatchStatus(batchId);
          console.log('重置批次设置响应:', response);
          if (response.data.code === 0) {
            router.push(`/study/battle/battle?batch_id=${batchId}`);
          } else {
            message.error(response.data.message || TEXT.RESET_BATCH_FAILED);
          }
        } catch (error) {
          console.error(TEXT.RESET_BATCH_FAILED, error);
          message.error(TEXT.RESET_BATCH_FAILED);
        }
      },
    });
  };

  // 设置单词集
  const handleSetWords = async () => {
    if (!selectedBatchId) {
      message.warning({
        content: TEXT.PLEASE_SELECT_BATCH,
        style: { color: 'var(--color-primary-dark, #4b3a1e)' }
      });
      return;
    }
    
    if (selectedWords.length === 0) {
      message.warning({
        content: TEXT.PLEASE_SELECT_WORDS,
        style: { color: 'var(--color-primary-dark, #4b3a1e)' }
      });
      return;
    }

    if (selectedWords.length > 100) {
      message.warning({
        content: TEXT.TOO_MANY_WORDS,
        style: { color: 'var(--color-primary-dark, #4b3a1e)' }
      });
      return;
    }

    Modal.confirm({
      title: TEXT.CONFIRM_SET_WORDS,
      content: TEXT.CONFIRM_SET_WORDS_CONTENT(selectedWords.length),
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
          console.log('开始设置单词集, batchId:', selectedBatchId, 'words:', selectedWords);
          const params: SetWordsParams = {
            id: selectedBatchId,
            words: selectedWords.map(word => ({
              word: word,
              is_memorized: false
            })),
          };
          const response = await studyApi.setBatchWords(params);
          console.log('设置单词集响应:', response);
          if (response.data.code === 0) {
            message.success({
              content: TEXT.SET_WORDS_SUCCESS,
              style: { color: 'var(--color-primary-dark, #4b3a1e)' },
              className: 'custom-success-message'
            });
            setSelectedBatchId(null);
            setSelectedWords([]);
            setFilteredWordList([]);
            fetchBatchList();
          } else {
            message.error(response.data.message || TEXT.SET_WORDS_FAILED);
          }
        } catch (error) {
          console.error(TEXT.SET_WORDS_FAILED, error);
          message.error(TEXT.SET_WORDS_FAILED);
        }
      },
    });
  };

  // 获取单词列表
  const fetchWordList = async () => {
    setWordLoading(true);
    try {
      console.log('开始获取单词列表');
      const response = await studyApi.getUserWordList();
      console.log('获取单词列表响应:', response);
      if (response.data.code === 0) {
        if (Array.isArray(response.data.data)) {
          setWordList(response.data.data);
          setFilteredWordList(response.data.data);
          console.log('设置单词列表:', response.data.data);
        } else {
          console.error('单词列表数据格式错误:', response.data.data);
          message.error('单词列表数据格式错误');
        }
      } else {
        message.error(response.data.message || TEXT.GET_WORD_LIST_FAILED);
      }
    } catch (error) {
      console.error(TEXT.GET_WORD_LIST_FAILED, error);
      message.error(TEXT.GET_WORD_LIST_FAILED);
    } finally {
      setWordLoading(false);
    }
  };

  // 处理筛选变化
  const handleFilterChange = (filters: { 
    keyword: string; 
    selectedTags: string[];
    tagFilterMode: 'or' | 'and';
  }) => {
    const { keyword, selectedTags, tagFilterMode } = filters;
    
    // 如果没有单词数据，直接返回
    if (!wordList || wordList.length === 0) {
      setFilteredWordList([]);
      return;
    }
    
    try {
      const filtered = wordList.filter(word => {
        // 关键词筛选
        const keywordMatch = !keyword || 
          (word as any).unmask_word?.toLowerCase().includes(keyword.toLowerCase()) ||
          word.explanation.toLowerCase().includes(keyword.toLowerCase());
        
        // 标签筛选
        const tagMatch = selectedTags.length === 0 || 
          (tagFilterMode === 'and'
            ? selectedTags.every(tag => word.flags?.includes(tag))
            : selectedTags.some(tag => word.flags?.includes(tag)));
        
        return keywordMatch && tagMatch;
      });
      
      setFilteredWordList(filtered);
    } catch (error) {
      console.error('筛选单词时发生错误:', error);
      message.error('筛选单词时发生错误');
      setFilteredWordList([]);
    }
  };

  // 处理全选
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allUnmaskWords = filteredWordList.map(word => (word as any).unmask_word || word.word);
      setSelectedWords(allUnmaskWords);
    } else {
      setSelectedWords([]);
    }
  }, [filteredWordList]);

  // 处理单词选择
  const handleWordSelection = useCallback((unmask_word: string, checked: boolean) => {
    if (checked) {
      setSelectedWords(prev => [...prev, unmask_word]);
    } else {
      setSelectedWords(prev => prev.filter(w => w !== unmask_word));
    }
  }, []);

  // 处理设置单词集按钮点击
  const handleSetWordsClick = useCallback((batchId: number) => {
    setSelectedBatchId(batchId);
    setSelectedWords([]); // 清空之前的选择
    setFilteredWordList([]); // 清空过滤后的列表
    // 添加一些视觉反馈
    const loadingMsgKey = 'wordListLoading';
    message.info({ 
      content: '正在加载单词列表...', 
      key: loadingMsgKey, 
      duration: 0,
      style: { color: 'var(--color-primary-dark, #4b3a1e)' }
    });
    fetchWordList().finally(() => {
      message.destroy(loadingMsgKey);
    });
  }, []);

  // 打开弹窗
  const handleViewWords = (batch: BatchRecord) => {
    // 直接使用batch.words对象数组，包含word和is_memorized信息
    setViewWordsModal({ visible: true, words: batch.words || [], batchNo: batch.batch_no });
  };
  // 关闭弹窗
  const handleCloseViewWords = () => {
    setViewWordsModal({ visible: false, words: [], batchNo: '' });
  };

  // 下载批次单词Excel文件
  const handleDownloadWords = async (batchId: number) => {
    try {
      console.log('开始下载批次单词Excel文件, batchId:', batchId);
      const response = await studyApi.downloadWordsInBatch(batchId);
      
      // 创建下载链接
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 从批次列表中找到对应的批次号
      const batch = batchList.find(b => b.id === batchId);
      const fileName = batch ? `批次${batch.batch_no}_单词列表.xlsx` : `批次${batchId}_单词列表.xlsx`;
      link.download = fileName;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success({
        content: '下载成功',
        style: { color: 'var(--color-primary-dark, #4b3a1e)' }
      });
    } catch (error) {
      console.error('下载批次单词Excel文件失败:', error);
      message.error('下载失败，请稍后重试');
    }
  };

  useEffect(() => {
    fetchBatchList();
  }, []);

  // 性能监控
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      console.log(`批次设置页面渲染耗时: ${endTime - startTime}ms`);
    };
  }, []);

  // 添加键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Enter 保存单词集
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (selectedBatchId && selectedWords.length > 0) {
          event.preventDefault();
          handleSetWords();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedBatchId, selectedWords]);

  // 检测网络状态
  useEffect(() => {
    const handleOnline = () => {
      message.success({
        content: '网络连接已恢复',
        style: { color: 'var(--color-primary-dark, #4b3a1e)' }
      });
      // 可以在这里重新加载数据
    };

    const handleOffline = () => {
      message.warning({
        content: '网络连接已断开',
        style: { color: 'var(--color-primary-dark, #4b3a1e)' }
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 计算全选状态
  const allSelected = filteredWordList.length > 0 && selectedWords.length === filteredWordList.length;
  const indeterminate = selectedWords.length > 0 && selectedWords.length < filteredWordList.length;

  // 使用useMemo优化表格列定义
  const wordColumns = useMemo(() => [
    {
      title: (
        <Checkbox
          checked={allSelected}
          indeterminate={indeterminate}
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          全选
        </Checkbox>
      ),
      dataIndex: 'unmask_word',
      key: 'wordCheckbox',
      width: 80,
      render: (_: any, record: any) => (
        <Checkbox 
          checked={selectedWords.includes(record.unmask_word)}
          onChange={(e) => handleWordSelection(record.unmask_word, e.target.checked)}
        />
      ),
      fixed: 'left' as const,
    },
    {
      title: '单词',
      dataIndex: 'word',
      key: 'word',
      width: 70,
      render: (text: string, record: any) => (
        <Button type="link" onClick={() => router.push(`/study/word_bank/detail?word=${record.unmask_word}&from=/study/battle`)}>
          {text}
        </Button>
      ),
    },
    {
      title: '中文释义',
      dataIndex: 'explanation',
      key: 'explanation',
      width: 260,
      ellipsis: true,
      render: (text: string, record: any) => (
        <Tooltip placement="topLeft" title={text}>
          <Button type="link" onClick={() => router.push(`/study/word_bank/detail?word=${record.unmask_word}&from=/study/battle`)}>
            <span>{text}</span>
          </Button>
        </Tooltip>
      ),
    },
    {
      title: '标签',
      dataIndex: 'flags',
      key: 'flags',
      width: 140,
      render: (flags: string[], record: any) => {
        if (!flags || flags.length === 0) return '-';
        return (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {flags.map((flag, i) => (
              <Tag key={i} className="primaryTag">{flag}</Tag>
            ))}
          </div>
        );
      },
      onCell: (record: any) => ({
        onClick: () => {
          router.push(`/study/word_bank/detail?word=${record.unmask_word}&from=/study/battle`);
        },
        style: { cursor: 'pointer' }
      })
    },
  ], [allSelected, indeterminate, selectedWords, handleSelectAll, handleWordSelection]);

  return (
    <>
      <div className={styles.breadcrumbWrapper}>
        <Breadcrumb className={styles.breadcrumb} />
      </div>
      <div className={styles.container}>
        <div className={styles.batchCard}>
          <Card 
            title={TEXT.BATCH_LIST} 
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                shape="circle"
                onClick={handleCreateBatch}
                loading={loading}
                data-testid="create-batch-btn"
              />
            }
            className={styles.batchCard}
          >
            <div className={styles.batchList}>
              {batchList.map((batch) => (
                <div key={batch.id} className={`${styles.batchItem} ${selectedBatchId === batch.id ? styles.selected : ''}`}>
                  <div className={styles.batchInfo}>
                    <div className={styles.batchHeader}>
                      <span className={styles.batchNo}>
                        {batch.batch_no.startsWith('HW') ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            marginRight: 4
                          }}>
                            <span style={{
                              display: 'inline-flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: 'var(--color-primary-bg, #f8f5ec)',
                              border: '1px solid var(--color-primary, #bfa76a)',
                              color: 'var(--color-primary, #bfa76a)',
                              fontWeight: 700,
                              fontSize: 14,
                              marginRight: 2
                            }}>
                              淬
                            </span>
                            {batch.batch_no}
                          </span>
                        ) : batch.batch_no.startsWith('IW') ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            marginRight: 4
                          }}>
                            <span style={{
                              display: 'inline-flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: 'var(--color-primary-bg, #f8f5ec)',
                              border: '1px solid var(--color-primary, #bfa76a)',
                              color: 'var(--color-primary, #bfa76a)',
                              fontWeight: 700,
                              fontSize: 14,
                              marginRight: 2
                            }}>
                              错
                            </span>
                            {batch.batch_no}
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            marginRight: 4
                          }}>
                            <span style={{
                              display: 'inline-flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: 'var(--color-primary-bg, #f8f5ec)',
                              border: '1px solid var(--color-primary, #bfa76a)',
                              color: 'var(--color-primary, #bfa76a)',
                              fontWeight: 700,
                              fontSize: 14,
                              marginRight: 2
                            }}>
                              普
                            </span>
                            {batch.batch_no}
                          </span>
                        )}
                      </span>
                      <span className={`${styles.status} ${batch.is_finished ? styles.finished : styles.unfinished}`}>
                        {batch.is_finished ? TEXT.FINISHED : TEXT.UNFINISHED}
                      </span>
                    </div>
                    <div className={styles.batchDetails}>
                      <span>{TEXT.WORD_COUNT}: {batch.word_count}</span>
                    </div>
                  </div>
                  <div className={styles.batchActions}>
                    {(batch.words && batch.words.length > 0) ? (
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => handleViewWords(batch)}
                        type="link"
                        style={{ padding: 0 }}
                      >
                        查看单词
                      </Button>
                    ) : (
                      <Button
                        type="link"
                        icon={<SettingOutlined />}
                        disabled={batch.word_count > 0}
                        onClick={() => handleSetWordsClick(batch.id)}
                      >
                        {TEXT.SET_WORDS}
                      </Button>
                    )}
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      disabled={batch.word_count === 0}
                      onClick={() => handleResetBatch(batch.id)}
                    >
                      {TEXT.START_LEARNING}
                    </Button>
                  </div>
                </div>
              ))}
              {batchList.length === 0 && !loading && (
                <div className={styles.emptyState}>
                  {TEXT.NO_BATCHES}
                </div>
              )}
              {loading && (
                <div className={styles.emptyState}>
                  <Skeleton active paragraph={{ rows: 3 }} />
                  <div style={{ textAlign: 'center', color: '#999', marginTop: 16 }}>
                    {TEXT.LOADING}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
        <div className={styles.wordCard}>
          {selectedBatchId ? (
            <Card title={TEXT.SET_WORDS} className={styles.wordCard}>
              <WordFilter onFilterChange={handleFilterChange} />
              <div className={styles.wordList}>
                <Table
                  columns={wordColumns}
                  dataSource={filteredWordList}
                  loading={wordLoading}
                  rowKey="id"
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => TEXT.TOTAL_RECORDS(total),
                    pageSizeOptions: ['50', '100', '200', '500'],
                    onChange: (page, pageSize) => {
                      setPagination({ current: page, pageSize });
                    },
                    onShowSizeChange: (current, size) => {
                      setPagination({ current, pageSize: size });
                    }
                  }}
                  scroll={{ x: 636, y: 400 }}
                  tableLayout="fixed"
                  locale={{
                    emptyText: wordLoading ? TEXT.LOADING : TEXT.NO_WORDS
                  }}
                  aria-label="单词选择表格"
                  data-testid="word-selection-table"
                />
              </div>
              <div className={styles.saveButton}>
                <Tooltip title={TEXT.SHORTCUT_HINT}>
                  <Button 
                    type="primary" 
                    onClick={handleSetWords}
                    disabled={selectedWords.length === 0}
                    data-testid="save-words-btn"
                  >
                    {TEXT.SAVE_WORDS(selectedWords.length)}
                  </Button>
                </Tooltip>
              </div>
            </Card>
          ) : (
            <Card className={styles.emptyCard}>
              <div className={styles.emptyState}>
                {TEXT.SELECT_BATCH}
              </div>
            </Card>
          )}
        </div>
      </div>
      {/* 批次单词弹窗 */}
      {viewWordsModal.visible && (
        <Modal
          open={viewWordsModal.visible}
          title={`批次${viewWordsModal.batchNo} 已设置单词（共${viewWordsModal.words.length}个）`}
          footer={
            <Space>
              <Button 
                icon={<DownloadOutlined />}
                onClick={() => {
                  const batch = batchList.find(b => b.batch_no === viewWordsModal.batchNo);
                  if (batch) {
                    handleDownloadWords(batch.id);
                  }
                }}
                style={{
                  background: 'var(--color-primary, #bfa76a)',
                  borderColor: 'var(--color-primary, #bfa76a)',
                  color: '#fff'
                }}
              >
                下载
              </Button>
              <Button 
                onClick={handleCloseViewWords}
                style={{
                  color: '#4b3a1e',
                  borderColor: '#e0e0e0',
                  background: '#fff'
                }}
              >
                关闭
              </Button>
            </Space>
          }
          width={500}
          bodyStyle={{ padding: 0, maxHeight: 650, overflow: 'auto' }}
          onCancel={handleCloseViewWords}
        >
          <Table
            columns={[
              { 
                title: '单词', 
                dataIndex: 'word', 
                key: 'word', 
                align: 'center',
                width: 150
              },
              { 
                title: '背词状态', 
                dataIndex: 'is_memorized', 
                key: 'is_memorized', 
                align: 'center',
                width: 100,
                render: (is_memorized: boolean) => (
                  <Tag 
                    style={{
                      color: 'var(--color-primary-dark, #4b3a1e)',
                      borderColor: 'var(--color-primary, #bfa76a)',
                      background: is_memorized ? 'var(--color-primary, #bfa76a)' : 'var(--color-primary-bg, #f8f5ec)',
                      fontWeight: 'bold',
                      borderRadius: '4px'
                    }}
                  >
                    {is_memorized ? '已背' : '未背'}
                  </Tag>
                )
              }
            ]}
            dataSource={viewWordsModal.words.map((item, i) => ({ 
              key: i, 
              word: item.word, 
              is_memorized: item.is_memorized 
            }))}
            rowKey="key"
            pagination={{ pageSize: 50 }}
            showHeader={true}
            bordered={false}
            size="middle"
            scroll={{ y: 550 }}
          />
        </Modal>
      )}
    </>
  );
} 