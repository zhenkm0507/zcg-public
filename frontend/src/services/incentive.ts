import request from '@/utils/request';
import { BaseResponse } from '@/types';

// 奖品类型枚举
export enum AwardType {
  TREASURE = 1, // 珍宝
  MANUAL = 2,   // 秘籍
  SWORD = 3,    // 宝剑
  ARMOR = 4     // 盔甲
}

// 奖品信息接口
export interface AwardItem {
  id: number;
  name: string;
  num: number;
  is_unlocked: boolean;
  description: string;
  image_path: string;
  video_path?: string;
}

// 奖品类型信息接口
export interface AwardTypeInfo {
  award_type: AwardType;
  award_type_name: string;
  award_list: AwardItem[];
}

// 获取用户词库奖品信息响应接口
export interface GetUserWordBankAwardListResponse {
  data: AwardTypeInfo[];
}

// 用户词库个人Profile接口
export interface UserWordBankProfile {
  user_id: number;
  word_bank_id: number;
  user_level: number;
  user_level_name: string;
  experience_value: number;
  morale_value: number;
  image_path: string;
}

// incentive API
export const incentiveApi = {
  // 获取用户词库奖品信息
  getUserWordBankAwardList: () => {
    return request.get<BaseResponse<AwardTypeInfo[]>>('/incentive/get_user_word_bank_award_list');
  },
  // 获取用户词库个人Profile信息
  getUserWordBankProfile: () => {
    return request.get<BaseResponse<UserWordBankProfile>>('/incentive/get_user_word_bank_profile');
  }
}; 