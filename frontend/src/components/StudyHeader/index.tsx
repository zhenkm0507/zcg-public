import React from 'react';
import { Progress } from 'antd';
import { FireOutlined } from '@ant-design/icons';
import styles from './index.module.css';

interface StudyHeaderProps {
  reciteProgress: number;  // 背词进度
  slainProgress: number;   // 斩词进度
  streak: number;          // 连续正确次数
}

const StudyHeader: React.FC<StudyHeaderProps> = ({
  reciteProgress,
  slainProgress,
  streak,
}) => {
  return (
    <div className={styles.header}>
      <div className={styles.progressArea}>
        <div className={styles.progressItem}>
          <div className={styles.progressLabel}>
            <span>背词进度</span>
            <span className={styles.progressValue}>{reciteProgress}%</span>
          </div>
          <Progress percent={reciteProgress} size="small" />
        </div>
        <div className={styles.progressItem}>
          <div className={styles.progressLabel}>
            <span>斩词进度</span>
            <span className={styles.progressValue}>{slainProgress}%</span>
          </div>
          <Progress percent={slainProgress} size="small" status="active" />
        </div>
        <div className={styles.streakContainer}>
          <FireOutlined className={styles.streakIcon} />
          <span className={styles.streakText}>连续正确: {streak}</span>
        </div>
      </div>
    </div>
  );
};

export default StudyHeader; 