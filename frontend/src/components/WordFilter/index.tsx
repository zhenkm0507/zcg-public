import React, { useState, useEffect, useCallback } from 'react';
import { Input, Checkbox, Space, Card, Tooltip, Typography } from 'antd';
import { SearchOutlined, AppstoreAddOutlined, AppstoreOutlined } from '@ant-design/icons';
import styles from './index.module.css';
import { studyApi } from '@/services/study';
import { getCurrentWordBankId } from '@/utils/storage';

const { Text } = Typography;

interface WordFilterProps {
  onFilterChange: (filters: { 
    keyword: string; 
    selectedTags: string[];
    tagFilterMode: 'or' | 'and';
  }) => void;
  showTagFilter?: boolean; // 控制是否显示标签筛选区域，默认为true
  placeholder?: string; // 自定义输入框提示文字
}

const WordFilter: React.FC<WordFilterProps> = ({ onFilterChange, showTagFilter = true, placeholder = "输入单词或中文释义进行搜索" }) => {
  const [keyword, setKeyword] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagFilterMode, setTagFilterMode] = useState<'or' | 'and'>('or');
  const [customTag, setCustomTag] = useState('');
  const [isCustomTagSelected, setIsCustomTagSelected] = useState(false);

  useEffect(() => {
    // 获取标签数据
    const fetchTags = async () => {
      try {
        const response = await studyApi.getUserFlags();
        if (response.data.code === 0) {
          setTags(response.data.data);
        }
      } catch (error) {
        console.error('获取标签失败:', error);
      }
    };

    const currentWordBankId = getCurrentWordBankId();
    if (currentWordBankId) {
      fetchTags();
    }
  }, []);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKeyword = e.target.value;
    setKeyword(newKeyword);
    
    // 计算新的标签列表
    const allTags = [...selectedTags];
    if (isCustomTagSelected && customTag.trim()) {
      allTags.push(customTag.trim());
    }
    
    onFilterChange({
      keyword: newKeyword,
      selectedTags: allTags,
      tagFilterMode,
    });
  };

  const handleTagChange = (checkedValues: string[]) => {
    setSelectedTags(checkedValues);
    
    // 计算新的标签列表
    const allTags = [...checkedValues];
    if (isCustomTagSelected && customTag.trim()) {
      allTags.push(customTag.trim());
    }
    
    onFilterChange({
      keyword,
      selectedTags: allTags,
      tagFilterMode,
    });
  };

  const handleFilterModeChange = (mode: 'or' | 'and') => {
    setTagFilterMode(mode);
    
    // 计算新的标签列表
    const allTags = [...selectedTags];
    if (isCustomTagSelected && customTag.trim()) {
      allTags.push(customTag.trim());
    }
    
    onFilterChange({
      keyword,
      selectedTags: allTags,
      tagFilterMode: mode,
    });
  };

  const handleCustomTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCustomTag = e.target.value;
    setCustomTag(newCustomTag);
    
    // 计算新的标签列表
    const allTags = [...selectedTags];
    if (isCustomTagSelected && newCustomTag.trim()) {
      allTags.push(newCustomTag.trim());
    }
    
    onFilterChange({
      keyword,
      selectedTags: allTags,
      tagFilterMode,
    });
  };

  const handleCustomTagCheckboxChange = (checked: boolean) => {
    setIsCustomTagSelected(checked);
    
    // 计算新的标签列表
    const allTags = [...selectedTags];
    if (checked && customTag.trim()) {
      allTags.push(customTag.trim());
    }
    
    onFilterChange({
      keyword,
      selectedTags: allTags,
      tagFilterMode,
    });
  };

  return (
    <Card className={styles.filterCard}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div className={styles.filterHeader}>
          <Text style={{ fontSize: '14px', color: '#666' }}>筛选区域</Text>
        </div>
        <Input
          placeholder={placeholder}
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={handleKeywordChange}
          allowClear
          autoCapitalize="off"
        />
        {showTagFilter && (
          <div className={styles.filterRow}>
            <div className={styles.tagContainer}>
              <Checkbox.Group
                options={tags}
                value={selectedTags}
                onChange={handleTagChange}
              />
              <div className={styles.customTagContainer}>
                <Checkbox
                  checked={isCustomTagSelected}
                  onChange={(e) => handleCustomTagCheckboxChange(e.target.checked)}
                >
                  <div className={styles.customTagInputWrapper}>
                    <Input
                      placeholder="输入自定义标签"
                      value={customTag}
                      onChange={handleCustomTagChange}
                      size="small"
                      style={{ width: 100 }}
                      autoCapitalize="off"
                    />
                  </div>
                </Checkbox>
              </div>
            </div>
            <div className={styles.filterMode}>
              <Tooltip title="标签取并集（满足任一标签）">
                <AppstoreAddOutlined 
                  className={`${styles.filterIcon} ${tagFilterMode === 'or' ? styles.active : ''}`}
                  onClick={() => handleFilterModeChange('or')}
                />
              </Tooltip>
              <Tooltip title="标签取交集（满足所有标签）">
                <AppstoreOutlined 
                  className={`${styles.filterIcon} ${tagFilterMode === 'and' ? styles.active : ''}`}
                  onClick={() => handleFilterModeChange('and')}
                />
              </Tooltip>
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default WordFilter; 