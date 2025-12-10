'use client';

import { useEffect, useRef, useState } from 'react';
import { RESOURCE_CONFIG } from '@/config/resource';
import styles from './videoBackground.module.css';

interface VideoBackgroundProps {
    /** 视频源地址 */
    videoSrc: string;
    /** 视频播放结束回调 */
    onVideoEnd?: () => void;
    /** 视频准备好时回调 */
    onVideoReady?: () => void;
    /** 是否处于过渡状态 */
    isTransition?: boolean;
    /** 是否循环播放 */
    loop?: boolean;
    /** 视频播放速度 */
    playbackRate?: number;
    /** 是否预加载视频 */
    preload?: boolean;
    /** 视频缩放比例 */
    scale?: number;
    /** 视频位置 */
    objectPosition?: string;
}

export default function VideoBackground({ 
    videoSrc, 
    onVideoEnd, 
    onVideoReady,
    isTransition = false,
    loop = false,
    playbackRate = 1,
    preload = true,
    scale = 1.1,
    objectPosition = 'center'
}: VideoBackgroundProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [backgroundImage, setBackgroundImage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isVideoReady, setIsVideoReady] = useState(false);
    const prevVideoSrcRef = useRef<string>('');

    // 监听videoSrc变化
    useEffect(() => {
        if (!videoSrc || videoSrc === prevVideoSrcRef.current) {
            return;
        }

        prevVideoSrcRef.current = videoSrc;

        // 重置视频状态
        setIsPlaying(true);
        setBackgroundImage('');
        setError('');
        setIsVideoReady(false);

        // 等待下一个渲染周期，确保video元素已经挂载
        const timer = setTimeout(() => {
            const video = videoRef.current;
            if (!video) {
                return;
            }

            // 设置视频源
            video.src = videoSrc;
            video.playbackRate = playbackRate;
            video.loop = loop;
            video.preload = preload ? 'auto' : 'none';
            
            // 调试信息
            console.log('[VideoBackground] 视频URL:', videoSrc);
            
            if (preload) {
                // 强制预加载
                video.load();
            }
            
            // 监听视频加载事件
            const handleLoadedData = () => {
                setIsVideoReady(true);
                const playPromise = video.play();
                
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            // 视频开始播放
                        })
                        .catch(error => {
                            setError(error.message);
                            onVideoEnd?.();
                        });
                }
            };

            const handleCanPlay = () => {
                // 视频可以播放
            };

            const handleWaiting = () => {
                // 视频正在缓冲
            };

            const handlePlaying = () => {
                // 视频正在播放
            };

            video.addEventListener('loadeddata', handleLoadedData);
            video.addEventListener('canplay', handleCanPlay);
            video.addEventListener('waiting', handleWaiting);
            video.addEventListener('playing', handlePlaying);

            return () => {
                video.removeEventListener('loadeddata', handleLoadedData);
                video.removeEventListener('canplay', handleCanPlay);
                video.removeEventListener('waiting', handleWaiting);
                video.removeEventListener('playing', handlePlaying);
            };
        }, 0);

        return () => {
            clearTimeout(timer);
        };
    }, [videoSrc, onVideoEnd, playbackRate, loop, preload]);

    // 始终监听视频结束事件，不受视频源变化影响
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleEnded = () => {
            console.log('[VideoBackground] 视频播放结束事件触发');
            if (!loop) {
                setIsPlaying(false);
                
                // 使用统一的方法获取视频对应的背景图片
                const backgroundImageUrl = RESOURCE_CONFIG.getVideoBackgroundImage(videoSrc);
                console.log('[VideoBackground] 视频对应的背景图片:', backgroundImageUrl);
                
                // 检查背景图片是否存在
                const img = new Image();
                img.onload = () => {
                    console.log('[VideoBackground] 背景图片加载成功');
                    setBackgroundImage(backgroundImageUrl);
                };
                img.onerror = () => {
                    console.warn('[VideoBackground] 背景图片不存在，使用默认背景');
                    // 使用默认的纸张纹理背景
                    setBackgroundImage(RESOURCE_CONFIG.getResourceFullUrl('/images/paper-texture.jpg'));
                };
                img.src = backgroundImageUrl;
                
                console.log('[VideoBackground] 调用onVideoEnd回调');
                onVideoEnd?.();
            }
        };

        const handleError = (e: Event) => {
            const videoError = (e.target as HTMLVideoElement).error;
            console.log('[VideoBackground] 视频播放出错:', videoError?.message);
            setError(videoError?.message || '视频加载失败');
            onVideoEnd?.();
        };

        const handleTimeUpdate = () => {
            // 检查视频是否接近结束（剩余时间小于0.1秒）
            if (video.duration && video.currentTime >= video.duration - 0.1) {
                console.log('[VideoBackground] 视频接近结束，手动触发结束事件');
                handleEnded();
            }
        };

        video.addEventListener('ended', handleEnded);
        video.addEventListener('error', handleError);
        video.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('error', handleError);
            video.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [onVideoEnd, loop, videoSrc]);

    // 如果没有视频源，直接返回背景图片容器
    if (!videoSrc) {
        return (
            <div className={styles.videoBackground}>
                <div 
                    className={styles.backgroundImage}
                    style={{ 
                        backgroundSize: 'cover',
                        backgroundPosition: objectPosition,
                    }}
                />
                <div className="bg-gradient-to-b from-black/30 via-transparent to-black/30 absolute inset-0" />
            </div>
        );
    }

    return (
        <div className={styles.videoBackground}>
            {isPlaying ? (
                <video
                    ref={videoRef}
                    className={styles.video}
                    autoPlay
                    muted
                    playsInline
                    loop={loop}
                    onCanPlay={onVideoReady}
                    style={{
                        objectPosition,
                        transform: `scale(${scale})`,
                    }}
                >
                    <source src={videoSrc} type="video/mp4" />
                </video>
            ) : (
                <div 
                    className={styles.backgroundImage}
                    style={{ 
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: objectPosition,
                    }}
                />
            )}
            {error && (
                <div className={styles.errorMessage}>
                    {error}
                </div>
            )}
            <div className="bg-gradient-to-b from-black/30 via-transparent to-black/30 absolute inset-0" />
        </div>
    );
}