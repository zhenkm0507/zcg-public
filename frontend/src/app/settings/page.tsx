'use client';

import React, { useState } from 'react';
import { Card, message, Modal } from 'antd';
import { incentiveApi, AwardTypeInfo, AwardItem, AwardType } from '@/services/incentive';
import styles from './page.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { CSSMotionProps } from 'rc-motion';
import GuideSection from '@/app/settings/GuideSection';
import ProfileSection from './ProfileSection';
import { RESOURCE_CONFIG } from '@/config/resource';

// 抽屉菜单项类型
type DrawerItem = 'guide' | 'profile' | 'treasures' | 'manuals' | 'swords' | 'armors';

const swipeVariants = {
  enter: (custom: 'left' | 'right') => ({
    x: custom === 'left' ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (custom: 'left' | 'right') => ({
    x: custom === 'left' ? -300 : 300,
    opacity: 0,
  }),
};

const SettingsPage: React.FC = () => {
  // 初始activeDrawer为guide，页面加载时显示指南
  const [activeDrawer, setActiveDrawer] = useState<DrawerItem>('guide');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [showContent, setShowContent] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [dragX, setDragX] = useState(0);
  const dragThreshold = 60;
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const [contentAnimKey, setContentAnimKey] = useState(0);
  const [lightIntensity, setLightIntensity] = useState(0); // 光线强度控制
  const [armorState, setArmorState] = useState({ index: 0, direction: null as 'left' | 'right' | null });
  const directionRef = React.useRef<'left' | 'right' | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true); // 自动播放状态
  const autoPlayIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const [swordState, setSwordState] = useState({ index: 0, direction: null as 'left' | 'right' | null });
  const swordDirectionRef = React.useRef<'left' | 'right' | null>(null);
  const [isSwordAutoPlaying, setIsSwordAutoPlaying] = useState(true);
  const swordAutoPlayIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // 奖品数据状态
  const [awardData, setAwardData] = useState<AwardTypeInfo[]>([]);
  const [awardLoading, setAwardLoading] = useState(false);

  // 获取奖品数据
  const fetchAwardData = async () => {
    try {
      setAwardLoading(true);
      const response = await incentiveApi.getUserWordBankAwardList();
      setAwardData(response.data.data);
    } catch (error) {
      console.error('获取奖品数据失败:', error);
      message.error('获取奖品数据失败');
    } finally {
      setAwardLoading(false);
    }
  };

  // 组件加载时获取奖品数据
  React.useEffect(() => {
    fetchAwardData();
  }, []);

  // 从后端数据中获取珍宝数据
  const treasures = React.useMemo(() => {
    const treasureType = awardData.find(item => item.award_type === AwardType.TREASURE);
    return treasureType?.award_list.map(item => ({
      id: item.id,
      name: item.name,
      count: item.num,
      unlocked: item.is_unlocked,
      image: RESOURCE_CONFIG.getResourceFullUrl(item.image_path),
      description: item.description
    })) || [];
  }, [awardData]);

  // 从后端数据中获取秘籍数据
  const manuals = React.useMemo(() => {
    const manualType = awardData.find(item => item.award_type === AwardType.MANUAL);
    return manualType?.award_list.map(item => ({
      id: item.id,
      name: item.name,
      unlocked: item.is_unlocked,
      image: RESOURCE_CONFIG.getResourceFullUrl(item.image_path),
      description: item.description
    })) || [];
  }, [awardData]);

  // 从后端数据中获取宝剑数据
  const swords = React.useMemo(() => {
    const swordType = awardData.find(item => item.award_type === AwardType.SWORD);
    return swordType?.award_list.map(item => ({
      id: item.id,
      name: item.name,
      unlocked: item.is_unlocked,
      image: RESOURCE_CONFIG.getResourceFullUrl(item.image_path),
      description: item.description
    })) || [];
  }, [awardData]);

  // 从后端数据中获取盔甲数据
  const armors = React.useMemo(() => {
    const armorType = awardData.find(item => item.award_type === AwardType.ARMOR);
    return armorType?.award_list.map(item => ({
      id: item.id,
      name: item.name,
      unlocked: item.is_unlocked,
      image: RESOURCE_CONFIG.getResourceFullUrl(item.image_path),
      video: item.video_path ? RESOURCE_CONFIG.getResourceFullUrl(item.video_path) : null,
      description: item.description
    })) || [];
  }, [awardData]);

  // 抽屉菜单配置
  const drawerItems = [
    { key: 'guide', label: '指南', icon: '📖' },
    { key: 'profile', label: '资料', icon: '📋' },
    { key: 'treasures', label: '珍宝', icon: '💎' },
    { key: 'manuals', label: '秘籍', icon: '📜' },
    { key: 'swords', label: '宝剑', icon: '⚔️' },
    { key: 'armors', label: '盔甲', icon: '🛡️' }
  ];

  // 自动轮播功能
  React.useEffect(() => {
    // 仅当盔甲抽屉被激活且处于自动播放状态时，启动定时器
    if (activeDrawer === 'armors' && isAutoPlaying && armors.length > 0) {
      autoPlayIntervalRef.current = setInterval(() => {
        setArmorState(prevState => {
          const nextIndex = (prevState.index + 1) % armors.length;
          const newDirection: 'left' | 'right' = 'left'; // 自动轮播总是向左
          directionRef.current = newDirection;
          return { index: nextIndex, direction: newDirection };
        });
      }, 5000); // 每5秒切换一次
    } else {
      // 清理定时器
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
        autoPlayIntervalRef.current = null;
      }
    }

    // 组件卸载或依赖变化时，清理定时器
    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
        autoPlayIntervalRef.current = null;
      }
    };
  }, [activeDrawer, isAutoPlaying, armors.length]);

  // 当抽屉切换时，重置自动播放状态
  React.useEffect(() => {
    setIsAutoPlaying(true);
  }, [activeDrawer]);

  // 暂停自动播放
  const pauseAutoPlay = () => {
    setIsAutoPlaying(false);
  };

  // 盔甲切换函数
  const handleArmorChange = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= armors.length) {
      return;
    }
    pauseAutoPlay(); // 用户手动切换时暂停
    
    // 使用函数式更新以避免因闭包导致的状态陈旧问题
    setArmorState(prevState => {
        const newDirection: 'left' | 'right' = newIndex > prevState.index ? 'left' : 'right';
        
        // 将方向保存到 ref 中，确保动画过程中不会丢失
        directionRef.current = newDirection;
        
        const newState = { index: newIndex, direction: newDirection };
        return newState;
    });
  };

  // 宝剑自动轮播功能
  React.useEffect(() => {
    // 仅当宝剑抽屉被激活且处于自动播放状态时，启动定时器
    if (activeDrawer === 'swords' && isSwordAutoPlaying && swords.length > 0) {
      swordAutoPlayIntervalRef.current = setInterval(() => {
        setSwordState(prevState => {
          const nextIndex = (prevState.index + 1) % swords.length;
          const newDirection: 'left' | 'right' = 'left'; // 自动轮播总是向左
          swordDirectionRef.current = newDirection;
          return { index: nextIndex, direction: newDirection };
        });
      }, 5000); // 每5秒切换一次
    } else {
      // 清理定时器
      if (swordAutoPlayIntervalRef.current) {
        clearInterval(swordAutoPlayIntervalRef.current);
        swordAutoPlayIntervalRef.current = null;
      }
    }

    // 组件卸载或依赖变化时，清理定时器
    return () => {
      if (swordAutoPlayIntervalRef.current) {
        clearInterval(swordAutoPlayIntervalRef.current);
        swordAutoPlayIntervalRef.current = null;
      }
    };
  }, [activeDrawer, isSwordAutoPlaying, swords.length]);

  // 当抽屉切换时，重置宝剑自动播放状态
  React.useEffect(() => {
    setIsSwordAutoPlaying(true);
  }, [activeDrawer]);

  // 暂停宝剑自动播放
  const pauseSwordAutoPlay = () => {
    setIsSwordAutoPlaying(false);
  };

  // 宝剑切换函数
  const handleSwordChange = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= swords.length) {
      return;
    }
    pauseSwordAutoPlay(); // 用户手动切换时暂停
    
    // 使用函数式更新以避免因闭包导致的状态陈旧问题
    setSwordState(prevState => {
        const newDirection: 'left' | 'right' = newIndex > prevState.index ? 'left' : 'right';
        
        // 将方向保存到 ref 中，确保动画过程中不会丢失
        swordDirectionRef.current = newDirection;
        
        const newState = { index: newIndex, direction: newDirection };
        return newState;
    });
  };

  // 处理图片点击
  const handleImageClick = (image: string, item: any) => {
    const img = new window.Image();
    img.src = image;
    img.onload = () => {
      setSelectedImage(image);
      setSelectedItem(item);
      setImageModalVisible(true);
    };
  };

  // 处理盔甲点击
  const handleArmorClick = (armor: any) => {
    if (armor.unlocked) {
      setSelectedImage(armor.image);
      setSelectedItem(armor);
      setImageModalVisible(true);
    }
  };

  // 统一菜单项切换内容区逻辑，兼容所有方案
  const handleDrawerClick = (key: DrawerItem) => {
    if (activeDrawer === key) return;
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    setActiveDrawer(key);
    setShowContent(true);
    // 重置光线强度，开始新的光线渐变动画
    setLightIntensity(0);
  };

  // 页面初始时显示内容区
  React.useEffect(() => {
    setTimeout(() => setShowContent(true), 50);
  }, []);

  // 渲染主内容区
  const renderMainContent = () => {
    switch (activeDrawer) {
      case 'guide':
        return <GuideSection />;
      case 'profile':
        return <ProfileSection />;
      case 'treasures':
        return renderTreasures();
      case 'manuals':
        return renderManuals();
      case 'swords':
        return renderSwords();
      case 'armors':
        return renderArmors();
      default:
        return <GuideSection />;
    }
  };

  // 渲染珍宝
  const renderTreasures = () => (
    <div className={styles.treasuresContent}>
      {awardLoading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>加载中...</div>
        </div>
      ) : treasures.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>暂无珍宝数据</div>
        </div>
      ) : (
        <div className={styles.treasuresGrid}>
          {treasures.map(treasure => {
            const isUnlocked = treasure.unlocked;
            return (
              <div 
                key={treasure.id} 
                className={`${styles.treasureItem} ${!isUnlocked ? styles.locked : ''} ${!isUnlocked ? 'locked-equipment' : ''}`}
                onClick={() => isUnlocked && handleImageClick(treasure.image, treasure)}
              >
                <div className={styles.treasureImage}>
                  <img 
                    src={treasure.image} 
                    alt={treasure.name} 
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      WebkitTouchCallout: 'none',
                      pointerEvents: isUnlocked ? 'auto' : 'none'
                    }}
                    draggable={false}
                  />
                </div>
                <div className={styles.treasureInfo}>
                  <h3>{treasure.name} <span className={styles.treasureCount}>(x {treasure.count})</span></h3>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // 渲染秘籍
  const renderManuals = () => (
    <div className={styles.manualsContent}>
      {awardLoading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>加载中...</div>
        </div>
      ) : manuals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>暂无秘籍数据</div>
        </div>
      ) : (
        <div className={styles.manualsGrid}>
          {manuals.map(manual => (
            <div 
              key={manual.id} 
              className={`${styles.manualItem} ${!manual.unlocked ? styles.locked : ''} ${!manual.unlocked ? 'locked-equipment' : ''}`}
              onClick={() => manual.unlocked && handleImageClick(manual.image, manual)}
            >
              <div className={styles.manualImage}>
                <img 
                  src={manual.image} 
                  alt={manual.name} 
                  style={{
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    pointerEvents: manual.unlocked ? 'auto' : 'none'
                  }}
                  draggable={false}
                />
              </div>
              <div className={styles.manualInfo}>
                <h3>{manual.name}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // 渲染宝剑
  const renderSwords = () => {
    if (awardLoading) {
      return (
        <div className={styles.armorDisplayContainer}>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div>加载中...</div>
          </div>
        </div>
      );
    }

    if (swords.length === 0) {
      return (
        <div className={styles.armorDisplayContainer}>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div>暂无宝剑数据</div>
          </div>
        </div>
      );
    }

    const sword = swords[swordState.index];
    if (!sword) return null;

    // 使用 ref 中的方向值，如果为空则使用状态中的值
    const currentDirection = swordDirectionRef.current || swordState.direction;

    return (
      <div className={styles.armorDisplayContainer}>
        <AnimatePresence initial={false} mode="wait" custom={currentDirection}>
          <motion.div
            key={swordState.index}
            className={`${styles.armorCard} ${!sword.unlocked ? 'locked-equipment' : ''}`}
            custom={currentDirection}
            variants={swipeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onClick={() => {
              if (sword.unlocked) {
                handleImageClick(sword.image, sword);
              }
            }}
            onAnimationComplete={() => {
              // 动画完成后清除 ref 中的方向
              swordDirectionRef.current = null;
            }}
            onDragStart={() => {
              pauseSwordAutoPlay(); // 开始拖拽时暂停
            }}
            onDragEnd={(e: any, info: any) => {
              const swipe = Math.abs(info.offset.x) * info.velocity.x;
              if (swipe < -10000) {
                handleSwordChange(swordState.index + 1);
              } else if (swipe > 10000) {
                handleSwordChange(swordState.index - 1);
              }
            }}
          >
            <div className={styles.armorImageContainer}>
              <img 
                src={sword.image} 
                alt={sword.name} 
                className={`${styles.armorDetailImage} ${!sword.unlocked ? styles.locked : ''}`}
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                  pointerEvents: sword.unlocked ? 'auto' : 'none'
                }}
                draggable={false}
              />
              {!sword.unlocked && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 60% 40%, rgba(40,40,40,0.25) 0%, rgba(20,20,20,0.45) 80%, rgba(10,10,10,0.65) 100%)',
                    backdropFilter: 'blur(4px) saturate(0.6)',
                    borderRadius: '12px',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}
                />
              )}
            </div>
            <div className={styles.armorInfoContainer}>
              <h2 className={styles.armorName} style={{ color: !sword.unlocked ? '#8a8a8a' : undefined, opacity: !sword.unlocked ? 0.7 : undefined }}>
                {sword.name}
              </h2>
              <p className={styles.armorDescription} style={{ color: !sword.unlocked ? '#8a8a8a' : undefined, opacity: !sword.unlocked ? 0.7 : undefined }}>
                {sword.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className={styles.armorNavDots}>
          {swords.map((_, index) => {
            if (index === swordState.index) {
              return (
                <div
                  key={index}
                  className={`${styles.dot} ${swordState.index === index ? styles.activeDot : ''}`}
                />
              );
            }
            return (
              <div
                key={index}
                className={`${styles.dot}`}
                onClick={() => {
                  handleSwordChange(index);
                }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  // 渲染盔甲
  const renderArmors = () => {
    if (awardLoading) {
      return (
        <div className={styles.armorDisplayContainer}>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div>加载中...</div>
          </div>
        </div>
      );
    }

    if (armors.length === 0) {
      return (
        <div className={styles.armorDisplayContainer}>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div>暂无盔甲数据</div>
          </div>
        </div>
      );
    }

    const armor = armors[armorState.index];
    if (!armor) return null;

    // 使用 ref 中的方向值，如果为空则使用状态中的值
    const currentDirection = directionRef.current || armorState.direction;

    return (
      <div className={styles.armorDisplayContainer}>
        <AnimatePresence initial={false} mode="wait" custom={currentDirection}>
          <motion.div
            key={armorState.index}
            className={`${styles.armorCard} ${!armor.unlocked ? 'locked-equipment' : ''}`}
            custom={currentDirection}
            variants={swipeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onClick={() => {
              if (armor.unlocked && armor.video) {
                setSelectedVideo(armor.video);
                setVideoModalVisible(true);
                pauseAutoPlay(); // 播放视频时暂停
              }
            }}
            onAnimationComplete={() => {
              // 动画完成后清除 ref 中的方向
              directionRef.current = null;
            }}
            onDragStart={() => {
              pauseAutoPlay(); // 开始拖拽时暂停
            }}
            onDragEnd={(e: any, info: any) => {
              const swipe = Math.abs(info.offset.x) * info.velocity.x;
              if (swipe < -10000) {
                handleArmorChange(armorState.index + 1);
              } else if (swipe > 10000) {
                handleArmorChange(armorState.index - 1);
              }
            }}
          >
            <div className={styles.armorImageContainer}>
              <img 
                src={armor.image} 
                alt={armor.name} 
                className={`${styles.armorDetailImage} ${!armor.unlocked ? styles.locked : ''}`}
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                  pointerEvents: armor.unlocked ? 'auto' : 'none'
                }}
                draggable={false}
              />
              {!armor.unlocked && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 60% 40%, rgba(40,40,40,0.25) 0%, rgba(20,20,20,0.45) 80%, rgba(10,10,10,0.65) 100%)',
                    backdropFilter: 'blur(4px) saturate(0.6)',
                    borderRadius: '12px',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}
                />
              )}
            </div>
            <div className={styles.armorInfoContainer}>
              <h2 className={styles.armorName} style={{ color: !armor.unlocked ? '#8a8a8a' : undefined, opacity: !armor.unlocked ? 0.7 : undefined }}>
                {armor.name}
              </h2>
              <p className={styles.armorDescription} style={{ color: !armor.unlocked ? '#8a8a8a' : undefined, opacity: !armor.unlocked ? 0.7 : undefined }}>
                {armor.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className={styles.armorNavDots}>
          {armors.map((_, index) => {
            if (index === armorState.index) {
              return (
                <div
                  key={index}
                  className={`${styles.dot} ${armorState.index === index ? styles.activeDot : ''}`}
                />
              );
            }
            return (
              <div
                key={index}
                className={`${styles.dot}`}
                onClick={() => {
                  handleArmorChange(index);
                }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  // 光线强度渐变样式计算
  const getLightIntensityStyle = (intensity: number) => ({
    background: `rgba(255, 255, 255, ${0.1 + intensity * 0.4})`,
    backdropFilter: `blur(8px) saturate(${1.05 + intensity * 0.1})`,
  });

  // 自定义弹窗动画motion
  const modalZoomMotion: CSSMotionProps = {
    motionName: 'custom-modal-zoom',
    motionAppear: true,
    motionEnter: true,
    motionLeave: true,
    motionLeaveImmediately: false,
    onAppearStart: () => ({ opacity: 0, transform: 'scale(0.7)' }),
    onAppearActive: () => ({ opacity: 1, transform: 'scale(1)' }),
    onEnterStart: () => ({ opacity: 0, transform: 'scale(0.7)' }),
    onEnterActive: () => ({ opacity: 1, transform: 'scale(1)' }),
    onLeaveStart: () => ({ opacity: 1, transform: 'scale(1)' }),
    onLeaveActive: () => ({ opacity: 0, transform: 'scale(0.7)' }),
    motionDeadline: 400,
  };

  return (
    <div className={styles.container} style={{position: 'relative'}}>
      {/* 音效 */}
      <audio ref={audioRef} src={RESOURCE_CONFIG.getResourceFullUrl('/audios/drawer.mp3')} preload="auto" />
      {/* 左侧抽屉菜单 */}
      <div className={styles.drawerMenu}>
        <div className={styles.drawerBackground}>
          {drawerItems.map((item, idx) => (
            <motion.div
              key={item.key}
              className={`${styles.drawerItem} ${activeDrawer === item.key ? styles.active : ''}`}
              onClick={() => {
                setClickedIndex(idx);
                setTimeout(() => {
                  setClickedIndex(null);
                  if (activeDrawer !== item.key) {
                    handleDrawerClick(item.key as DrawerItem);
                    setContentAnimKey(k => k + 1);
                  }
                }, 320);
              }}
              animate={
                clickedIndex === idx
                  ? {
                      x: [12, -6, 0],
                      scale: [1.08, 0.98, 1],
                      boxShadow: [
                        '0 8px 32px #ffe06655',
                        '0 0px 0px #ffe06600',
                        '0 0px 0px #ffe06600',
                      ],
                      transition: { times: [0, 0.7, 1], duration: 0.32, type: 'tween', ease: 'easeInOut' },
                    }
                  : { x: dragX !== 0 ? dragX : 0, scale: 1 }
              }
              drag={'x'}
              dragConstraints={{ left: 0, right: 80 }}
              dragElastic={0.5}
              onDrag={(_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => setDragX(info.point.x)}
              onDragEnd={(_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
                setDragX(0);
                if (info.offset.x > dragThreshold && activeDrawer !== item.key) {
                  handleDrawerClick(item.key as DrawerItem);
                  setContentAnimKey(k => k + 1);
                }
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            >
              <span className={styles.drawerKnobLeft}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" fill="#ffe066" stroke="#bfa76a" strokeWidth="1.5" />
                  <ellipse cx="8" cy="7" rx="3" ry="1.2" fill="#fffbe6" opacity="0.7" />
                  <ellipse cx="8" cy="10" rx="2.5" ry="0.8" fill="#bfa76a" opacity="0.3" />
                </svg>
              </span>
              <span className={styles.drawerContent}>
                <span className={styles.drawerIcon}>{item.icon}</span>
                <span className={styles.drawerLabel}>{item.label}</span>
              </span>
              <span className={styles.drawerKnobRight}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" fill="#ffe066" stroke="#bfa76a" strokeWidth="1.5" />
                  <ellipse cx="8" cy="7" rx="3" ry="1.2" fill="#fffbe6" opacity="0.7" />
                  <ellipse cx="8" cy="10" rx="2.5" ry="0.8" fill="#bfa76a" opacity="0.3" />
                </svg>
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      {/* 分割线 */}
      <div className={styles.splitLine} />
      {/* 右侧主显示区，初始隐藏，点击抽屉后淡入滑入 */}
      <AnimatePresence mode="wait">
        {activeDrawer && showContent && (
          <motion.div
            key={activeDrawer + '-' + contentAnimKey}
            className={`${styles.mainContent} ${showContent ? '' : styles.hidden}`}
            style={{ 
              minWidth: 0, 
              position: 'relative', 
              overflow: 'visible',
              ...getLightIntensityStyle(lightIntensity)
            }}
            initial={{ 
              opacity: 0, 
              x: 80, 
              scale: 0.96, 
              boxShadow: '0 0 0 0 #ffe066',
              ...getLightIntensityStyle(0) // 初始光线强度为0
            }}
            animate={{
              opacity: 1,
              x: dragX > 0 ? Math.min(dragX, 80) : 0,
              scale: [0.96, 1.04, 1],
              boxShadow: [
                '0 0 0 0 #ffe066',
                '0 0 32px 8px #ffe06688',
                `0 4px 20px ${lightIntensity > 0.5 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.3)'}`,
              ],
              transition: { times: [0, 0.7, 1], duration: 0.5, type: 'tween', ease: 'easeInOut' },
            }}
            exit={{ 
              opacity: 0, 
              x: 80, 
              scale: 0.96, 
              boxShadow: '0 0 0 0 #ffe066',
              ...getLightIntensityStyle(0) // 退出时光线强度为0
            }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            onAnimationStart={() => {
              // 开始光线强度渐变动画
              setLightIntensity(0);
            }}
            onAnimationComplete={() => {
              // 动画完成后，光线强度逐渐增强到1
              const lightAnimation = () => {
                setLightIntensity(prev => {
                  if (prev < 1) {
                    setTimeout(lightAnimation, 50); // 每50ms增加一点
                    return prev + 0.05;
                  }
                  return 1;
                });
              };
              setTimeout(lightAnimation, 100); // 延迟100ms开始光线渐变
            }}
          >
            {/* 光线洒入效果层 */}
            <motion.div
              className={styles.lightEffect}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: lightIntensity > 0.3 ? 0.6 : 0,
                scale: lightIntensity > 0.3 ? 1 : 0.8,
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(
                  ellipse at 30% 50%,
                  rgba(255, 255, 255, ${lightIntensity * 0.4}) 0%,
                  rgba(255, 255, 255, ${lightIntensity * 0.1}) 40%,
                  transparent 70%
                )`,
                pointerEvents: 'none',
                zIndex: 1,
                borderRadius: '28px',
              }}
            />
            {renderMainContent()}
          </motion.div>
        )}
      </AnimatePresence>
      {/* 图片放大模态框 */}
      <Modal
        title={null}
        open={imageModalVisible}
        onCancel={() => {
          setImageModalVisible(false);
        }}
        footer={null}
        width={800}
        centered
        className={styles.zoomModal}
        transitionName="custom-modal-zoom"
        closeIcon={
          <span
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #fffbe6 60%, #ffe066 100%)',
              borderRadius: '50%',
              boxShadow: '0 2px 8px #ffe06633',
              color: '#3a2c13',
              fontSize: 20,
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >×</span>
        }
      >
        <div
          style={{
            background: '#f8f5ec',
            borderRadius: 12,
            padding: 0,
            minHeight: 600,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* 图片展示区 - 黑色背景 */}
          <div
            style={{
              background: '#000',
              height: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <img
              src={selectedImage}
              alt={selectedItem?.name || "装备详情"}
              style={{
                maxWidth: '98%',
                maxHeight: '98%',
                objectFit: 'contain',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                borderRadius: 8,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                pointerEvents: 'none'
              } as React.CSSProperties}
              draggable={false}
            />
          </div>
          
          {/* 文字说明区域 */}
          <div
            style={{
              padding: '12px 18px 12px 18px',
              background: '#f8f5ec',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            {/* 标题 */}
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#3a2c13',
                textAlign: 'center',
                fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif'
              }}
            >
              {selectedItem?.name}
            </h3>
            
            {/* 描述文字 */}
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#5a4a2a',
                textAlign: 'center',
                fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
                letterSpacing: '0.5px'
              }}
            >
              {selectedItem?.description}
            </p>
          </div>
        </div>
      </Modal>
      {/* 视频播放模态框 */}
      <Modal
        title={null}
        open={videoModalVisible}
        onCancel={() => setVideoModalVisible(false)}
        footer={null}
        width={640}
        centered
        destroyOnClose
        className={styles.zoomModal}
        transitionName="custom-modal-zoom"
        styles={{
          body: { padding: 0, lineHeight: 0 },
          content: { background: 'transparent', boxShadow: 'none' },
        }}
        closeIcon={
          <span
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #fffbe6 60%, #ffe066 100%)',
              borderRadius: '50%',
              boxShadow: '0 2px 8px #ffe06633',
              color: '#3a2c13',
              fontSize: 20,
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >×</span>
        }
      >
        <video 
          src={selectedVideo} 
          controls 
          style={{ 
            width: '100%', 
            height: 'auto', 
            maxHeight: '80vh', 
            display: 'block', 
            borderRadius: '8px',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            pointerEvents: 'none'
          } as React.CSSProperties}
          autoPlay
          loop
          draggable={false}
        />
      </Modal>
    </div>
  );
};

export default SettingsPage; 