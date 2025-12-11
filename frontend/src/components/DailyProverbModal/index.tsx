'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button, ConfigProvider } from 'antd';
import styles from './index.module.css';

interface DailyProverbModalProps {
  visible: boolean;
  proverb: string;
  chineseExp: string;
  onClose: () => void;
}

const COUNTDOWN_SECONDS = 10;

const DailyProverbModal: React.FC<DailyProverbModalProps> = ({
  visible,
  proverb,
  chineseExp,
  onClose
}) => {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (visible) {
      setCountdown(COUNTDOWN_SECONDS);
      setCanClose(false);
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanClose(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#000',
          colorPrimaryHover: '#333',
          colorPrimaryActive: '#333',
        },
      }}
    >
      <Modal
        open={visible}
        footer={null}
        closable={false}
        maskClosable={false}
        width={500}
        centered
        className={styles.modal}
        wrapClassName={styles.modalWrap}
      >
        <div className={styles.loginPage}>
          <div className={styles.content}>
            <div className={styles.header}>
              <h2 className={styles.title}>每日一谚</h2>
              <p className={styles.subtitle}>今日智慧，与你分享</p>
            </div>
            
            <div className={styles.proverbSection}>
              <div className={styles.proverbText}>
                {proverb}
              </div>
              <div className={styles.chineseText}>
                {chineseExp}
              </div>
            </div>
            
            <div className={styles.footer}>
              <Button
                type="primary"
                size="large"
                onClick={onClose}
                className={styles.closeButton}
                disabled={!canClose}
              >
                {canClose ? '入阁' : `入阁(${countdown}s)`}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default DailyProverbModal; 