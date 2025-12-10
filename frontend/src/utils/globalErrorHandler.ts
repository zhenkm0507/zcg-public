// 全局错误处理器
export const setupGlobalErrorHandler = () => {
  // 监听全局错误
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message && event.error.message.includes('CORS')) {
      console.warn('[GlobalErrorHandler] 检测到CORS错误:', event.error.message);
      
      // 可以在这里添加全局CORS错误处理逻辑
      // 比如显示用户友好的错误提示
    }
  });

  // 监听未处理的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('CORS')) {
      console.warn('[GlobalErrorHandler] 检测到未处理的CORS错误:', event.reason.message);
      event.preventDefault(); // 阻止默认错误处理
    }
  });
}; 