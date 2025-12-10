-- 奖品表
CREATE TABLE zcg.t_award (
	id bigserial NOT NULL, -- ID
	"type" int2 NOT NULL, -- 奖品类型：1 珍宝；2秘籍；3宝剑；4盔甲
	"name" varchar(20) NOT NULL, -- 名称
	description varchar(512) NOT NULL, -- 奖品说明
	image_path varchar(256) NOT NULL, -- 图片路径
	video_path varchar(256) NULL, -- 视频路径
	algo_type int4 DEFAULT 1 NOT NULL, -- 算法类型：1：背词阈值；2：斩词阈值；3:概率
	algo_value numeric NOT NULL, -- 阈值
	init_is_unlocked bool DEFAULT false NOT NULL, -- 初始化时是否解锁
	CONSTRAINT t_award_pk PRIMARY KEY (id)
);
COMMENT ON TABLE zcg.t_award IS '奖品';

-- Column comments

COMMENT ON COLUMN zcg.t_award.id IS 'ID';
COMMENT ON COLUMN zcg.t_award."type" IS '奖品类型：1 珍宝；2秘籍；3宝剑；4盔甲';
COMMENT ON COLUMN zcg.t_award."name" IS '名称';
COMMENT ON COLUMN zcg.t_award.description IS '奖品说明';
COMMENT ON COLUMN zcg.t_award.image_path IS '图片路径';
COMMENT ON COLUMN zcg.t_award.video_path IS '视频路径';
COMMENT ON COLUMN zcg.t_award.algo_type IS '算法类型：1：背词阈值；2：斩词阈值；3:概率';
COMMENT ON COLUMN zcg.t_award.algo_value IS '阈值';
COMMENT ON COLUMN zcg.t_award.init_is_unlocked IS '初始化时是否解锁';

--谚语
CREATE TABLE zcg.t_proverb (
	id serial4 NOT NULL,
	proverb varchar(512) NOT NULL, -- 英文谚语
	chinese_exp varchar(512) NOT NULL, -- 中文翻译
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT t_proverb_pk PRIMARY KEY (id)
);
CREATE UNIQUE INDEX t_proverb_proverb_idx ON zcg.t_proverb USING btree (proverb);
COMMENT ON TABLE zcg.t_proverb IS '谚语';

-- Column comments

COMMENT ON COLUMN zcg.t_proverb.proverb IS '英文谚语';
COMMENT ON COLUMN zcg.t_proverb.chinese_exp IS '中文翻译';

--用户信息
CREATE TABLE zcg.t_user (
	id serial4 NOT NULL, -- 主键
	username varchar(64) NOT NULL, -- 用户名
	nick_name varchar(64) NULL, -- 昵称
	passwd varchar(16) NOT NULL, -- 密码
	word_flags json NULL, -- 用户在每个词库里设置的自定义标签
	asura_word_threshold int4 DEFAULT 3 NULL, -- 修罗词阈值设置
	current_word_bank_id int4 NULL, -- 当前用户所选词库
	CONSTRAINT t_user_pk PRIMARY KEY (id),
	CONSTRAINT t_user_unique UNIQUE (username)
);
COMMENT ON TABLE zcg.t_user IS '用户信息';

-- Column comments

COMMENT ON COLUMN zcg.t_user.id IS '主键';
COMMENT ON COLUMN zcg.t_user.username IS '用户名';
COMMENT ON COLUMN zcg.t_user.nick_name IS '昵称';
COMMENT ON COLUMN zcg.t_user.passwd IS '密码';
COMMENT ON COLUMN zcg.t_user.word_flags IS '用户在每个词库里设置的自定义标签';
COMMENT ON COLUMN zcg.t_user.asura_word_threshold IS '修罗词阈值设置';
COMMENT ON COLUMN zcg.t_user.current_word_bank_id IS '当前用户所选词库';

