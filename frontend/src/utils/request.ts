import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { message } from 'antd';
import { API_CONFIG } from '@/config/api';
import { getToken } from './auth';
import { getCurrentWordBankId } from './storage';
import { BaseResponse } from '@/types';

// 创建axios实例
const request = axios.create({
    baseURL: `${API_CONFIG.BASE_URL}${API_CONFIG.PREFIX}/${API_CONFIG.VERSION}`,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.HEADERS,
});

// 请求拦截器
request.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加当前词库ID到请求头
        const currentWordBankId = getCurrentWordBankId();
        if (currentWordBankId) {
            //console.log(`[请求拦截器] 添加词库ID到请求头: ${currentWordBankId}`);
            config.headers['current-word-bank-id'] = currentWordBankId.toString();
        } else {
            console.log('[请求拦截器] 未找到词库ID，不添加header');
        }

        // 确保POST请求的数据被正确发送
        if (config.method === 'post' && config.data) {
            config.headers['Content-Type'] = 'application/json';
        }

        const fullUrl = `${config.baseURL}${config.url}`;
        console.log('发送请求:', {
            url: fullUrl,
            method: config.method,
            headers: config.headers,
            data: config.data,
            baseURL: config.baseURL,
            timeout: config.timeout
        });
        // message.info(`发送请求: ${fullUrl}`, 3); 
        return config;
    },
    (error) => {
        console.error('请求拦截器错误:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器
request.interceptors.response.use(
    <T>(response: AxiosResponse<BaseResponse<T> | Blob>) => {
        // console.log('收到响应:', {
        //     url: response.config.url,
        //     status: response.status,
        //     data: response.data,
        //     headers: response.headers
        // });

        // 如果是blob类型响应，直接返回
        if (response.data instanceof Blob) {
            return response;
        }

        const { data } = response;

        // 处理业务错误
        if (data.code !== 0) {
            const errorMessage = data.message || '请求失败';
            message.error(errorMessage);
            throw new Error(errorMessage);
        }

        return response;
    },
    (error: AxiosError<{ message: string }>) => {
        // 检查是否是网络错误
        if (!error.response && !error.request) {
            console.error('网络错误:', {
                message: error.message,
                code: error.code,
                name: error.name,
                stack: error.stack,
                config: error.config
            });
            
            // 在iPad等移动端，输出更详细的错误信息便于排查
            let detail = `网络连接失败: ${error.message}`;
            if (error.code) detail += ` | code: ${error.code}`;
            if (error.config?.url) detail += ` | url: ${error.config.url}`;
            if (error.config?.baseURL) detail += ` | baseURL: ${error.config.baseURL}`;
            if (error.config?.method) detail += ` | method: ${error.config.method}`;
            if (error.config?.headers) detail += ` | headers: ${JSON.stringify(error.config.headers)}`;
            if (error.stack) detail += ` | stack: ${error.stack}`;
            
            message.error(detail, 10);
            throw error;
        }

        // 检查是否收到响应
        if (error.response) {
            const { status, data, config } = error.response;
            console.log('服务器响应错误:', {
                url: config.url,
                status,
                data,
                headers: error.response.headers
            });
            let detail = `响应异常: ${error.message}`;
            if (error.code) detail += ` | code: ${error.code}`;
            if (error.config && error.config.url) detail += ` | url: ${error.config.url}`;
            if (error.config && error.config.baseURL) detail += ` | baseURL: ${error.config.baseURL}`;
            if (error.response.status) detail += ` | status: ${error.response.status}`;
            if (error.response.data) detail += ` | data: ${JSON.stringify(error.response.data)}`;
            
            // 在iPad等移动端，显示更详细的错误信息
            if (typeof window !== 'undefined' && window.navigator.userAgent.includes('iPad')) {
                detail += ` | 完整URL: ${error.config?.baseURL}${error.config?.url}`;
                detail += ` | 请求方法: ${error.config?.method}`;
                detail += ` | 请求头: ${JSON.stringify(error.config?.headers)}`;
            }
            
            message.error(detail, 15);
            
            // 处理401错误
            if (status === 401) {
                // 如果是登录接口，只显示错误消息
                if (config.url === '/auth/login') {
                    const errorMessage = data?.message || '用户名或密码错误';
                    message.error(errorMessage);
                } else {
                    // 其他接口的401错误，清除token并直接跳转到登录页，不显示错误消息
                    localStorage.removeItem('token');
                    localStorage.removeItem('token_type');
                    window.location.href = '/login';
                }
            } else if (status === 400) {
                // 处理400错误
                const errorMessage = data?.message || '请求参数错误';
                message.error(errorMessage);
            } else if (status === 422) {
                // 处理422错误，不弹窗显示
                console.log('422错误，不弹窗:', data?.message || '请求参数验证失败');
            } else {
                // 处理其他HTTP错误
                const errorMessage = data?.message || `请求失败 (${status})`;
                message.error(errorMessage);
            }
        } else if (error.request) {
            console.error('请求超时或服务器无响应:', {
                url: error.config?.url,
                method: error.config?.method,
                timeout: error.config?.timeout,
                headers: error.config?.headers
            });
            let detail = `请求异常: ${error.message}`;
            if (error.code) detail += ` | code: ${error.code}`;
            if (error.config && error.config.url) detail += ` | url: ${error.config.url}`;
            if (error.config && error.config.baseURL) detail += ` | baseURL: ${error.config.baseURL}`;
            if (error.stack) detail += ` | stack: ${error.stack}`;
            if (error.request) detail += ` | request: ${JSON.stringify(error.request)}`;
            message.error(detail, 10);
            //message.error('服务器无响应，请稍后重试');
        }

        throw error;
    }
);

export default request; 