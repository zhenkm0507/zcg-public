// Service Worker for media caching
const CACHE_NAME = 'zcg-media-cache-v1';
const MEDIA_CACHE_NAME = 'zcg-media-files-v1';

console.log('[SW] Service Worker 已加载');

// 安装事件
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker 安装中...');
  event.waitUntil(
    caches.open(MEDIA_CACHE_NAME).then((cache) => {
      console.log('[SW] 缓存存储已创建:', MEDIA_CACHE_NAME);
      return cache;
    })
  );
});

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker 已激活');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== MEDIA_CACHE_NAME) {
            console.log('[SW] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 需要缓存的目录和文件类型
const CACHE_CONFIG = {
  // 音频目录
  audios: {
    path: '/audios/',
    extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
    cacheStrategy: 'cache-first',
    updateStrategy: 'stale-while-revalidate', // 改为先缓存后更新
    updateInterval: 24 * 60 * 60 * 1000 // 24小时检查一次更新
  },
  // 视频目录
  videos: {
    path: '/videos/',
    extensions: ['.mp4', '.webm', '.ogg', '.mov'],
    cacheStrategy: 'cache-first',
    updateStrategy: 'stale-while-revalidate', // 改为先缓存后更新
    updateInterval: 24 * 60 * 60 * 1000 // 24小时检查一次更新
  },
  // 图片目录
  images: {
    path: '/images/',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
    cacheStrategy: 'cache-first',
    updateStrategy: 'stale-while-revalidate',
    updateInterval: 7 * 24 * 60 * 60 * 1000 // 7天检查一次更新
  },
  // 图标目录
  icons: {
    path: '/icons/',
    extensions: ['.svg', '.png', '.ico'],
    cacheStrategy: 'cache-first',
    updateStrategy: 'stale-while-revalidate',
    updateInterval: 30 * 24 * 60 * 60 * 1000 // 30天检查一次更新
  },
  // 根目录静态资源
  root: {
    path: '/',
    extensions: ['.png', '.svg', '.ico'],
    files: ['apple-touch-icon.png', 'globe.svg', 'next.svg', 'vercel.svg', 'window.svg', 'file.svg'],
    cacheStrategy: 'cache-first',
    updateStrategy: 'stale-while-revalidate',
    updateInterval: 7 * 24 * 60 * 60 * 1000 // 7天检查一次更新
  }
};

// 检测设备类型和浏览器
function detectDeviceAndBrowser() {
  const userAgent = navigator.userAgent;
  const isIPad = /iPad/.test(userAgent) || (/Macintosh/.test(userAgent) && 'ontouchend' in document);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent);
  
  return {
    isIPad,
    isSafari,
    isChrome,
    browser: isSafari ? 'safari' : isChrome ? 'chrome' : 'other'
  };
}

// 根据设备和浏览器调整缓存策略
function getAdjustedCacheStrategy(originalStrategy, fileType) {
  const { isIPad, browser } = detectDeviceAndBrowser();
  
  if (!isIPad) {
    return originalStrategy;
  }
  
  // iPad端特殊处理
  if (browser === 'safari') {
    // Safari更保守的策略
    return {
      ...originalStrategy,
      maxAge: Math.min(originalStrategy.maxAge || 86400000, 86400000), // 最大1天
      maxSize: Math.min(originalStrategy.maxSize || 10 * 1024 * 1024, 10 * 1024 * 1024), // 最大10MB
      updateInterval: Math.min(originalStrategy.updateInterval || 86400000, 3600000) // 最大1小时检查一次
    };
  } else if (browser === 'chrome') {
    // Chrome更激进的策略
    return {
      ...originalStrategy,
      maxAge: Math.max(originalStrategy.maxAge || 86400000, 7 * 24 * 60 * 60 * 1000), // 至少7天
      maxSize: Math.max(originalStrategy.maxSize || 50 * 1024 * 1024, 50 * 1024 * 1024), // 至少50MB
      updateInterval: Math.max(originalStrategy.updateInterval || 86400000, 7 * 24 * 60 * 60 * 1000) // 至少7天检查一次
    };
  }
  
  return originalStrategy;
}

// 修改shouldCacheFile函数以使用调整后的策略
function shouldCacheFile(url) {
  const pathname = new URL(url).pathname;
  
  for (const [key, config] of Object.entries(CACHE_CONFIG)) {
    if (pathname.startsWith(config.path) || (config.path === '/' && pathname.startsWith('/'))) {
      const hasValidExtension = config.extensions.some(ext => 
        pathname.toLowerCase().endsWith(ext)
      );
      const isSpecificFile = config.files && config.files.some(file => 
        pathname.endsWith(file)
      );
      
      if (hasValidExtension || isSpecificFile) {
        const adjustedStrategy = getAdjustedCacheStrategy(config, key);
        return {
          shouldCache: true,
          strategy: adjustedStrategy.cacheStrategy,
          updateStrategy: adjustedStrategy.updateStrategy,
          updateInterval: adjustedStrategy.updateInterval,
          maxAge: adjustedStrategy.maxAge,
          maxSize: adjustedStrategy.maxSize,
          category: key
        };
      }
    }
  }
  
  return { shouldCache: false };
}

// 获取文件哈希（基于 ETag 或 Last-Modified）
async function getFileHash(response) {
  const etag = response.headers.get('etag');
  const lastModified = response.headers.get('last-modified');
  const contentLength = response.headers.get('content-length');
  
  // 使用 ETag 作为主要哈希，如果没有则使用 Last-Modified + Content-Length
  return etag || `${lastModified}-${contentLength}` || Date.now().toString();
}

