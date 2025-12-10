import request from '@/utils/request';
import { BaseResponse, StatisticResponse, WordInitDto, WordBankDto } from '@/types';
import { message } from 'antd';
import type { WordListResponse, WordDetailResponse, InflectionResponse } from '@/types/word';

/**
 * 单词初始化相关API
 */
export const wordApi = {
    /**
     * 获取词库列表
     */
    getWordBankList: () => {
        return request.get<BaseResponse<WordBankDto[]>>('/word/word_bank_list');
    },
    
    /**
     * 获取单词初始化统计信息
     */
    getStatistic: () => {
        return request.get<BaseResponse<StatisticResponse>>('/word_init/statistic');
    },

    /**
     * 获取下一张待处理的图片
     */
    getNextPicture: async () => {
        try {
            console.log('开始请求下一张图片');
            const response = await request.get<Blob>('/word_init/picture', {
                responseType: 'blob',
                validateStatus: (status) => status === 200 // 只接受200状态码
            });
            
            // 打印所有响应头
            console.log('所有响应头:', {
                headers: response.headers,
                filePath: response.headers?.['file-path'],
                contentType: response.headers?.['content-type'],
                contentDisposition: response.headers?.['content-disposition']
            });
            
            // 尝试获取所有可能的响应头名称
            const allHeaders: Record<string, string> = {};
            for (const key in response.headers) {
                console.log(`响应头 ${key}: ${response.headers[key]}`);
                allHeaders[key] = response.headers[key];
            }
            console.log('所有响应头:', allHeaders);
            
            const filePath = response.headers?.['file-path'];
            if (!filePath) {
                console.error('未收到file-path响应头，所有响应头:', response.headers);
                throw new Error('未收到文件路径信息');
            }
            
            const image = URL.createObjectURL(response.data);
            return { image, filePath };
        } catch (error) {
            console.error('获取图片失败:', error);
            if (error instanceof Error) {
                message.error(error.message);
            } else {
                message.error('获取图片失败，请稍后重试');
            }
            throw error;
        }
    },

    /**
     * 解析图片中的单词
     * @param filePath 图片文件路径
     */
    parsePicture: (filePath: string) => {
        console.log('解析图片，文件路径:', filePath);
        return request.get<BaseResponse<WordInitDto[]>>('/word_init/parse_picture', {
            headers: {
                'file-path': filePath,
            },
            timeout: 180000  // 设置180秒超时
        }).then(response => {
            console.log('解析图片响应:', response);
            return response;
        }).catch(error => {
            console.error('解析图片失败:', error);
            throw error;
        });
    },

    /**
     * 保存解析后的单词
     * @param words 单词列表
     * @param filePath 图片文件路径
     */
    saveWords: (words: WordInitDto[], filePath: string) => {
        return request.post<BaseResponse<void>>('/word_init/save_words', words, {
            headers: {
                'file-path': filePath,
            }
        });
    }
};

export const getWordList = (user_word_status: number) => {
  return request.get<WordListResponse>('/study/get_user_word_list', {
    params: { user_word_status }
  });
};

export const getWordDetail = (word: string, is_need_mask: boolean = true) => {
  return request.get<WordDetailResponse>('/study/get_user_word', {
    params: { word, is_need_mask }
  });
};

export const getInflections = (inflection_type: number) => {
  return request.get<InflectionResponse>('/study/inflections', {
    params: { inflection_type }
  });
}; 