'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Space, Modal, message, Tooltip, Progress } from 'antd';
import { 
  ReloadOutlined, 
  DeleteOutlined, 
  SyncOutlined, 
  InfoCircleOutlined,
  ClockCircleOutlined,
  FileOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import styles from './index.module.css';
import { 
  getCacheInfo, 
  getMediaFilesInfo, 
  clearAllCaches, 
  clearCategoryCache,
  forceUpdateFile,
  forceUpdateCategory,
  formatFileSize,
  formatUpdateInterval,
  type CacheInfo,
  type MediaFileInfo,
  CACHE_CONFIG
} from '../../utils/cacheManager';

const CacheMonitor: React.FC = () => {
  const [cacheInfos, setCacheInfos] = useState<CacheInfo[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // 类别图标映射
  const categoryIcons = {
    audios: <AudioOutlined />,
    videos: <VideoCameraOutlined />,
    images: <PictureOutlined />,
    icons: <AppstoreOutlined />,
    root: <FileOutlined />,
    unknown: <FileOutlined />
  };

  // 类别名称映射
  const categoryNames = {
    audios: '音频文件',
    videos: '视频文件', 
    images: '图片文件',
    icons: '图标文件',
    root: '根目录文件',
    unknown: '未知文件'
  };

  // 加载缓存信息
  const loadCacheInfo = async () => {
    setLoading(true);
    try {
      const [infos, files] = await Promise.all([
        getCacheInfo(),
        getMediaFilesInfo()
      ]);
      
      setCacheInfos(infos);
      setMediaFiles(files);
      
      // 计算统计信息
      const totalSize = infos.reduce((sum, cache) => sum + cache.size, 0);
      const totalFiles = files.length;
      
      const categoryStats = files.reduce((stats, file) => {
        if (!stats[file.category]) {
          stats[file.category] = {
            count: 0,
            size: 0,
            needsUpdate: 0
          };
        }
        stats[file.category].count++;
        stats[file.category].size += file.size;
        if (file.needsUpdate) {
          stats[file.category].needsUpdate++;
        }
        return stats;
      }, {} as Record<string, { count: number; size: number; needsUpdate: number }>);

      setStats({
        totalSize,
        totalFiles,
        categoryStats,
        cacheCount: infos.length
      });
      
    } catch (error) {
      console.error('加载缓存信息失败:', error);
      message.error('加载缓存信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCacheInfo();
  }, []);

  // 清理所有缓存
  const handleClearAll = async () => {
    Modal.confirm({
      title: '确认清理所有缓存',
      content: '这将删除所有缓存的媒体文件，下次访问时需要重新下载。确定要继续吗？',
      onOk: async () => {
        try {
          await clearAllCaches();
          message.success('所有缓存已清理');
          loadCacheInfo();
        } catch (error) {
          console.error('清理缓存失败:', error);
          message.error('清理缓存失败');
        }
      }
    });
  };

  // 清理特定类别缓存
  const handleClearCategory = async (category: string) => {
    const categoryName = categoryNames[category as keyof typeof categoryNames] || category;
    Modal.confirm({
      title: `确认清理${categoryName}缓存`,
      content: `这将删除所有${categoryName}的缓存文件。确定要继续吗？`,
      onOk: async () => {
        try {
          await clearCategoryCache(category);
          message.success(`${categoryName}缓存已清理`);
          loadCacheInfo();
        } catch (error) {
          console.error('清理缓存失败:', error);
          message.error('清理缓存失败');
        }
      }
    });
  };

  // 强制更新特定类别
  const handleForceUpdateCategory = async (category: string) => {
    const categoryName = categoryNames[category as keyof typeof categoryNames] || category;
    try {
      const count = await forceUpdateCategory(category);
      message.success(`已请求强制更新 ${categoryName} 的 ${count} 个文件`);
      loadCacheInfo();
    } catch (error) {
      console.error('强制更新失败:', error);
      message.error('强制更新失败');
    }
  };

  // 强制更新特定文件
  const handleForceUpdateFile = async (url: string) => {
    try {
      const success = await forceUpdateFile(url);
      if (success) {
        message.success('已请求强制更新文件');
        loadCacheInfo();
      } else {
        message.error('强制更新文件失败');
      }
    } catch (error) {
      console.error('强制更新文件失败:', error);
      message.error('强制更新文件失败');
    }
  };

  // 缓存信息表格列
  const cacheColumns = [
    {
      title: '缓存名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Tag color="blue">{name}</Tag>
      )
    },
    {
      title: '文件数量',
      dataIndex: 'entries',
      key: 'entries',
      render: (entries: number) => (
        <span>{entries.toLocaleString()}</span>
      )
    },
    {
      title: '缓存大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => (
        <span>{formatFileSize(size)}</span>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: CacheInfo) => (
        <Button 
          type="link" 
          danger 
          icon={<DeleteOutlined />}
          onClick={() => handleClearAll()}
        >
          清理
        </Button>
      )
    }
  ];

  // 媒体文件表格列
  const mediaColumns = [
    {
      title: '文件路径',
      dataIndex: 'url',
      key: 'url',
      render: (url: string) => {
        const pathname = new URL(url).pathname;
        return (
          <Tooltip title={url}>
            <span className={styles.filePath}>{pathname}</span>
          </Tooltip>
        );
      }
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const icon = categoryIcons[category as keyof typeof categoryIcons] || categoryIcons.unknown;
        const name = categoryNames[category as keyof typeof categoryNames] || category;
        return (
          <Tag icon={icon} color="green">
            {name}
          </Tag>
        );
      }
    },
    {
      title: '文件大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => (
        <span>{formatFileSize(size)}</span>
      )
    },
    {
      title: '更新间隔',
      dataIndex: 'updateInterval',
      key: 'updateInterval',
      render: (interval: number) => (
        <span>{formatUpdateInterval(interval)}</span>
      )
    },
    {
      title: '最后检查',
      dataIndex: 'lastCheck',
      key: 'lastCheck',
      render: (lastCheck: number) => {
        if (lastCheck === 0) {
          return <Tag color="orange">未检查</Tag>;
        }
        const now = Date.now();
        const diff = now - lastCheck;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        let color = 'green';
        let text = '';
        
        if (days > 0) {
          text = `${days}天前`;
          color = days > 7 ? 'red' : 'orange';
        } else if (hours > 0) {
          text = `${hours}小时前`;
          color = hours > 24 ? 'orange' : 'green';
        } else {
          text = '刚刚';
          color = 'green';
        }
        
        return <Tag color={color} icon={<ClockCircleOutlined />}>{text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'needsUpdate',
      key: 'needsUpdate',
      render: (needsUpdate: boolean) => (
        <Tag color={needsUpdate ? 'red' : 'green'} icon={<SyncOutlined />}>
          {needsUpdate ? '需要更新' : '最新'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MediaFileInfo) => (
        <Space>
          <Button 
            type="link" 
            size="small"
            icon={<SyncOutlined />}
            onClick={() => handleForceUpdateFile(record.url)}
          >
            强制更新
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className={styles.cacheMonitor}>
      <Card 
        title={
          <Space>
            <InfoCircleOutlined />
            缓存监控
            <Tooltip title="监控和管理应用缓存，包括音视频、图片等媒体文件">
              <InfoCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadCacheInfo}
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={handleClearAll}
            >
              清理所有缓存
            </Button>
          </Space>
        }
      >
        {/* 统计信息 */}
        {stats && (
          <div className={styles.statsSection}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{formatFileSize(stats.totalSize)}</div>
                <div className={styles.statLabel}>总缓存大小</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.totalFiles}</div>
                <div className={styles.statLabel}>缓存文件数</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.cacheCount}</div>
                <div className={styles.statLabel}>缓存数量</div>
              </div>
            </div>
            
            {/* 类别统计 */}
            <div className={styles.categoryStats}>
              <h4>类别统计</h4>
              <div className={styles.categoryGrid}>
                {Object.entries(stats.categoryStats).map(([category, data]) => {
                  const categoryName = categoryNames[category as keyof typeof categoryNames] || category;
                  const icon = categoryIcons[category as keyof typeof categoryIcons] || categoryIcons.unknown;
                  const categoryData = data as { count: number; size: number; needsUpdate: number };
                  const updateProgress = categoryData.count > 0 ? ((categoryData.count - categoryData.needsUpdate) / categoryData.count) * 100 : 100;
                  
                  return (
                    <div key={category} className={styles.categoryCard}>
                      <div className={styles.categoryHeader}>
                        <span className={styles.categoryIcon}>{icon}</span>
                        <span className={styles.categoryName}>{categoryName}</span>
                        <Space>
                          <Button 
                            size="small" 
                            icon={<SyncOutlined />}
                            onClick={() => handleForceUpdateCategory(category)}
                          >
                            更新
                          </Button>
                          <Button 
                            size="small" 
                            danger 
                            icon={<DeleteOutlined />}
                            onClick={() => handleClearCategory(category)}
                          >
                            清理
                          </Button>
                        </Space>
                      </div>
                      <div className={styles.categoryInfo}>
                        <div>文件数: {categoryData.count}</div>
                        <div>大小: {formatFileSize(categoryData.size)}</div>
                        <div>需要更新: {categoryData.needsUpdate}</div>
                      </div>
                      <Progress 
                        percent={updateProgress} 
                        size="small" 
                        status={categoryData.needsUpdate > 0 ? 'exception' : 'success'}
                        format={() => `${categoryData.count - categoryData.needsUpdate}/${categoryData.count}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 缓存信息表格 */}
        <div className={styles.tableSection}>
          <h4>缓存信息</h4>
          <Table 
            columns={cacheColumns} 
            dataSource={cacheInfos} 
            rowKey="name"
            pagination={false}
            size="small"
          />
        </div>

        {/* 媒体文件表格 */}
        <div className={styles.tableSection}>
          <h4>媒体文件详情</h4>
          <Table 
            columns={mediaColumns} 
            dataSource={mediaFiles} 
            rowKey="url"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个文件`
            }}
            size="small"
            scroll={{ x: 1200 }}
          />
        </div>
      </Card>
    </div>
  );
};

export default CacheMonitor; 