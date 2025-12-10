'use client';

import { Layout as AntLayout, Menu, Select, message } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { userApi, wordApi, incentiveApi } from '@/services';
import { User, WordBankDto } from '@/types';
import { UserWordBankProfile } from '@/services/incentive';
import { RESOURCE_CONFIG, VIDEO_FILES, AUDIO_FILES, IMAGE_FILES } from '@/config/resource';
import styles from './layout.module.css';
import { getCurrentWordBankId, setCurrentWordBankId, clearCurrentWordBankId } from '@/utils/storage';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { UserOutlined, TrophyOutlined } from '@ant-design/icons';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import FlagSelectorModal from '@/components/FlagSelectorModal';

const VideoBackground = dynamic(() => import('@/components/VideoBackground/index'), { ssr: false });

const { Header, Content, Footer } = AntLayout;
const { Option } = Select;

interface LayoutProps {
    children: React.ReactNode;
}

// 获取一级菜单key的函数
const getTopMenuKey = (path: string, searchParams?: URLSearchParams) => {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return '/';
    
    // 单词详情页特殊处理：根据from参数返回对应的一级菜单
    if (path.includes('/study/word_bank/detail')) {
        const from = searchParams?.get('from');
        
        // 如果有from参数，直接使用作为一级菜单
        if (from) {
            return from;
        }
        // 如果没有from参数，按原逻辑处理
    }
    
    if (parts[0] === 'study' && parts[1]) {
        return `/study/${parts[1]}`;
    }
    return `/${parts[0]}`;
};

