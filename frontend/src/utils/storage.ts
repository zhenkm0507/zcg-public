/**
 * 获取当前词库ID
 */
export const getCurrentWordBankId = (): number | null => {
  const id = localStorage.getItem('current_word_bank_id');
  // console.log(`[Storage] 从本地存储获取词库ID: ${id}`);
  return id ? Number(id) : null;
};

/**
 * 设置当前词库ID
 */
export const setCurrentWordBankId = (id: number): void => {
  console.log(`[Storage] 设置词库ID到本地存储: ${id}`);
  localStorage.setItem('current_word_bank_id', id.toString());
};

/**
 * 清除当前词库ID
 */
export const clearCurrentWordBankId = (): void => {
  console.log('[Storage] 清除本地存储的词库ID');
  localStorage.removeItem('current_word_bank_id');
}; 