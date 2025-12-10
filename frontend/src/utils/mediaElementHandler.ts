// 全局媒体元素处理器
export class MediaElementHandler {
  private static instance: MediaElementHandler;
  private observer: MutationObserver | null = null;

  private constructor() {
    this.init();
  }

  static getInstance(): MediaElementHandler {
    if (!MediaElementHandler.instance) {
      MediaElementHandler.instance = new MediaElementHandler();
    }
    return MediaElementHandler.instance;
  }

  private init() {
    // 处理已存在的媒体元素
    this.processExistingElements();
    
    // 监听新添加的媒体元素
    this.observeNewElements();
  }

  private processExistingElements() {
    // 处理所有已存在的媒体元素
    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');
    const images = document.querySelectorAll('img');

    videos.forEach(video => this.addCorsToElement(video));
    audios.forEach(audio => this.addCorsToElement(audio));
    images.forEach(img => this.addCorsToElement(img));
  }

  private observeNewElements() {
    // 监听DOM变化，自动处理新添加的媒体元素
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // 检查新添加的元素
            if (element.tagName === 'VIDEO' || element.tagName === 'AUDIO' || element.tagName === 'IMG') {
              this.addCorsToElement(element as HTMLVideoElement | HTMLAudioElement | HTMLImageElement);
            }
            
            // 检查新添加元素内的媒体元素
            const videos = element.querySelectorAll('video');
            const audios = element.querySelectorAll('audio');
            const images = element.querySelectorAll('img');
            
            videos.forEach(video => this.addCorsToElement(video));
            audios.forEach(audio => this.addCorsToElement(audio));
            images.forEach(img => this.addCorsToElement(img));
          }
        });
      });
    });

    // 开始监听
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private addCorsToElement(element: HTMLVideoElement | HTMLAudioElement | HTMLImageElement) {
    // 检查是否为OSS URL
    if (this.isOSSUrl(element.src)) {
      element.crossOrigin = 'anonymous';
      
      // 添加错误处理
      const handleError = (e: Event) => {
        const target = e.target as HTMLVideoElement | HTMLAudioElement | HTMLImageElement;
        console.warn('[MediaElementHandler] CORS错误，尝试移除crossOrigin设置:', target.src);
        target.crossOrigin = '';
        if ('load' in target && typeof target.load === 'function') {
          target.load();
        }
      };
      
      // 移除之前的事件监听器（避免重复）
      element.removeEventListener('error', handleError);
      element.addEventListener('error', handleError, { once: true });
    }
  }

  private isOSSUrl(url: string): boolean {
    return url.includes('oss.aliyuncs.com') || url.includes('oss-cn-');
  }

  // 手动处理单个元素（用于特殊情况）
  static processElement(element: HTMLVideoElement | HTMLAudioElement | HTMLImageElement) {
    MediaElementHandler.getInstance().addCorsToElement(element);
  }

  // 销毁观察器（用于清理）
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
} 