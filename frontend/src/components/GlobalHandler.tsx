'use client';

import { useEffect } from 'react';
import { setupGlobalErrorHandler } from '@/utils/globalErrorHandler';
import { MediaElementHandler } from '@/utils/mediaElementHandler';

const GlobalHandler: React.FC = () => {
  useEffect(() => {
    // 设置全局错误处理
    setupGlobalErrorHandler();
    
    // 启动全局媒体元素处理器
    MediaElementHandler.getInstance();
    
    console.log('[GlobalHandler] 全局错误处理和媒体元素处理器已设置');
  }, []);

  return null; // 这个组件不渲染任何内容
};

export default GlobalHandler; 