'use client';

import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, SoundOutlined, AudioMutedOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/auth';
import { userApi } from '@/services/user';
import { setToken } from '@/utils/auth';
import { setCurrentWordBankId } from '@/utils/storage';
import { RESOURCE_CONFIG, VIDEO_FILES, AUDIO_FILES } from '@/config/resource';
import styles from './login.module.css';
import VideoBackground from '@/components/VideoBackground/index';
import WordBankSelector from '@/components/WordBankSelector';
import { useEffect, useState, useRef } from 'react';
import { LoginResponse } from '@/types/auth';

export default function LoginPage() {
    const router = useRouter();
    const [form] = Form.useForm();
    const [showAudio, setShowAudio] = useState(false);
    const [showWordBankSelector, setShowWordBankSelector] = useState(false);
    const [loginResponse, setLoginResponse] = useState<LoginResponse | null>(null);
    const [showLoginBox, setShowLoginBox] = useState(true);
    const loginBoxDelayRef = useRef<NodeJS.Timeout | null>(null);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [audioUnlocked, setAudioUnlocked] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowAudio(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    // iOS首次交互解锁音频
    useEffect(() => {
        const unlock = () => {
            if (audioRef.current) {
                audioRef.current.muted = false;
                audioRef.current.play();
                setAudioUnlocked(true);
                setAudioPlaying(true);
            }
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('click', unlock);
        };
        window.addEventListener('touchstart', unlock, { once: true });
        window.addEventListener('click', unlock, { once: true });
        return () => {
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('click', unlock);
        };
    }, []);

    // 音量按钮点击
    const handleAudioToggle = () => {
        if (!audioRef.current) return;
        if (audioPlaying) {
            audioRef.current.pause();
            setAudioPlaying(false);
        } else {
            audioRef.current.muted = false;
            audioRef.current.play();
            setAudioPlaying(true);
        }
    };

    // 音频播放结束后自动切换状态
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onPause = () => setAudioPlaying(false);
        const onPlay = () => setAudioPlaying(true);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('play', onPlay);
        return () => {
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('play', onPlay);
        };
    }, []);

    const handleSubmit = async (values: { username: string; password: string }) => {
        try {
            const response = await authApi.login(values);
            if (response.data.code === 0) {
                // 保存token
                const { token, token_type } = response.data.data;
                setToken(token, token_type);
                
                // 保存登录响应数据
                setLoginResponse(response.data.data);
            
            }
        } catch (error) {
            console.error('入阁失败:', error);
        }
    };

    // 处理词库选择完成
    const handleWordBankSelected = () => {
        console.log('[LoginPage] 词库选择完成，跳转到首页');
        setShowWordBankSelector(false);
        router.push('/');
    };

    return (
        <div className={`${styles.container} ${styles.loginPage}`}>
            <VideoBackground videoSrc={RESOURCE_CONFIG.getResourceFullUrl(`/videos/${VIDEO_FILES.LOGIN}`)} loop />
            {/* 音量按钮 */}
            <div style={{ position: 'fixed', top: 24, right: 32, zIndex: 1001 }}>
                <Button
                    shape="circle"
                    size="large"
                    icon={audioPlaying ? <SoundOutlined /> : <AudioMutedOutlined />}
                    onClick={handleAudioToggle}
                    style={{ background: '#fffbe6', color: '#bfa76a', border: '1.5px solid #bfa76a', boxShadow: '0 2px 8px #bfa76a22' }}
                />
            </div>
            {showAudio && (
                <audio
                    ref={audioRef}
                    src={RESOURCE_CONFIG.getResourceFullUrl(`/audios/${AUDIO_FILES.LOGIN}`)}
                    autoPlay
                    loop
                    controls={false}
                    muted={!audioUnlocked}
                    preload="auto"
                    crossOrigin="anonymous"
                    style={{ display: 'none' }}
                />
            )}
            {/* 登录窗 */}
            <div
                className={styles.loginBox}
                style={{ display: showLoginBox ? 'block' : 'none' }}
            >
                <div className={styles.titleWrapper}>
                    <h1 className={styles.title}>斩词阁</h1>
                    <p className={styles.subtitle}>开启你的单词修炼之旅</p>
                </div>
                <Form
                    form={form}
                    name="login"
                    onFinish={handleSubmit}
                    className={styles.form}
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: '请输入阁主姓名' }]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="阁主姓名"
                            size="large"
                            autoCapitalize="off"
                            autoCorrect="off"
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: '请输入阁主密令' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="阁主密令"
                            size="large"
                            autoCapitalize="off"
                            autoCorrect="off"
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className={styles.loginButton}
                            block
                            size="large"
                        >
                            入阁
                        </Button>
                    </Form.Item>
                </Form>
                <div className={styles.studioMark}>
                    <span className={styles.studioName}>FEITOUJIA</span>
                    <span className={styles.studioSub}>工作室</span>
                </div>
            </div>
            
            {/* 词库选择弹窗 */}
            <WordBankSelector
                visible={showWordBankSelector}
                onClose={handleWordBankSelected}
            />
        </div>
    );
} 