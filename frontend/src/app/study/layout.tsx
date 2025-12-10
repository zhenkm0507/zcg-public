'use client';

import styles from './layout.module.css';

export default function StudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        {children}
      </div>
    </div>
  );
} 