--用户的下一个谚语ID
CREATE TABLE zcg.t_user_proverb_seq (
	user_id int8 NOT NULL, -- 用户ID
	next_proverb_seq int8 NOT NULL -- 用户的下一个序列ID
);
CREATE UNIQUE INDEX t_user_proverb_seq_user_id_idx ON zcg.t_user_proverb_seq USING btree (user_id);
COMMENT ON TABLE zcg.t_user_proverb_seq IS '用户的下一个谚语ID';

-- Column comments

COMMENT ON COLUMN zcg.t_user_proverb_seq.user_id IS '用户ID';
COMMENT ON COLUMN zcg.t_user_proverb_seq.next_proverb_seq IS '用户的下一个序列ID';

-- 攻词批次设置记录
CREATE TABLE zcg.t_user_study_batch_record (
	id serial4 NOT NULL, -- 主键
	is_finished bool DEFAULT false NOT NULL, -- 是否结束
	words json NULL, -- 批次里设置的单词列表
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	user_id int4 NOT NULL, -- 用户ID
	word_bank_id int4 NOT NULL, -- 词库ID
	batch_no varchar(20) NOT NULL, -- 批次号
	CONSTRAINT t_user_pk_1 PRIMARY KEY (id)
);
COMMENT ON TABLE zcg.t_user_study_batch_record IS '攻词批次设置记录';

-- Column comments

COMMENT ON COLUMN zcg.t_user_study_batch_record.id IS '主键';
COMMENT ON COLUMN zcg.t_user_study_batch_record.is_finished IS '是否结束';
COMMENT ON COLUMN zcg.t_user_study_batch_record.words IS '批次里设置的单词列表';
COMMENT ON COLUMN zcg.t_user_study_batch_record.user_id IS '用户ID';
COMMENT ON COLUMN zcg.t_user_study_batch_record.word_bank_id IS '词库ID';
COMMENT ON COLUMN zcg.t_user_study_batch_record.batch_no IS '批次号';

-- Table Triggers

create trigger update_t_user_study_batch_record_updated_at before
update
    on
    zcg.t_user_study_batch_record for each row execute function update_updated_at_column();

-- 用户学习记录
CREATE TABLE zcg.t_user_study_record (
	id bigserial NOT NULL, -- 主键
	user_id int4 NOT NULL, -- 用户ID
	word_bank_id int4 NOT NULL, -- 词库ID
	word varchar(64) NOT NULL, -- 单词
	record_time timestamp NULL, -- 背词时间
	answer_info json NULL, -- 背词详情
	study_result int2 NULL, -- 背词结果：0 未通过；1 通过
	word_status int2 NULL, -- 背词状态
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	seq_id varchar(36) NOT NULL, -- 全局唯一的序列号，标识一个用户对一个单词的一次学习
	CONSTRAINT t_user_study_record_pk PRIMARY KEY (id),
	CONSTRAINT t_user_study_record_unique UNIQUE (seq_id)
);
COMMENT ON TABLE zcg.t_user_study_record IS '用户学习记录';

-- Column comments

COMMENT ON COLUMN zcg.t_user_study_record.id IS '主键';
COMMENT ON COLUMN zcg.t_user_study_record.user_id IS '用户ID';
COMMENT ON COLUMN zcg.t_user_study_record.word_bank_id IS '词库ID';
COMMENT ON COLUMN zcg.t_user_study_record.word IS '单词';
COMMENT ON COLUMN zcg.t_user_study_record.record_time IS '背词时间';
COMMENT ON COLUMN zcg.t_user_study_record.answer_info IS '背词详情';
COMMENT ON COLUMN zcg.t_user_study_record.study_result IS '背词结果：0 未通过；1 通过';
COMMENT ON COLUMN zcg.t_user_study_record.word_status IS '背词状态';
COMMENT ON COLUMN zcg.t_user_study_record.seq_id IS '全局唯一的序列号，标识一个用户对一个单词的一次学习';

-- Table Triggers

create trigger update_t_user_study_record_updated_at before
update
    on
    zcg.t_user_study_record for each row execute function update_updated_at_column();

