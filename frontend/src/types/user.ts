/**
 * 用户类型
 */
export interface User {
    username: string;
    nick_name: string;
    level?: number;
    current_word_bank_id?: number;
}

export interface UserDto {
  id: number;
  username: string;
  nick_name: string;
  current_word_bank_id?: number;
  word_flags?: string[];
  asura_word_threshold?: number;
}

export interface UpdateUserInfoRequest extends UserDto {}