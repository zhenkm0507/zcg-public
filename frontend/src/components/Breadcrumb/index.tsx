'use client';

import { Breadcrumb as AntBreadcrumb } from 'antd';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './index.module.css';
import type { FC } from 'react';

// 从Layout组件中导入菜单配置
const menuItems = [
  {
    key: '/',
    label: '登科堂',
  },
  {
    key: '/study/battle',
    label: '墨耕斋',
    hasRoute: false, // 标记没有实际路由
    children: [
      {
        key: '/study/battle/battle',
        label: '斩词',
      },
      {
        key: '/study/battle/batches',
        label: '斩词批次设置',
      },
      {
        key: '/study/battle/set_flags',
        label: '标签设置',
      },
    ],
  },
  {
    key: '/study/hard_word',
    label: '淬词坊',
  },
  {
    key: '/study/records',
    label: '汗青廊',
  },
  {
    key: '/study/word_bank',
    label: '藏经枢',
    hasRoute: false, // 标记没有实际路由
    children: [
      {
        key: '/study/word_bank/list',
        label: '单词列表',
      },
      {
        key: '/study/word_bank/inflections',
        label: '变形形式',
      },
    ],
  },
  {
    key: '/settings',
    label: '揽月台',
  },
];

interface BreadcrumbProps {
  className?: string;
}

const Breadcrumb: FC<BreadcrumbProps> = ({ className }) => {
  const pathname = usePathname();

  // 递归查找菜单项
  const findMenuItem = (items: any[], path: string): any[] => {
    for (const item of items) {
      if (item.key === path) {
        return [item];
      }
      if (item.children) {
        const found = findMenuItem(item.children, path);
        if (found.length > 0) {
          return [item, ...found];
        }
      }
    }
    return [];
  };

  // 获取面包屑项
  const getBreadcrumbItems = () => {
    const items = findMenuItem(menuItems, pathname);
    
    return items.map((item, index) => ({
      title: item.label,
      path: item.key,
      isLast: index === items.length - 1,
      hasRoute: item.hasRoute !== false // 默认有路由，除非明确标记为false
    }));
  };

  const items = getBreadcrumbItems();

  if (items.length === 0) return null;

  return (
    <div className={className ? `${styles.breadcrumb} ${className}` : styles.breadcrumb}>
      <AntBreadcrumb
        items={items.map((item) => ({
          title: item.isLast || !item.hasRoute ? (
            item.title
          ) : (
            <Link href={item.path}>{item.title}</Link>
          )
        }))}
      />
    </div>
  );
};

export default Breadcrumb; 