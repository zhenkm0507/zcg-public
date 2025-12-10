'use client';

import React from 'react';
import { Progress } from 'antd';
import styles from './index.module.css';
import { motion, AnimatePresence } from 'framer-motion';

interface StudyHeaderProps {
  reciteProgress: number;
  slainProgress: number;
  streak: number;
  reciteNumerator: number;
  reciteDenominator: number;
  slainNumerator: number;
  slainDenominator: number;
}

const StudyHeader: React.FC<StudyHeaderProps> = ({ reciteProgress, slainProgress, streak, reciteNumerator, reciteDenominator, slainNumerator, slainDenominator }) => {
  return (
    <div className={styles.header}>
      <div className={styles.progressContainer}>
        <div className={styles.progressItem}>
          <span className={styles.label}>背词进度</span>
          <Progress
            percent={reciteProgress}
            size="small"
            strokeColor="#1890ff"
            format={percent => (
              <span className={styles.percentBox}>
                <span className={styles.percent} style={{ color: '#1890ff' }}>
                  {percent?.toFixed(1)}%
                </span>
                <span className={styles.fraction}>(
                  {reciteNumerator}/{reciteDenominator}
                )</span>
              </span>
            )}
          />
        </div>
        <div className={styles.progressItem}>
          <span className={styles.label}>斩杀进度</span>
          <Progress
            percent={slainProgress}
            size="small"
            strokeColor="#52c41a"
            format={percent => (
              <span className={styles.percentBox}>
                <span className={styles.percent} style={{ color: '#52c41a' }}>
                  {percent?.toFixed(1)}%
                </span>
                <span className={styles.fraction}>(
                  {slainNumerator}/{slainDenominator}
                )</span>
              </span>
            )}
          />
        </div>
      </div>
      <div className={styles.streak}>
        <span className={styles.streakLabel}>连击数</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={streak}
            className={styles.streakValue}
            initial={{ scale: 1.5, color: '#ff4d4f' }}
            animate={{ scale: 1, color: '#ff4d4f' }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            {streak}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudyHeader; 