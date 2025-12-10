'use client';

import React, { useEffect, useState } from 'react';
import styles from './index.module.css';

interface ResultAnimationProps {
  visible: boolean;
  type: 'slain' | 'correct';
  onAnimationEnd: () => void;
}

const ResultAnimation: React.FC<ResultAnimationProps> = ({
  visible,
  type,
  onAnimationEnd
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
      // 动画持续2秒后结束
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onAnimationEnd();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, onAnimationEnd, type]);

  if (!visible || !isAnimating) {
    return null;
  }

  if (type === 'correct') {
    return (
      <div className={styles.overlay}>
        <div className={styles.emojiContainer}>
          <div className={styles.emojiThumb}>👍</div>
          <div className={styles.emojiText}>『 正确 』</div>
        </div>
      </div>
    );
  }

  // “已斩”动画同样用圆形徽章风格
  if (type === 'slain') {
    return (
      <div className={styles.overlay}>
        <div className={styles.emojiContainer}>
          <div className={styles.emojiThumb}>⚔️</div>
          <div className={styles.emojiText}>『 已斩 』</div>
        </div>
      </div>
    );
  }

  return null;
};

export default ResultAnimation; 