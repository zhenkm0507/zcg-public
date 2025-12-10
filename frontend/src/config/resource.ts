// 资源路径配置
export const RESOURCE_CONFIG = {
  // 阿里云OSS配置
  OSS: {
    // 基础URL，请根据您的OSS配置修改
    // 注意：使用自定义域名可以避免OSS自动添加Content-Disposition: attachment
    BASE_URL: process.env.NEXT_PUBLIC_OSS_BASE_URL || 'https://your-bucket.oss-region.aliyuncs.com',
    // 是否启用OSS
    ENABLED: process.env.NEXT_PUBLIC_OSS_ENABLED === 'true' || false,
  },
  
  // 本地资源路径（备用）
  LOCAL: {
    VIDEOS: '/videos/',
    AUDIOS: '/audios/',
    IMAGES: '/images/',
    ICONS: '/icons/',
  },
  
  // 通用资源路径拼接
  getResourceFullUrl: (path: string): string => {
    if (!path) return '';
    if (RESOURCE_CONFIG.OSS.ENABLED) {
      return RESOURCE_CONFIG.OSS.BASE_URL + path;
    }
    return path;
  },

  // 根据视频路径生成对应的背景图片路径
  getVideoBackgroundImage: (videoPath: string): string => {
    if (!videoPath) return '';
    
    // 从视频路径中提取文件名（不含扩展名）
    const videoName = videoPath.split('/').pop()?.replace('.mp4', '');
    if (!videoName) return '';
    
    // 生成对应的背景图片路径
    const backgroundImagePath = `/images/${videoName}.jpg`;
    
    // 使用统一的资源URL处理方法
    return RESOURCE_CONFIG.getResourceFullUrl(backgroundImagePath);
  },
};

// 视频文件配置
export const VIDEO_FILES = {
  LOGIN: 'login.mp4',
  DEFAULT_MENU: 'default_menu.mp4',
  MGZ_MENU: 'mgz_menu.mp4',
  LANYUETAI: 'lanyuetai_menu.mp4',
  MAIN: 'main_menu.mp4',
} as const;

// 音频文件配置
export const AUDIO_FILES = {
  LOGIN: 'login.mp3',
  DEFAULT_MENU: 'default_menu.mp3',
  LANYUETAI: 'lanyuetai.mp3',
  DRAWER: 'drawer.mp3',
  TURN_PAGE: 'turn_page.mp3',
  SLAINED: 'slained.mp3',
  CORRECT: 'correct.mp3',
} as const;

// 图片文件配置
export const IMAGE_FILES = {
  ZCG: 'zcg.jpg',
  PAPER_TEXTURE: 'paper-texture.jpg',
  DEFAULT_ARMOR: 'armors/xuanyi.jpg',
} as const; 