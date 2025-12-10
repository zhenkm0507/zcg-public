// 获取token
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// 获取token类型
export const getTokenType = (): string | null => {
  return localStorage.getItem('token_type');
};

// 设置token
export const setToken = (token: string, tokenType: string): void => {
  localStorage.setItem('token', token);
  localStorage.setItem('token_type', tokenType);
};

// 清除token
export const clearToken = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('token_type');
};

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  return !!getToken();
}; 