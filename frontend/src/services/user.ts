import request from '@/utils/request';
import { User } from '@/types';
import { BaseResponse } from '@/types';
import { UserDto, UpdateUserInfoRequest } from '@/types/user';

/**
 * 用户相关API
 */
export const userApi = {
    // 获取用户信息
    getUserInfo: () => {
        return request.get<BaseResponse<UserDto>>('/user/get_user_info_by_id');
    },
    
    // 切换词库
    switchWordBank: (wordBankId: number) => {
        return request.get<BaseResponse<void>>(`/study/switch_word_bank?word_bank_id=${wordBankId}`);
    },

    updateUserInfo: (data: UpdateUserInfoRequest) => {
        return request.post<BaseResponse<void>>('/user/update_user_info', data);
    }
}; 