'use client';

import React, { useState } from 'react';
import { Modal, Image, message } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import styles from './index.module.css';

export interface AwardItem {
  award_type: number;
  award_name: string;
  image_path: string;
  video_path?: string;
}

interface RewardModalProps {
  visible: boolean;
  awards: AwardItem[];
  onClose: () => void;
}

const RewardModal: React.FC<RewardModalProps> = ({
  visible,
  awards,
  onClose
}) => {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const handleImageClick = (award: AwardItem) => {
    if (award.video_path) {
      setPlayingVideo(award.award_name);
      console.log('播放视频:', award.video_path);
    }
  };

  // 添加触摸事件处理，确保iPad兼容性
  const handleImageTouch = (award: AwardItem, e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (award.video_path) {
      setPlayingVideo(award.award_name);
      console.log('触摸播放视频:', award.video_path);
    }
  };

  const handleVideoEnd = () => {
    setPlayingVideo(null);
  };

  const getAwardTypeLabel = (awardType: number) => {
    const typeLabels: Record<number, string> = {
      1: '珍宝',
      2: '秘籍', 
      3: '宝剑',
      4: '盔甲'
    };
    return typeLabels[awardType] || `类型${awardType}`;
  };

  // 固定弹窗宽度，纵向排列奖品
  const modalWidth = 700;

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <span>🎉 恭喜获得奖品！</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={modalWidth}
      className={styles.rewardModal}
      destroyOnClose
      maskClosable={true}
      keyboard={true}
      closeIcon={null}
      closable={false}
    >
      <div className={styles.rewardContent}>
        {awards
          .sort((a, b) => b.award_type - a.award_type) // 按类型倒序排列
          .map((award, index) => (
          <div key={index} className={styles.rewardItem}>
            <div className={styles.rewardHeader}>
              <span className={styles.rewardType}>{getAwardTypeLabel(award.award_type)}</span>
              <span className={styles.rewardName}>{award.award_name}</span>
            </div>
            <div className={styles.rewardImageContainer}>
              <Image
                src={award.image_path}
                alt={award.award_name}
                className={styles.rewardImage}
                onClick={() => handleImageClick(award)}
                onTouchStart={(e) => handleImageTouch(award, e)}
                onTouchEnd={(e) => handleImageTouch(award, e)}
                preview={false}
              />
              {award.video_path && (
                <div className={styles.videoIndicator}>
                  <PlayCircleOutlined />
                  <span>点击播放</span>
                </div>
              )}
              {/* 添加透明的触摸覆盖层，确保iPad上的点击体验 */}
              {award.video_path && (
                <div 
                  className={styles.touchOverlay}
                  onClick={() => handleImageClick(award)}
                  onTouchStart={(e) => handleImageTouch(award, e)}
                  onTouchEnd={(e) => handleImageTouch(award, e)}
                />
              )}
            </div>
            <div className={styles.divider} />
          </div>
        ))}
      </div>
      
      {/* 视频播放区域 */}
      {playingVideo && (
        <div className={styles.videoPlayer}>
          <video
            src={awards.find(a => a.award_name === playingVideo)?.video_path}
            controls
            autoPlay
            playsInline
            onEnded={handleVideoEnd}
            onError={(e) => {
              console.error('视频播放错误:', e);
              message.error('视频播放失败，请重试');
            }}
            className={styles.video}
          />
        </div>
      )}
      
      {/* 自定义关闭按钮，确保在iPad上正常工作 */}
      <div 
        className={styles.customCloseButton}
        onClick={onClose}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      >
        <span>✕</span>
      </div>
    </Modal>
  );
};

export default RewardModal; 