/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  env: {
    // 这里可以添加额外的环境变量
  },
  // 输出为独立模式，用于Docker部署
  output: 'standalone',
  // 忽略 Ant Design 的兼容性警告
  webpack: (config, { isServer }) => {
    config.ignoreWarnings = [
      { module: /node_modules\/antd/ },
    ];
    return config;
  },
  // 配置静态文件缓存策略
  async headers() {
    return [
      {
        // Next.js 静态资源统一缓存策略（1天）
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400', // 缓存1天
          },
        ],
      },
      {
        // 媒体文件长期缓存策略（1年）
        source: '/(audios|videos|images|icons)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 缓存1年
          },
        ],
      },
      {
        // Service Worker 文件不应该被缓存
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },

};

module.exports = nextConfig; 