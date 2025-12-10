/**
 * 缓存管理工具
 */

// 缓存管理工具
export interface CacheInfo {
  name: string;
  size: number;
  entries: number;
  lastUpdated: number;
}

export interface MediaFileInfo {
  url: string;
  size: number;
  lastModified: number;
  category: string;
  updateInterval: number;
  lastCheck: number;
  needsUpdate: boolean;
}

// 缓存配置
export const CACHE_CONFIG = {
  audios: {
    path: '/audios/',
    extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
    updateInterval: 24 * 60 * 60 * 1000 // 24小时
  },
  videos: {
    path: '/videos/',
    extensions: ['.mp4', '.webm', '.ogg', '.mov'],
    updateInterval: 24 * 60 * 60 * 1000 // 24小时
  },
  images: {
    path: '/images/',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
    updateInterval: 7 * 24 * 60 * 60 * 1000 // 7天
  },
  icons: {
    path: '/icons/',
    extensions: ['.svg', '.png', '.ico'],
    updateInterval: 30 * 24 * 60 * 60 * 1000 // 30天
  },
  root: {
    path: '/',
    extensions: ['.png', '.svg', '.ico'],
    files: ['apple-touch-icon.png', 'globe.svg', 'next.svg', 'vercel.svg', 'window.svg', 'file.svg'],
    updateInterval: 7 * 24 * 60 * 60 * 1000 // 7天
  }
};

// 检查文件是否应该被缓存
export function shouldCacheFile(url: string): boolean {
  const pathname = new URL(url, window.location.origin).pathname;
  
  for (const [key, config] of Object.entries(CACHE_CONFIG)) {
    if (pathname.startsWith(config.path) || (config.path === '/' && pathname.startsWith('/'))) {
      const hasValidExtension = config.extensions.some(ext => 
        pathname.toLowerCase().endsWith(ext)
      );
      const isSpecificFile = 'files' in config && Array.isArray(config.files) && config.files.some(file => 
        pathname.endsWith(file)
      );
      
      if (hasValidExtension || isSpecificFile) {
        return true;
      }
    }
  }
  
  return false;
}

// 获取缓存配置
export function getCacheConfig() {
  return CACHE_CONFIG;
}

// 获取缓存信息
export async function getCacheInfo(): Promise<CacheInfo[]> {
  if (!('caches' in window)) {
    return [];
  }

  const cacheNames = await caches.keys();
  const cacheInfos: CacheInfo[] = [];

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    let totalSize = 0;

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }

    cacheInfos.push({
      name,
      size: totalSize,
      entries: keys.length,
      lastUpdated: Date.now()
    });
  }

  return cacheInfos;
}

// 获取媒体文件信息
export async function getMediaFilesInfo(): Promise<MediaFileInfo[]> {
  if (!('caches' in window)) {
    return [];
  }

  const cache = await caches.open('zcg-media-files-v1');
  const keys = await cache.keys();
  const filesInfo: MediaFileInfo[] = [];

  for (const request of keys) {
    const url = request.url;
    const pathname = new URL(url).pathname;
    
    // 确定文件类别
    let category = 'unknown';
    let updateInterval = 0;
    
    for (const [key, config] of Object.entries(CACHE_CONFIG)) {
      if (pathname.startsWith(config.path) || (config.path === '/' && pathname.startsWith('/'))) {
        const hasValidExtension = config.extensions.some(ext => 
          pathname.toLowerCase().endsWith(ext)
        );
        const isSpecificFile = 'files' in config && Array.isArray(config.files) && config.files.some(file => 
          pathname.endsWith(file)
        );
        
        if (hasValidExtension || isSpecificFile) {
          category = key;
          updateInterval = config.updateInterval;
          break;
        }
      }
    }

    const response = await cache.match(request);
    if (response) {
      const blob = await response.blob();
      const lastModified = response.headers.get('last-modified');
      const lastCheckKey = `last_check_${url}`;
      const lastCheck = localStorage.getItem(lastCheckKey);
      const now = Date.now();
      
      filesInfo.push({
        url,
        size: blob.size,
        lastModified: lastModified ? new Date(lastModified).getTime() : 0,
        category,
        updateInterval,
        lastCheck: lastCheck ? parseInt(lastCheck) : 0,
        needsUpdate: lastCheck ? (now - parseInt(lastCheck)) > updateInterval : false
      });
    }
  }

  return filesInfo;
}

