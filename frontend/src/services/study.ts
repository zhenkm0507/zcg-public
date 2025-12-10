import request from '@/utils/request';
import { BaseResponse, WordTaskInfo, SubmitAnswerParams, SubmitAnswerResponse, AnswerInfo, UserWordStatusStats } from '@/types';
import { StudyRecordResponse, HardWordResponse, BatchListResponse, SetWordsParams} from '@/types/study';

/**
 * 学习相关API
 */
export const studyApi = {
    /**
     * 获取单词学习任务信息
     */
    getWordTaskInfo: (batch_id?: number | string, flag?: string) => {
        const params: any = {};
        if (batch_id !== undefined && batch_id !== null) {
            params.batch_id = batch_id;
        }
        if (flag !== undefined && flag !== null && flag !== '全部') {
            params.flag = flag;
        }
        
        console.log('[studyApi.getWordTaskInfo] 实际发送的参数:', params);
        
        return request.get<BaseResponse<WordTaskInfo>>('/study/get_word_task_info', {
            params
        });
    },
    
    /**
     * 提交答题信息
     */
    submitAnswerInfo: (data: SubmitAnswerParams) => {
        return request.post<BaseResponse<SubmitAnswerResponse>>('/study/submit_answer_info', data);
    },

    /**
     * 判断短语是否正确
     */
    judgePhrase: (data: AnswerInfo) => {
        return request.post<BaseResponse<{ is_correct: boolean }>>('/study/judge_phrase', data);
    },

    /**
     * 获取用户单词列表
     */
    getUserWordList: (userWordStatus?: number) => {
        return request.get<BaseResponse<any>>('/study/get_user_word_list', {
            params: userWordStatus !== undefined ? { user_word_status: userWordStatus } : {}
        });
    },

    /**
     * 获取用户标签列表
     */
    getUserFlags: () => {
        return request.get<BaseResponse<string[]>>('/study/query_user_flags');
    },

    /**
     * 获取用户单词状态统计
     */
    getUserWordStatusStats: () => {
        return request.get<BaseResponse<UserWordStatusStats>>('/study/stat/user_word_status_stats');
    },

    /**
     * 获取批次列表
     */
    getBatchList: () => {
        return request.get<BatchListResponse>('/study_batch/get_list');
    },

    /**
     * 创建新批次
     */
    createBatch: () => {
        return request.get<BaseResponse<any>>('/study_batch/create_record');
    },

    /**
     * 重置批次设置
     */
    resetBatchStatus: (batchId: number) => {
        return request.get<BaseResponse<any>>('/study_batch/reset_status', {
            params: { id: batchId }
        });
    },

    /**
     * 设置批次单词集
     */
    setBatchWords: (params: SetWordsParams) => {
        return request.post<BaseResponse<any>>('/study_batch/set_words', params);
    },

    /**
     * 下载批次单词Excel文件
     */
    downloadWordsInBatch: (batchId: number) => {
        return request.get('/study_batch/download_words_in_batch', {
            params: { id: batchId },
            responseType: 'blob'
        });
    },
};

export const getStudyRecordList = () => {
  return request.get<StudyRecordResponse>('/study/get_study_record_list');
};

/**
 * 获取难词记录列表
 */
export const getHardWordRecordList = (fault_count?: number) => {
  return request.get<HardWordResponse>('/study/get_hard_word_record_list', {
    params: fault_count !== undefined ? { fault_count } : {}
  });
};
 

/**
 * 标签设置相关API
 */
export const flagApi = {
  /**
   * 获取可选择的自定义标签列表
   */
  getUserCustomFlags: () => {
    return request.get<BaseResponse<string[]>>('/user/get_user_custorm_flags');
  },

  /**
   * 批量设置用户单词标签
   */
  setUserWordFlags: (params: {
    operate_type: 1 | 2; // 1:增加标签，2:删除标签
    flags: string[];
    words: string[];
  }) => {
    return request.post<BaseResponse<any>>('/study/set_user_word_flags', params);
  },
};