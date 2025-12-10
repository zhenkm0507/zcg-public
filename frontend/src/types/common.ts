/**
 * 通用响应类型
 */
export interface BaseResponse<T> {
    code: number;
    message: string;
    data: T;
}

/**
 * 分页参数类型
 */
export interface PaginationParams {
    page: number;
    size: number;
    total: number;
}

/**
 * 分页响应类型
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
} 