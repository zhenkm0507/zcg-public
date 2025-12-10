import { useState, useEffect } from 'react';
import { Modal, Select, message, Spin, ConfigProvider } from 'antd';
import { userApi, wordApi } from '@/services';
import { WordBankDto } from '@/types';
import { setCurrentWordBankId } from '@/utils/storage';
import styles from './wordBankSelector.module.css';

const { Option } = Select;

interface WordBankSelectorProps {
  visible: boolean;
  onClose: () => void;
}

const WordBankSelector = ({ visible, onClose }: WordBankSelectorProps) => {
  const [wordBanks, setWordBanks] = useState<WordBankDto[]>([]);
  const [selectedWordBankId, setSelectedWordBankId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 获取词库列表
  useEffect(() => {
    const fetchWordBanks = async () => {
      if (!visible) return;
      
      setLoading(true);
      try {
        const response = await wordApi.getWordBankList();
        const wordBankList = response.data.data;
        setWordBanks(wordBankList);
        
        // 如果有词库，默认选中第一个
        if (wordBankList.length > 0) {
          console.log(`[WordBankSelector] 默认选中词库ID: ${wordBankList[0].id}`);
          setSelectedWordBankId(wordBankList[0].id);
        }
      } catch (error) {
        console.error('获取词库列表失败:', error);
        message.error('获取词库列表失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };

    fetchWordBanks();
  }, [visible]);

  // 处理确认选择
  const handleConfirm = async () => {
    if (!selectedWordBankId) {
      message.warning('请选择一个词库');
      return;
    }

    setSubmitting(true);
    try {
      console.log(`[WordBankSelector] 尝试切换到词库ID: ${selectedWordBankId}`);
      // 调用后端API切换词库
      const response = await userApi.switchWordBank(selectedWordBankId);
      
      // 如果后端返回成功
      if (response.data.code === 0) {
        console.log(`[WordBankSelector] 后端切换词库成功，更新前端存储: ${selectedWordBankId}`);
        // 保存到前端存储
        setCurrentWordBankId(selectedWordBankId);
        // 直接关闭弹窗并跳转，不显示成功消息
        onClose();
      } else {
        // 如果后端返回非0的code
        console.error(`[WordBankSelector] 后端切换词库失败，code: ${response.data.code}, message: ${response.data.message}`);
        message.error(response.data.message || '切换词库失败，请稍后重试');
      }
    } catch (error) {
      console.error('[WordBankSelector] 切换词库失败:', error);
      message.error('切换词库失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#000',
          colorPrimaryHover: '#333',
          colorPrimaryActive: '#333',
        },
      }}
    >
      <Modal
        title="请选择词库"
        open={visible}
        onOk={handleConfirm}
        onCancel={onClose}
        closable={false}
        maskClosable={false}
        confirmLoading={submitting}
        okButtonProps={{ disabled: !selectedWordBankId || loading }}
        cancelButtonProps={{ disabled: true }}
        okText="确定"
        cancelText="取消"
        centered
      >
        <div className={styles.container}>
          {loading ? (
            <div className={styles.loading}>
              <Spin size="large" />
              <p>加载词库列表中...</p>
            </div>
          ) : (
            <>
              <p className={styles.tip}>首次登录需要选择一个词库，请从下面的列表中选择：</p>
              <Select
                value={selectedWordBankId}
                onChange={value => setSelectedWordBankId(value)}
                placeholder="请选择词库"
                className={styles.select}
                size="large"
              >
                {wordBanks.map((bank) => (
                  <Option key={bank.id} value={bank.id}>
                    {bank.name}
                  </Option>
                ))}
              </Select>
            </>
          )}
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default WordBankSelector; 