// 内部Layout组件，使用useSearchParams
function LayoutInner({ children }: LayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [userInfo, setUserInfo] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserWordBankProfile | null>(null);
    const [wordBanks, setWordBanks] = useState<WordBankDto[]>([]);
    const [currentWordBankIdState, setCurrentWordBankIdState] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<string>('');
    const [currentAudio, setCurrentAudio] = useState<string>('');
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [mounted, setMounted] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isVideoEnded, setIsVideoEnded] = useState(false);
    const [audioKey, setAudioKey] = useState<string>('');
    const [flagModalVisible, setFlagModalVisible] = useState(false);

    // 记录上一次一级菜单key，确保一级菜单切换判断准确
    const prevTopMenuKey = useRef<string>(getTopMenuKey(pathname, searchParams));

    // 获取当前路由对应的视频
    const getVideoSrc = (path: string = pathname) => {
        if (path.startsWith('/study/records')) {
            return RESOURCE_CONFIG.getResourceFullUrl(`/videos/${VIDEO_FILES.DEFAULT_MENU}`);
        }
        if (path.startsWith('/study/word_bank')) {
            return RESOURCE_CONFIG.getResourceFullUrl(`/videos/${VIDEO_FILES.DEFAULT_MENU}`);
        }
        if (path.startsWith('/study/battle')) {
            return RESOURCE_CONFIG.getResourceFullUrl(`/videos/${VIDEO_FILES.MGZ_MENU}`);
        }
        if (path.startsWith('/study/hard_word')) {
            return RESOURCE_CONFIG.getResourceFullUrl(`/videos/${VIDEO_FILES.DEFAULT_MENU}`);
        }
        if (path.startsWith('/settings')) {
            return RESOURCE_CONFIG.getResourceFullUrl(`/videos/${VIDEO_FILES.LANYUETAI}`);
        }
        // 首页和其它情况
        return RESOURCE_CONFIG.getResourceFullUrl(`/videos/${VIDEO_FILES.MAIN}`);
    };

    // 获取当前路由对应的音频
    const getAudioSrc = (path: string = pathname) => {
        if (path.startsWith('/study/records')) {
            return RESOURCE_CONFIG.getResourceFullUrl(`/audios/${AUDIO_FILES.DEFAULT_MENU}`);
        }
        if (path.startsWith('/study/word_bank')) {
            return RESOURCE_CONFIG.getResourceFullUrl(`/audios/${AUDIO_FILES.DEFAULT_MENU}`);
        }
        if (path.startsWith('/study/battle')) {
            return RESOURCE_CONFIG.getResourceFullUrl(`/audios/${AUDIO_FILES.DEFAULT_MENU}`);
        }
        if (path.startsWith('/study/hard_word')) {
            return RESOURCE_CONFIG.getResourceFullUrl(`/audios/${AUDIO_FILES.DEFAULT_MENU}`);
        }
        if (path.startsWith('/settings')) {
            return RESOURCE_CONFIG.getResourceFullUrl(`/audios/${AUDIO_FILES.LANYUETAI}`);
        }
        // 首页和其它情况
        return RESOURCE_CONFIG.getResourceFullUrl(`/audios/${AUDIO_FILES.DEFAULT_MENU}`);
    };

    const handleVideoEnd = () => {
        console.log('[Layout] handleVideoEnd触发，视频播放完毕');
        setShowContent(true);
        setIsTransitioning(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const handleMenuClick = ({ key }: { key: string }) => {
        console.log('[Layout] 菜单点击:', key);
        
        // 特殊处理：斩词菜单项显示标签选择浮窗
        if (key === '/study/battle/battle') {
            setFlagModalVisible(true);
            return;
        }
        
        const currentTopMenu = getTopMenuKey(pathname, searchParams);
        const targetTopMenu = getTopMenuKey(key, searchParams);
        console.log('[Layout] 当前一级菜单:', currentTopMenu, '目标一级菜单:', targetTopMenu);
        if (currentTopMenu !== targetTopMenu) {
            setIsTransitioning(true);
            setShowContent(false);
        }
        setTimeout(() => {
            router.push(key);
        }, 0);
    };

    // 处理标签选择浮窗确认
    const handleFlagConfirm = (selectedFlag: string) => {
        setFlagModalVisible(false);
        const currentTopMenu = getTopMenuKey(pathname, searchParams);
        const targetTopMenu = getTopMenuKey('/study/battle/battle', searchParams);
        
        if (currentTopMenu !== targetTopMenu) {
            setIsTransitioning(true);
            setShowContent(false);
        }
        
        setTimeout(() => {
            // 构建带参数的URL
            const url = selectedFlag === '全部' 
                ? '/study/battle/battle' 
                : `/study/battle/battle?flag=${encodeURIComponent(selectedFlag)}`;
            router.push(url);
        }, currentTopMenu !== targetTopMenu ? 300 : 0);
    };

    // 处理标签选择浮窗取消
    const handleFlagCancel = () => {
        setFlagModalVisible(false);
    };

    // 客户端挂载状态
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // 初始化时设置视频和音频，只在一级菜单页面加载
    useEffect(() => {
        console.log('[Layout] 初始化useEffect触发，pathname:', pathname, 'isInitialLoad:', isInitialLoad);
        if (isInitialLoad) {
            const topMenu = getTopMenuKey(pathname, searchParams);
            console.log('[Layout] 初始化时一级菜单:', topMenu);
            // 只有一级菜单页面才加载视频和音频
            if (
                pathname.startsWith(topMenu) ||
                pathname === '/' // 首页
            ) {
                const videoSrc = getVideoSrc();
                console.log('[Layout] 初始化时设置视频:', videoSrc);
                // 重置状态
                setIsVideoEnded(false);
                setShowContent(false);
                setIsTransitioning(true);
                // 设置视频和音频
                setCurrentVideo(videoSrc);
                setCurrentAudio(getAudioSrc());
            } else {
                console.log('[Layout] 初始化时不是一级菜单页面，直接显示内容');
                setShowContent(true);
                setIsTransitioning(false);
            }
            setIsInitialLoad(false);
        }
    }, [isInitialLoad, pathname, searchParams]);

    // 一级菜单切换时同步切换视频和音频
    useEffect(() => {
        console.log('[Layout] 一级菜单切换useEffect触发，pathname:', pathname, 'isInitialLoad:', isInitialLoad);
        if (!isInitialLoad) {
            const currentTopMenu = getTopMenuKey(pathname, searchParams);
            const prevTopMenu = prevTopMenuKey.current;
            console.log('[Layout] 当前一级菜单:', currentTopMenu, '上一次一级菜单:', prevTopMenu);
            if (currentTopMenu !== prevTopMenu) {
                console.log('[Layout] 一级菜单发生变化，切换视频和音频');
                // 重置状态
                setIsVideoEnded(false);
                setShowContent(false);
                setIsTransitioning(true);
                // 设置新的视频和音频
                setCurrentVideo(getVideoSrc());
                setCurrentAudio(getAudioSrc());
                // 生成新的音频key，强制重新创建音频元素
                setAudioKey(`audio-${Date.now()}`);
            } else {
                console.log('[Layout] 一级菜单未变化，不切换视频');
            }
            prevTopMenuKey.current = currentTopMenu;
        }
    }, [pathname, isInitialLoad, searchParams]);

    // 监听currentVideo变化，重置showContent，并设置25秒兜底
    useEffect(() => {
        if (!currentVideo) return;
        console.log('[Layout] 视频源变化:', currentVideo);
        setShowContent(false);
        setIsTransitioning(true);
        setIsVideoEnded(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        // 兜底25秒后，如果还没显示内容，则强制显示
        timeoutRef.current = setTimeout(() => {
            if (!showContent) {
                console.log('[Layout] 25秒兜底触发，强制显示内容');
                setShowContent(true);
                setIsTransitioning(false);
            }
        }, 25000);
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [currentVideo]);

    // 获取用户信息
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await userApi.getUserInfo();
                setUserInfo(response.data.data);
                
                const backendWordBankId = response.data.data.current_word_bank_id;
                if (backendWordBankId) {
                    const storedWordBankId = getCurrentWordBankId();
                    
                    if (backendWordBankId !== storedWordBankId) {
                        console.log(`词库ID不一致，更新前端存储：后端=${backendWordBankId}，前端=${storedWordBankId}`);
                        setCurrentWordBankId(backendWordBankId);
                        setCurrentWordBankIdState(backendWordBankId);
                    } else {
                        setCurrentWordBankIdState(storedWordBankId);
                    }
                } else if (!backendWordBankId && getCurrentWordBankId()) {
                    console.log('后端没有词库ID，但前端有，清除前端存储');
                    clearCurrentWordBankId();
                    setCurrentWordBankIdState(null);
                }
            } catch (error) {
                console.error('获取用户信息失败:', error);
                
                const storedWordBankId = getCurrentWordBankId();
                if (storedWordBankId) {
                    setCurrentWordBankIdState(storedWordBankId);
                }
            }
        };

        if (pathname !== '/login') {
            fetchUserInfo();
        }
    }, [pathname]);

    // 获取用户词库个人Profile信息
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await incentiveApi.getUserWordBankProfile();
                setUserProfile(response.data.data);
                console.log('获取用户词库个人Profile信息成功:', response.data.data);
            } catch (error) {
                console.error('获取用户词库个人Profile信息失败:', error);
            }
        };

        if (pathname !== '/login' && currentWordBankIdState) {
            fetchUserProfile();
        }
    }, [pathname, currentWordBankIdState]);

    // 获取词库列表
    useEffect(() => {
        const fetchWordBanks = async () => {
            try {
                const response = await wordApi.getWordBankList();
                setWordBanks(response.data.data);
            } catch (error) {
                console.error('获取词库列表失败:', error);
            }
        };

        if (pathname !== '/login') {
            fetchWordBanks();
        }
    }, [pathname]);

    const handleWordBankChange = async (value: number) => {
        if (value === currentWordBankIdState) return;
        
        setLoading(true);
        try {
            const response = await userApi.switchWordBank(value);
            
            if (response.data.code === 0) {
                setCurrentWordBankId(value);
                setCurrentWordBankIdState(value);
                console.log(`成功切换词库ID: ${value}`);
                
                router.refresh();
            }
        } catch (error) {
            console.error('切换词库失败:', error);
            message.error('切换词库失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        {
            key: '/',
            label: '登科堂',
        },
        {
            key: '/study/battle',
            label: '墨耕斋',
            children: [
                {
                    key: '/study/battle/battle',
                    label: '斩词',
                },
                {
                    key: '/study/battle/batches',
                    label: '斩词批次设置',
                },
                {
                    key: '/study/battle/set_flags',
                    label: '标签设置',
                },
            ],
        },
        {
            key: '/study/hard_word',
            label: '淬词坊',
        },
        {
            key: '/study/records',
            label: '汗青廊',
        },
        {
            key: '/study/word_bank',
            label: '藏经枢',
            children: [
                {
                    key: '/study/word_bank/list',
                    label: '单词列表',
                },
                {
                    key: '/study/word_bank/inflections',
                    label: '变形形式',
                },
            ],
        },
        {
            key: '/settings',
            label: '揽月台',
        },
    ];

    const isLoginPage = pathname === '/login';

    // 登录页面直接返回内容
    if (pathname === '/login') {
        return <>{children}</>;
    }

    // 未挂载时返回空内容
    if (!mounted) {
        return null;
    }

    return (
        <div className={styles.layout}>
            <ServiceWorkerRegistration />
            <VideoBackground 
                key={`video-${getTopMenuKey(pathname, searchParams)}`}
                videoSrc={currentVideo} 
                onVideoEnd={handleVideoEnd}
                isTransition={isTransitioning}
                loop={isLoginPage}
            />
            {currentAudio && (
                <audio
                    key={audioKey || `audio-${getTopMenuKey(pathname, searchParams)}`}
                    src={currentAudio}
                    autoPlay
                    loop={isLoginPage}
                    controls={false}
                    preload="auto"
                    crossOrigin="anonymous"
                    style={{ display: 'none' }}
                />
            )}
            <AnimatePresence mode="wait">
                {showContent && (
                    <motion.div
                        key={getTopMenuKey(pathname, searchParams)}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <header className={styles.header}>
                            <div className={styles.logo}>
                                <img 
                                    src={RESOURCE_CONFIG.getResourceFullUrl(`/images/${IMAGE_FILES.ZCG}`)} 
                                    alt="斩词阁" 
                                    className={styles.logoImage}
                                />
                                <span className={styles.logoText}>斩词阁</span>
                            </div>
                            <Menu
                                theme="dark"
                                mode="horizontal"
                                selectedKeys={[getTopMenuKey(pathname, searchParams)]}
                                items={menuItems}
                                onClick={handleMenuClick}
                                className={styles.menu}
                            />
                            
                            <div className={styles.headerRight}>
                                {wordBanks.length > 0 && (
                                    <Select
                                        className={styles.wordBankSelect}
                                        value={currentWordBankIdState}
                                        onChange={handleWordBankChange}
                                        loading={loading}
                                        placeholder="请选择词库"
                                        disabled={loading}
                                    >
                                        {wordBanks.map((bank) => (
                                            <Option key={bank.id} value={bank.id}>
                                                {bank.name}
                                            </Option>
                                        ))}
                                    </Select>
                                )}
                                
                                {userInfo && (
                                    <div className={styles.userInfo}>
                                        <UserOutlined className={styles.userIcon} />
                                        <span className={styles.userNickname}>{userInfo.nick_name}</span>
                                        <TrophyOutlined className={styles.levelIcon} />
                                        <span className={userProfile ? styles.userLevel : styles.userLevelLoading}>
                                            {userProfile ? userProfile.user_level_name : '等级: 加载中...'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </header>
                        <motion.main 
                            className={styles.content}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            {children}
                        </motion.main>
                        <footer className={styles.footer}>
                            <span className={styles.studioName}>FEITOUJIA</span> 工作室 匠心打造
                        </footer>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* 标签选择浮窗 */}
            <FlagSelectorModal
                visible={flagModalVisible}
                onCancel={handleFlagCancel}
                onConfirm={handleFlagConfirm}
            />
        </div>
    );
}

// 包装组件，使用Suspense包裹useSearchParams
export default function Layout({ children }: LayoutProps) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LayoutInner>{children}</LayoutInner>
        </Suspense>
    );
} 