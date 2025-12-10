import request from '@/utils/request';
import { LoginParams, LoginResponse } from '@/types/auth';
import { BaseResponse } from '@/types/common';

/**
 * 认证相关API
 */
export const authApi = {
    // 登录
    login: (data: LoginParams) => {
        return request.post<BaseResponse<LoginResponse>>('/auth/login', data);
    },
    
    // 登出
    logout: () => {
        return request.post('/auth/logout');
    },

    // 刷新token
    refreshToken: () => {
        return request.post<{ token: string; token_type: string }>('/auth/refresh');
    }
}; 