-- 用户词库
CREATE TABLE zcg.t_user_word (
	id bigserial NOT NULL, -- 主键
	word_bank_id int4 NOT NULL, -- 词库ID
	word varchar(64) NOT NULL, -- 单词
	user_id int4 NOT NULL, -- 用户ID
	word_status int2 DEFAULT 0 NOT NULL, -- 单词状态：0 待斩；1斩中；2已斩
	flags json NOT NULL, -- 标签
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT t_user_word_pk PRIMARY KEY (id)
);
CREATE INDEX t_word_bank_id_idx_1 ON zcg.t_user_word USING btree (word_bank_id);

-- Column comments

COMMENT ON COLUMN zcg.t_user_word.id IS '主键';
COMMENT ON COLUMN zcg.t_user_word.word_bank_id IS '词库ID';
COMMENT ON COLUMN zcg.t_user_word.word IS '单词';
COMMENT ON COLUMN zcg.t_user_word.user_id IS '用户ID';
COMMENT ON COLUMN zcg.t_user_word.word_status IS '单词状态：0 待斩；1斩中；2已斩';
COMMENT ON COLUMN zcg.t_user_word.flags IS '标签';

-- Table Triggers

create trigger update_t_user_word_updated_at before
update
    on
    zcg.t_user_word for each row execute function update_updated_at_column();

-- 用户词库奖品信息
CREATE TABLE zcg.t_user_word_bank_award (
	id bigserial NOT NULL, -- ID
	award_id int8 NOT NULL, -- 名称
	num int2 DEFAULT 0 NOT NULL, -- 奖品数目
	is_unlocked bool DEFAULT false NOT NULL, -- 是否解锁
	user_id int8 NOT NULL, -- 用户ID
	word_bank_id int4 NOT NULL, -- 词库ID
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT t_award_pk_1 PRIMARY KEY (id)
);
CREATE UNIQUE INDEX t_user_word_bank_award_award_id_idx ON zcg.t_user_word_bank_award USING btree (award_id, user_id, word_bank_id);
COMMENT ON TABLE zcg.t_user_word_bank_award IS '用户词库奖品信息';

-- Column comments

COMMENT ON COLUMN zcg.t_user_word_bank_award.id IS 'ID';
COMMENT ON COLUMN zcg.t_user_word_bank_award.award_id IS '名称';
COMMENT ON COLUMN zcg.t_user_word_bank_award.num IS '奖品数目';
COMMENT ON COLUMN zcg.t_user_word_bank_award.is_unlocked IS '是否解锁';
COMMENT ON COLUMN zcg.t_user_word_bank_award.user_id IS '用户ID';
COMMENT ON COLUMN zcg.t_user_word_bank_award.word_bank_id IS '词库ID';

-- Table Triggers

create trigger update_t_user_word_bank_award_updated_at before
update
    on
    zcg.t_user_word_bank_award for each row execute function update_updated_at_column();

-- 用户词库成长信息
CREATE TABLE zcg.t_user_word_bank_profile (
	id bigserial NOT NULL, -- 主键
	user_id int4 NOT NULL, -- 用户ID
	word_bank_id int4 NOT NULL, -- 词库ID
	experience_value numeric DEFAULT 0 NOT NULL, -- 经验值=背词数/词库次数 * 100
	morale_value int4 DEFAULT 60 NOT NULL, -- 士气值
	user_level int2 NOT NULL, -- 用户级别：1.功夫小子、2.词林少侠、3.词林大侠、4.词林剑圣、5.独孤词尊
	CONSTRAINT t_user_word_pk_1 PRIMARY KEY (id)
);
CREATE UNIQUE INDEX t_user_word_bank_profile_user_id_idx ON zcg.t_user_word_bank_profile USING btree (user_id, word_bank_id);
CREATE INDEX t_word_bank_id_idx_1_1 ON zcg.t_user_word_bank_profile USING btree (user_id);

