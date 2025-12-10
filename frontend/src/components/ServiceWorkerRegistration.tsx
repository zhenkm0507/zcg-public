'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          console.log('[SW] 开始注册 Service Worker...');
          
          // 检查是否已经有活跃的 Service Worker
          const existingRegistration = await navigator.serviceWorker.getRegistration();
          if (existingRegistration) {
            console.log('[SW] 发现已存在的 Service Worker:', existingRegistration);
            
            // 检查是否需要更新
            if (existingRegistration.waiting) {
              console.log('[SW] 发现等待中的 Service Worker 更新');
              existingRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            
            return;
          }
          
          // 注册新的 Service Worker
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none' // 禁用浏览器缓存，确保获取最新版本
          });
          
          console.log('[SW] Service Worker 注册成功:', registration);
          
          // 监听 Service Worker 更新
          registration.addEventListener('updatefound', () => {
            console.log('[SW] 检测到 Service Worker 更新');
            const newWorker = registration.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[SW] 新版本已安装，等待激活');
                  // 可以在这里提示用户刷新页面
                }
              });
            }
          });
          
          // 监听 Service Worker 消息
          navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('[SW] 收到消息:', event.data);
          });
          
        } catch (error) {
          console.error('[SW] Service Worker 注册失败:', error);
          
          // 详细的错误诊断
          if (error instanceof Error) {
            console.error('[SW] 错误详情:', {
              name: error.name,
              message: error.message,
              stack: error.stack
            });
          }
        }
      } else {
        console.warn('[SW] 浏览器不支持 Service Worker');
      }
    };
    
    registerServiceWorker();
  }, []);

  return null; // 这个组件不渲染任何内容
}
