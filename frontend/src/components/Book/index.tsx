import React, { useRef } from 'react';
import styles from './index.module.css';

export interface BookProps {
  leftPage: React.ReactNode;   // 当前页内容
  rightPage: React.ReactNode;  // 下一页内容
  isFlipping: boolean;         // 是否正在翻页
  onFlipEnd?: () => void;      // 翻页动画结束回调
}

const Book: React.FC<BookProps> = ({ leftPage, rightPage, isFlipping, onFlipEnd }) => {
  const bookRef = useRef<HTMLDivElement>(null);

  // 动画结束后回调
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName === 'transform' && onFlipEnd) {
      onFlipEnd();
    }
  };

  return (
    <div className={styles.bookContainer} ref={bookRef}>
      <div
        className={
          `${styles.page} ${styles.left} ${isFlipping ? styles.flipLeft : ''}`
        }
        onTransitionEnd={handleTransitionEnd}
      >
        {leftPage}
      </div>
      <div
        className={
          `${styles.page} ${styles.right} ${isFlipping ? styles.flipRight : ''}`
        }
      >
        {rightPage}
      </div>
      <div className={styles.spine} />
    </div>
  );
};

export default Book; 