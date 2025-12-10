'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Radio, Button, message } from 'antd';
import { studyApi } from '@/services/study';
import styles from './index.module.css';

interface FlagSelectorModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (selectedFlag: string) => void;
}

const FlagSelectorModal: React.FC<FlagSelectorModalProps> = ({
  visible,
  onCancel,
  onConfirm,
}) => {
  const [flags, setFlags] = useState<string[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<string>('全部');
  const [loading, setLoading] = useState(false);

  // 获取标签列表
  const fetchFlags = async () => {
    setLoading(true);
    try {
      const response = await studyApi.getUserFlags();
      if (response.data.code === 0) {
        setFlags(response.data.data);
      } else {
        message.error(response.data.message || '获取标签失败');
      }
    } catch (error) {
      console.error('获取标签失败:', error);
      message.error('获取标签失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchFlags();
      setSelectedFlag('全部'); // 重置选择
    }
  }, [visible]);

  const handleConfirm = () => {
    onConfirm(selectedFlag);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Modal
      title="选择标签"
      open={visible}
      onCancel={handleCancel}
      onOk={handleConfirm}
      okText="确定"
      cancelText="取消"
      width={400}
      className={styles.modal}
    >
      <div className={styles.content}>
        <Radio.Group
          value={selectedFlag}
          onChange={(e) => setSelectedFlag(e.target.value)}
          className={styles.radioGroup}
        >
          <Radio value="全部" className={styles.radioItem}>
            全部
          </Radio>
          {flags.map((flag) => (
            <Radio key={flag} value={flag} className={styles.radioItem}>
              {flag}
            </Radio>
          ))}
        </Radio.Group>
      </div>
    </Modal>
  );
};

export default FlagSelectorModal;
