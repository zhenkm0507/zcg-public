'use client';

import React from 'react';
import CacheMonitor from '@/components/CacheMonitor';
import styles from './page.module.css';

const CachePage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>缓存监控</h1>
        <p>监控和管理应用的媒体文件缓存，包括音视频、图片等静态资源</p>
      </div>
      
      <CacheMonitor />
    </div>
  );
};

export default CachePage; 