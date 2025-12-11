// API配置
export const API_CONFIG = {
    // API基础URL
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.101:8000',
    
    // API版本
    VERSION: 'v1',
    
    // API前缀
    PREFIX: '/api',
    
    // 超时时间（毫秒）
    TIMEOUT: 30000,
    
    // 请求头
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    
    // 获取完整的API URL
    getFullUrl: (path: string) => {
        return `${API_CONFIG.BASE_URL}${API_CONFIG.PREFIX}/${API_CONFIG.VERSION}${path}`;
    }
}; 