-- Column comments
COMMENT ON TABLE zcg.t_user_word_bank_profile IS '用户词库成长信息';
COMMENT ON COLUMN zcg.t_user_word_bank_profile.id IS '主键';
COMMENT ON COLUMN zcg.t_user_word_bank_profile.user_id IS '用户ID';
COMMENT ON COLUMN zcg.t_user_word_bank_profile.word_bank_id IS '词库ID';
COMMENT ON COLUMN zcg.t_user_word_bank_profile.experience_value IS '经验值=背词数/词库次数 * 100';
COMMENT ON COLUMN zcg.t_user_word_bank_profile.morale_value IS '士气值';
COMMENT ON COLUMN zcg.t_user_word_bank_profile.user_level IS '用户级别：1.功夫小子、2.词林少侠、3.词林大侠、4.词林剑圣、5.独孤词尊';

-- 单词表
CREATE TABLE zcg.t_word (
	id bigserial NOT NULL, -- 主键
	word_bank_id int4 NOT NULL, -- 词库ID
	word varchar(64) NOT NULL, -- 单词
	phonetic_symbol varchar(64) NOT NULL, -- 音标
	inflection json NULL, -- 屈折形式（过去式/过去分词/现在分词/比较级/最高级/名词复数）
	explanation varchar(512) NOT NULL, -- 中文释义
	example_sentences varchar(2048) NULL, -- 例句
	phrases json NULL, -- 短语搭配
	expansions varchar(512) NULL, -- 拓展
	memory_techniques varchar(512) NULL, -- 记忆方法
	discrimination varchar(1024) NULL, -- 辨析
	"usage" varchar(2048) NULL, -- 用法
	notes varchar(512) NULL, -- 注意事项
	flags json NOT NULL, -- 标签
	page int4 NOT NULL, -- 页码
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT t_word_pk PRIMARY KEY (id)
);
CREATE INDEX t__word_bank_id_idx ON zcg.t_word USING btree (word_bank_id);
COMMENT ON TABLE zcg.t_word IS '单词表';

-- Column comments

COMMENT ON COLUMN zcg.t_word.id IS '主键';
COMMENT ON COLUMN zcg.t_word.word_bank_id IS '词库ID';
COMMENT ON COLUMN zcg.t_word.word IS '单词';
COMMENT ON COLUMN zcg.t_word.phonetic_symbol IS '音标';
COMMENT ON COLUMN zcg.t_word.inflection IS '屈折形式（过去式/过去分词/现在分词/比较级/最高级/名词复数）';
COMMENT ON COLUMN zcg.t_word.explanation IS '中文释义';
COMMENT ON COLUMN zcg.t_word.example_sentences IS '例句';
COMMENT ON COLUMN zcg.t_word.phrases IS '短语搭配';
COMMENT ON COLUMN zcg.t_word.expansions IS '拓展';
COMMENT ON COLUMN zcg.t_word.memory_techniques IS '记忆方法';
COMMENT ON COLUMN zcg.t_word.discrimination IS '辨析';
COMMENT ON COLUMN zcg.t_word."usage" IS '用法';
COMMENT ON COLUMN zcg.t_word.notes IS '注意事项';
COMMENT ON COLUMN zcg.t_word.flags IS '标签';
COMMENT ON COLUMN zcg.t_word.page IS '页码';

-- Table Triggers

create trigger update_t_word_updated_at before
update
    on
    zcg.t_word for each row execute function update_updated_at_column();

-- 词库表
CREATE TABLE zcg.t_word_bank (
	id serial4 NOT NULL, -- 主键
	"name" varchar(64) NOT NULL, -- 词库名称
	word_flag_list json NULL, -- 词库的系统单词标签列表
	CONSTRAINT t_word_bank_pk PRIMARY KEY (id),
	CONSTRAINT t_word_bank_unique UNIQUE (name)
);
COMMENT ON TABLE zcg.t_word_bank IS '词库';

-- Column comments

COMMENT ON COLUMN zcg.t_word_bank.id IS '主键';
COMMENT ON COLUMN zcg.t_word_bank."name" IS '词库名称';
COMMENT ON COLUMN zcg.t_word_bank.word_flag_list IS '词库的系统单词标签列表';