import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, InputNumber, Button, Tag, Space, message } from 'antd';
import styles from './page.module.css';
import { userApi } from '@/services/user';
import { incentiveApi, UserWordBankProfile } from '@/services/incentive';
import { RESOURCE_CONFIG } from '@/config/resource';
// 这里省略表单相关props和逻辑，实际迁移时请补充

const ProfileSection: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState<any>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [successHighlight, setSuccessHighlight] = useState(false);
  const buttonRef = useRef<any>(null);
  const [profileData, setProfileData] = useState<UserWordBankProfile | null>(null);

  useEffect(() => {
    // 并行请求个人Profile和用户信息
    incentiveApi.getUserWordBankProfile().then(res => {
      setProfileData(res.data.data);
    });
    userApi.getUserInfo().then(res => {
      const data = res.data.data;
      setInitialValues(data);
      setTags(data.word_flags || []);
      form.setFieldsValue({
        ...data,
        word_flags: undefined
      });
    });
  }, [form]);

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      await userApi.updateUserInfo({
        ...values,
        word_flags: tags
      });
      message.success('保存成功');
      setSuccessHighlight(true);
      setTimeout(() => setSuccessHighlight(false), 1000);
    } catch (e) {
      message.error('保存失败');
    } finally {
      setLoading(false);
      buttonRef.current?.blur();
    }
  };

  return (
    <div className={styles.profileLayout}>
      {/* 左侧：只保留头像 */}
      <div className={styles.profileSidebar}>
        <div className={styles.avatarGlow}>
          <div className={styles.avatarWrapper}>
            <img
              src={profileData?.image_path ? RESOURCE_CONFIG.getResourceFullUrl(profileData.image_path) : RESOURCE_CONFIG.getResourceFullUrl('/images/armors/xuanyi.jpg')}
              alt="个人肖像"
              className={styles.avatarImg}
            />
          </div>
        </div>
      </div>
      
      {/* 右侧：用户信息和表单 */}
      <div className={styles.profileFormCard}>
        <div className={styles.profileContent}>
          {/* 上半部分：用户级别和成长信息 */}
          <div className={styles.userInfoSection}>
            <div className={styles.levelBadgeBlock}>
              <div className={styles.levelLabel}>用户级别</div>
              <div className={styles.levelBadgeBig}>
                <span className={styles.levelBadgeIcon}>🥋</span>
                <span>{profileData?.user_level_name || '功夫小子'}</span>
              </div>
            </div>
            <div className={styles.growthInfoRow}>
              <div className={styles.growthCapsule}>
                <span className={styles.growthIcon}>⭐</span>
                <div className={styles.growthLabel}>经验值</div>
                <div className={styles.growthValue}>{profileData?.experience_value ?? 96}</div>
              </div>
              <div className={styles.growthCapsule}>
                <span className={styles.growthIcon}>🔥</span>
                <div className={styles.growthLabel}>士气值</div>
                <div className={styles.growthValue}>{profileData?.morale_value ?? 76}</div>
              </div>
            </div>
          </div>

          {/* 下半部分：表单 */}
          <div className={styles.formSection}>
            <Form
              form={form}
              layout="vertical"
              initialValues={initialValues || {}}
              onFinish={handleFinish}
            >
              <Form.Item
                label="用户昵称"
                name="nick_name"
                rules={[{ required: true, message: '请输入用户昵称' }]}
              >
                <Input placeholder="请输入用户昵称" maxLength={10} className={styles.nicknameInput} autoCapitalize="off" autoCorrect="off" />
              </Form.Item>

              <Form.Item
                label="修罗词阈值"
                name="asura_word_threshold"
                rules={[{ required: true, message: '请输入修罗词阈值' }]}
                tooltip="背词失败数超过这个阈值的单词，会出现在淬词坊里"
              >
                <InputNumber min={1} max={10} placeholder="请输入修罗词阈值" className={styles.numberInput} />
              </Form.Item>

              <Form.Item
                label="单词标签"
                name="word_flags"
              >
                <div className={styles.tagContainer}>
                  <Space size={[0, 8]} wrap>
                    {tags.map(tag => (
                      <Tag
                        key={tag}
                        closable
                        onClose={() => {
                          const newTags = tags.filter(t => t !== tag);
                          setTags(newTags);
                        }}
                        className={styles.tag}
                      >
                        {tag}
                      </Tag>
                    ))}
                    {inputVisible ? (
                      <Input
                        type="text"
                        size="small"
                        className={styles.tagInput}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={() => {
                          if (inputValue && inputValue.trim() && !tags.includes(inputValue.trim())) {
                            setTags([...tags, inputValue.trim()]);
                          }
                          setInputVisible(false);
                          setInputValue('');
                        }}
                        onPressEnter={() => {
                          if (inputValue && inputValue.trim() && !tags.includes(inputValue.trim())) {
                            setTags([...tags, inputValue.trim()]);
                          }
                          setInputVisible(false);
                          setInputValue('');
                        }}
                        autoFocus
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    ) : (
                      <Tag onClick={() => setInputVisible(true)} className={styles.tagPlus}>
                        + 添加标签
                      </Tag>
                    )}
                  </Space>
                </div>
              </Form.Item>

              <Form.Item>
                <Button
                  ref={buttonRef}
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className={
                    successHighlight
                      ? `${styles.profileSaveBtn} ${styles.profileSaveBtnSuccess}`
                      : styles.profileSaveBtn
                  }
                >
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection; 