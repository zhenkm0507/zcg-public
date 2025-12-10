import { BaseResponse } from '@/types';

/**
 * 单词学习任务信息
 */
export interface WordTaskInfo {
  /** 是否完成 */
  is_completed: boolean;
  /** 本次单词学习的唯一任务ID号 */
  task_id: string;
  /** 单词详情 */
  word_info: WordInfo;
}

/**
 * 单词详情
 */
export interface WordInfo {
  /** 单词 */
  word: string;
  /** 音标 */
  phonetic_symbol: string;
  /** 变形形式 */
  inflection: {
    /** 过去式 */
    past_tense: string;
    /** 过去分词 */
    past_participle: string;
    /** 现在分词 */
    present_participle: string;
    /** 比较级 */
    comparative: string;
    /** 最高级 */
    superlative: string;
    /** 名词复数 */
    plural: string;
  } & Record<string, string>;
  /** 中文释义 */
  explanation: string;
  /** 例句 */
  example_sentences: string;
  /** 短语搭配 */
  phrases: {
    /** 短语 */
    phrase: string;
    /** 短语释义 */
    exp: string;
  }[];
  /** 拓展 */
  expansions: string;
  /** 记忆方法 */
  memory_techniques: string;
  /** 辨析 */
  discrimination: string;
  /** 用法 */
  usage: string;
  /** 注意事项 */
  notes: string;
  /** 标签 */
  flags: string[];
}

/**
 * 答题信息
 */
export interface AnswerInfo {
  /** 问题类型：单词、变形形式、短语 */
  question_type: 'word' | 'inflection' | 'phrase';
  /** 问题内容：对于变形形式是past_tense等，对于短语是中文释义 */
  question: string;
  /** 正确答案 */
  correct_answer: string;
  /** 用户答案 */
  user_answer: string;
  /** 是否正确 */
  is_correct: boolean;
}

/**
 * 提交答题信息参数
 */
export interface SubmitAnswerParams {
  /** 本次单词学习的唯一任务ID号 */
  task_id: string;
  /** 单词 */
  word: string;
  /** 总答题结果，1表示完全正确，0表示有错误 */
  study_result: 0 | 1;
  /** 答题信息 */
  answer_info: AnswerInfo[];
}

/**
 * 提交答题信息响应
 */
export interface SubmitAnswerResponse {
  /** 单词 */
  word: string;
  /** 本次答题结果，1表示完全正确，0表示有错误 */
  study_result: 0 | 1;
  /** 是否被斩杀 */
  is_slain: boolean;
  /** 奖品列表 */
  award_list?: AwardItem[];
}

/**
 * 奖品信息
 */
export interface AwardItem {
  /** 奖品类型：1=珍宝，2=秘籍，3=宝剑，4=盔甲 */
  award_type: number;
  /** 奖品名称 */
  award_name: string;
  /** 奖品图片路径 */
  image_path: string;
  /** 奖品视频路径（可选） */
  video_path?: string;
}

export interface StudyRecordDto {
  record_date: string;
  study_record_list: {
    id: number;
    user_id: number;
    word_bank_id: number;
    word: string;
    explanation: string;
    record_time: string;
    study_result: string;
    word_status: string;
    flags: string[];
    answer_info: any[];
    unmask_word: string;
  }[];
}

export interface StudyRecordResponse {
  code: number;
  message: string;
  data: StudyRecordDto[];
}

export interface AnswerInfoDto {
  task_id: string;
  word: string;
  study_result: number;
  answer_info: AnswerInfo[];
  record_date: string;
}

export interface HardWordDto {
  user_id: number;
  word_bank_id: number;
  word: string;
  explanation: string;
  study_result: string;
  word_status: string;
  flags: string[];
  unmask_word: string;
  answer_info: AnswerInfoDto[];
}

export interface HardWordResponse extends BaseResponse<HardWordDto[]> {}

/**
 * 用户单词状态统计
 */
export interface UserWordStatusStats {
  /** 斩杀单词数量 */
  slain_word_count: number;
  /** 斩中单词数量 */
  slaining_word_count: number;
  /** 待斩单词数量 */
  wait_word_count: number;
  /** 总单词数量 */
  total_word_count: number;
}

/**
 * 批次记录
 */
export interface BatchRecord {
  /** 批次ID */
  id: number;
  /** 批次号 */
  batch_no: string;
  /** 单词数量 */
  word_count: number;
  /** 是否完成 */
  is_finished: boolean;
  /** 单词列表 */
  words: {
    /** 单词 */
    word: string;
    /** 是否已记忆 */
    is_memorized: boolean;
  }[];
}

/**
 * 批次列表响应
 */
export interface BatchListResponse extends BaseResponse<BatchRecord[]> {}

/**
 * 设置单词集参数
 */
export interface SetWordsParams {
  /** 批次ID */
  id: number;
  /** 单词列表 */
  words: {
    /** 单词 */
    word: string;
    /** 是否已记忆 */
    is_memorized: boolean;
  }[];
}

// 标签设置相关类型
export interface SetUserWordFlagsParams {
  operate_type: 1 | 2; // 1:增加标签，2:删除标签
  flags: string[];
  words: string[];
}

export interface SetUserWordFlagsResponse extends BaseResponse<null> {}