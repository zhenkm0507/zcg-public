/**
 * 单词初始化数据传输对象
 */
export interface WordInitDto {
  /** 词库ID */
  word_bank_id: number;
  /** 单词 */
  word: string;
  /** 音标 */
  phonetic_symbol: string;
  /** 变形形式（过去式/过去分词/现在分词/比较级/最高级/名词复数） */
  inflection: Record<string, string>;
  /** 中文释义 */
  explanation: string;
  /** 例句 */
  example_sentences: string;
  /** 短语搭配 */
  phrases: string[];
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
  /** 页码 */
  page: number;
}

/**
 * 单词初始化统计响应
 */
export interface StatisticResponse {
  /** 总文件数 */
  total_files: number;
  /** 已完成文件数 */
  completed_files: number;
  /** 完成百分比 */
  completion_percentage: string;
}

/**
 * 词库数据传输对象
 */
export interface WordBankDto {
  /** 词库ID */
  id: number;
  /** 词库名称 */
  name: string;
}

export interface WordItem {
  word: string;
  translation: string;
  tags: string[];
  user_word_status: number;
}

export interface UserWordDto {
  id: number;
  user_id: number;
  word_bank_id: number;
  word: string;
  word_status: number;
  explanation: string;
  flags: string[];
  unmask_word: string;
}

export interface PhraseDto {
  phrase: string;
  exp: string;
}

export interface WordInfoDto {
  word: string;
  phonetic_symbol: string;
  inflection: {
    past_tense?: string;
    past_participle?: string;
    present_participle?: string;
    comparative?: string;
    superlative?: string;
    plural?: string;
  };
  explanation: string;
  example_sentences: string;
  phrases: PhraseDto[];
  expansions: string;
  memory_techniques: string;
  discrimination: string;
  usage: string;
  notes: string;
  flags: string[];
  unmask_word: string;
}

export interface WordListResponse {
  code: number;
  data: UserWordDto[];
  message: string;
}

export interface WordDetailResponse {
  code: number;
  data: WordInfoDto;
  message: string;
}

export interface InflectionItem {
  [key: string]: string;
}

export interface InflectionDto {
  table_header: string[];
  table_data: string[][];
}

export interface InflectionResponse {
  code: number;
  data: InflectionDto;
  message: string;
}