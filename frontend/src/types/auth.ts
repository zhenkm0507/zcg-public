import { User } from './user';

/**
 * 用户登录参数
 */
export interface LoginParams {
    username: string;
    password: string;
}

/**
 * 用户登录响应
 */
export interface LoginResponse {
    username: string;
    level: string;
    welcome_message: string;
    token: string;
    token_type: string;
    is_need_select_word_bank: boolean;
}