// 检查文件是否已更新
async function isFileUpdated(request, cachedResponse) {
  try {
    // 发送条件请求检查文件是否更新
    const networkResponse = await fetch(request, {
      method: 'HEAD',
      cache: 'no-cache'
    });
    
    if (networkResponse.status === 304) {
      // 文件未更新
      return false;
    }
    
    if (networkResponse.status === 200) {
      // 文件已更新，比较哈希
      const cachedHash = await getFileHash(cachedResponse);
      const networkHash = await getFileHash(networkResponse);
      
      return cachedHash !== networkHash;
    }
    
    return false;
  } catch (error) {
    console.warn('[SW] 检查文件更新失败:', error);
    return false;
  }
}

// 检查是否需要更新（基于时间间隔）
function shouldCheckUpdate(url, updateInterval) {
  // Service Worker 不能直接访问 localStorage，使用 IndexedDB 或简化逻辑
  // 简化版本：总是检查更新，但限制频率
  const now = Date.now();
  const urlHash = btoa(url).slice(0, 10); // 简单的URL哈希
  const lastCheckKey = `last_check_${urlHash}`;
  
  // 使用 Cache API 存储时间戳
  return caches.open('update-timestamps').then(cache => {
    return cache.match(lastCheckKey).then(response => {
      const lastCheck = response ? parseInt(response.text()) : 0;
      
      if (!lastCheck || (now - lastCheck) > updateInterval) {
        // 更新时间戳
        const timestampResponse = new Response(now.toString());
        cache.put(lastCheckKey, timestampResponse);
        return true;
      }
      
      return false;
    });
  }).catch(() => {
    // 如果出错，默认检查更新
    return true;
  });
}

// 缓存优先策略（默认）
async function cacheFirst(request, cache) {
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log(`[SW] 缓存优先 - 返回缓存: ${new URL(request.url).pathname}`);
    return cachedResponse;
  }
  
  // 缓存没有，从网络获取
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log(`[SW] 缓存优先 - 缓存新文件: ${new URL(request.url).pathname}`);
    }
    return networkResponse;
  } catch (error) {
    console.warn(`[SW] 网络请求失败: ${new URL(request.url).pathname}`, error);
    return new Response('网络错误', { status: 404 });
  }
}

// 先缓存后更新策略（智能更新）
async function staleWhileRevalidate(request, cache, updateInterval) {
  const cachedResponse = await cache.match(request);
  const url = request.url;
  
  // 检查是否需要更新
  const needsUpdate = await shouldCheckUpdate(url, updateInterval);
  
  if (cachedResponse && !needsUpdate) {
    // 有缓存且不需要检查更新，直接返回
    console.log(`[SW] 先缓存后更新 - 返回缓存: ${new URL(url).pathname}`);
    return cachedResponse;
  }
  
  // 后台检查更新（如果有缓存）或获取新文件（如果没有缓存）
  const updatePromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      if (cachedResponse && needsUpdate) {
        // 检查文件是否真的更新了
        const isUpdated = await isFileUpdated(request, cachedResponse);
        if (isUpdated) {
          console.log(`[SW] 检测到文件更新: ${new URL(url).pathname}`);
          cache.put(request, networkResponse.clone());
        } else {
          console.log(`[SW] 文件未更新: ${new URL(url).pathname}`);
        }
      } else {
        // 新文件，直接缓存
        cache.put(request, networkResponse.clone());
        console.log(`[SW] 缓存新文件: ${new URL(url).pathname}`);
      }
    }
  }).catch(error => {
    console.warn(`[SW] 后台更新失败: ${new URL(url).pathname}`, error);
  });
  
  // 立即返回缓存内容（如果有）
  if (cachedResponse) {
    console.log(`[SW] 先缓存后更新 - 返回缓存: ${new URL(url).pathname}`);
    return cachedResponse;
  }
  
  // 没有缓存，等待网络请求
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log(`[SW] 先缓存后更新 - 缓存新文件: ${new URL(url).pathname}`);
    }
    return networkResponse;
  } catch (error) {
    console.warn(`[SW] 网络请求失败: ${new URL(url).pathname}`, error);
    return new Response('网络错误', { status: 404 });
  }
}

// 安装事件
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker 安装中...');
  event.waitUntil(
    caches.open(MEDIA_CACHE_NAME).then((cache) => {
      console.log('[SW] Service Worker 缓存已准备就绪');
      return cache;
    })
  );
});

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker 激活中...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== MEDIA_CACHE_NAME && cacheName !== CACHE_NAME) {
            console.log('[SW] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 检查是否应该缓存这个文件
  const cacheInfo = shouldCacheFile(request.url);
  
  if (cacheInfo.shouldCache) {
    console.log(`[SW] 处理文件: ${url.pathname} (${cacheInfo.category}, ${cacheInfo.updateStrategy})`);
    
    event.respondWith(
      caches.open(MEDIA_CACHE_NAME).then((cache) => {
        // 根据更新策略选择缓存方法
        switch (cacheInfo.updateStrategy) {
          case 'stale-while-revalidate':
            return staleWhileRevalidate(request, cache, cacheInfo.updateInterval);
          case 'cache-first':
          default:
            return cacheFirst(request, cache);
        }
      })
    );
  }
});

// 清理缓存
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW] 清理缓存:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
  
  // 强制更新特定文件
  if (event.data && event.data.type === 'FORCE_UPDATE_FILE') {
    const { url } = event.data;
    event.waitUntil(
      caches.open(MEDIA_CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(url, { cache: 'no-cache' });
          if (response.ok) {
            await cache.put(url, response.clone());
            console.log(`[SW] 强制更新文件: ${url}`);
          }
        } catch (error) {
          console.error(`[SW] 强制更新失败: ${url}`, error);
        }
      })
    );
  }
}); 