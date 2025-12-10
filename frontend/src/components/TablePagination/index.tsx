import { TablePaginationConfig } from 'antd/es/table';

export interface TablePaginationProps {
  /** 每页显示条数 */
  pageSize?: number;
  /** 是否显示每页条数选择器 */
  showSizeChanger?: boolean;
  /** 是否显示快速跳转 */
  showQuickJumper?: boolean;
  /** 是否显示总数 */
  showTotal?: boolean;
  /** 总数文本 */
  totalText?: string;
  /** 每页条数选项 */
  pageSizeOptions?: string[];
}

/**
 * 获取表格分页配置
 * @param props 分页配置属性
 * @returns TablePaginationConfig
 */
export const getTablePagination = (props: TablePaginationProps = {}): any => {
  const {
    pageSize = 500,
    showSizeChanger = true,
    showQuickJumper = true,
    showTotal = true,
    totalText = '共 {total} 条',
    pageSizeOptions = ['20', '50', '100', '200', '500']
  } = props;

  return {
    pageSize,
    showSizeChanger,
    showQuickJumper,
    showTotal: showTotal ? (total: number) => totalText.replace('{total}', total.toString()) : undefined,
    pageSizeOptions,
  };
}; 