// 清理所有缓存
export async function clearAllCaches(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  
  // 清理本地存储的检查时间
  const keys = Object.keys(localStorage);
  const checkKeys = keys.filter(key => key.startsWith('last_check_'));
  checkKeys.forEach(key => localStorage.removeItem(key));
  
  console.log('[CacheManager] 所有缓存已清理');
}

// 清理特定类别的缓存
export async function clearCategoryCache(category: string): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  const cache = await caches.open('zcg-media-files-v1');
  const keys = await cache.keys();
  const config = CACHE_CONFIG[category as keyof typeof CACHE_CONFIG];
  
  if (!config) {
    console.warn(`[CacheManager] 未知的缓存类别: ${category}`);
    return;
  }

  const deletedKeys: string[] = [];
  
  for (const request of keys) {
    const pathname = new URL(request.url).pathname;
    
    if (pathname.startsWith(config.path) || (config.path === '/' && pathname.startsWith('/'))) {
      const hasValidExtension = config.extensions.some(ext => 
        pathname.toLowerCase().endsWith(ext)
      );
      const isSpecificFile = 'files' in config && Array.isArray(config.files) && config.files.some(file => 
        pathname.endsWith(file)
      );
      
      if (hasValidExtension || isSpecificFile) {
        await cache.delete(request);
        deletedKeys.push(request.url);
        
        // 清理本地存储的检查时间
        localStorage.removeItem(`last_check_${request.url}`);
      }
    }
  }
  
  console.log(`[CacheManager] 已清理 ${category} 类别的 ${deletedKeys.length} 个文件`);
}

// 强制更新特定文件
export async function forceUpdateFile(url: string): Promise<boolean> {
  if (!('caches' in window) || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    // 通知 Service Worker 强制更新文件
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'FORCE_UPDATE_FILE',
        url
      });
    }
    
    // 清理本地存储的检查时间，强制下次检查
    localStorage.removeItem(`last_check_${url}`);
    
    console.log(`[CacheManager] 已请求强制更新文件: ${url}`);
    return true;
  } catch (error) {
    console.error(`[CacheManager] 强制更新文件失败: ${url}`, error);
    return false;
  }
}

// 强制更新特定类别的所有文件
export async function forceUpdateCategory(category: string): Promise<number> {
  if (!('caches' in window)) {
    return 0;
  }

  const filesInfo = await getMediaFilesInfo();
  const categoryFiles = filesInfo.filter(file => file.category === category);
  let updatedCount = 0;

  for (const file of categoryFiles) {
    const success = await forceUpdateFile(file.url);
    if (success) {
      updatedCount++;
    }
  }

  console.log(`[CacheManager] 已请求强制更新 ${category} 类别的 ${updatedCount} 个文件`);
  return updatedCount;
}

// 获取缓存统计信息
export async function getCacheStats() {
  const cacheInfos = await getCacheInfo();
  const mediaFiles = await getMediaFilesInfo();
  
  const totalSize = cacheInfos.reduce((sum, cache) => sum + cache.size, 0);
  const totalFiles = mediaFiles.length;
  
  const categoryStats = mediaFiles.reduce((stats, file) => {
    if (!stats[file.category]) {
      stats[file.category] = {
        count: 0,
        size: 0,
        needsUpdate: 0
      };
    }
    stats[file.category].count++;
    stats[file.category].size += file.size;
    if (file.needsUpdate) {
      stats[file.category].needsUpdate++;
    }
    return stats;
  }, {} as Record<string, { count: number; size: number; needsUpdate: number }>);

  return {
    totalSize,
    totalFiles,
    categoryStats,
    cacheCount: cacheInfos.length
  };
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化时间间隔
export function formatUpdateInterval(interval: number): string {
  const hours = interval / (1000 * 60 * 60);
  const days = hours / 24;
  
  if (days >= 1) {
    return `${Math.round(days)}天`;
  } else {
    return `${Math.round(hours)}小时`;
  }
}

// 检查是否需要更新（基于时间间隔）
export function shouldCheckUpdate(url: string, updateInterval: number): boolean {
  const lastCheckKey = `last_check_${url}`;
  const lastCheck = localStorage.getItem(lastCheckKey);
  const now = Date.now();
  
  return !lastCheck || (now - parseInt(lastCheck)) > updateInterval;
}

// 重置文件的检查时间
export function resetFileCheckTime(url: string): void {
  const lastCheckKey = `last_check_${url}`;
  localStorage.removeItem(lastCheckKey);
  console.log(`[CacheManager] 已重置文件检查时间: ${url}`);
} 