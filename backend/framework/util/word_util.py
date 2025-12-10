import nltk
from nltk.stem import WordNetLemmatizer
from nltk.corpus import wordnet
import re
from functools import lru_cache
from framework.config.word_forms_config import (
    IRREGULAR_VERBS,
    IRREGULAR_NOUNS,
    IRREGULAR_ADJECTIVES,
    SPECIAL_NOUNS,
    SPECIAL_ADJECTIVES,
    COMMON_PREFIXES,
    COMMON_COMPOUND_WORDS
)

# 缓存 WordNet 查询结果
@lru_cache(maxsize=1000)
def get_word_forms(target_word: str) -> set:
    """
    获取单词的所有可能形式，使用NLTK智能检测词性转换
    """
    forms = {target_word.lower()}
    lemmatizer = WordNetLemmatizer()
    
    # 获取词性
    synsets = wordnet.synsets(target_word)
    pos_tags = set()
    for synset in synsets:
        pos_tags.add(synset.pos())
    
    # 对每个词性进行词形还原
    for pos in pos_tags:
        # 词形还原
        lemma = lemmatizer.lemmatize(target_word, pos)
        forms.add(lemma)
        
        # 获取词形变化
        if pos == wordnet.VERB:
            # 检查是否是不规则动词
            if lemma in IRREGULAR_VERBS:
                forms.update(IRREGULAR_VERBS[lemma])
            else:
                # 一般现在时第三人称单数
                if lemma.endswith(('s', 'x', 'z', 'ch', 'sh')):
                    forms.add(lemma + 'es')
                elif lemma.endswith('y') and lemma[-2] not in 'aeiou':
                    forms.add(lemma[:-1] + 'ies')
                else:
                    forms.add(lemma + 's')
                
                # 过去式和过去分词
                if lemma.endswith('e'):
                    forms.add(lemma + 'd')  # 去e加d
                elif lemma.endswith('y') and lemma[-2] not in 'aeiou':
                    forms.add(lemma[:-1] + 'ied')  # y变i加ed
                else:
                    forms.add(lemma + 'ed')  # 一般情况
                
                # 现在分词
                if lemma.endswith('ie'):
                    forms.add(lemma[:-2] + 'ying')  # ie变y加ing
                elif lemma.endswith('e'):
                    forms.add(lemma[:-1] + 'ing')  # 去e加ing
                else:
                    forms.add(lemma + 'ing')  # 一般情况
                
                # 处理双写辅音的情况
                if len(lemma) > 1:
                    last_char = lemma[-1]
                    second_last_char = lemma[-2]
                    # 如果最后一个字符是辅音，且倒数第二个字符不是辅音
                    if last_char not in 'aeiou' and second_last_char in 'aeiou':
                        # 添加双写辅音的形式
                        forms.add(lemma + last_char + 'ed')  # 双写辅音的过去式
                        forms.add(lemma + last_char + 'ing')  # 双写辅音的现在分词
                        
        elif pos == wordnet.NOUN:
            # 检查是否是不规则名词
            if lemma in IRREGULAR_NOUNS:
                forms.add(IRREGULAR_NOUNS[lemma])
            else:
                # 复数形式
                if lemma.endswith(('s', 'x', 'z', 'ch', 'sh')):
                    forms.add(lemma + 'es')
                elif lemma.endswith('y') and lemma[-2] not in 'aeiou':
                    forms.add(lemma[:-1] + 'ies')
                elif lemma.endswith('f'):
                    forms.add(lemma[:-1] + 'ves')
                elif lemma.endswith('fe'):
                    forms.add(lemma[:-2] + 'ves')
                else:
                    forms.add(lemma + 's')
                    
        elif pos == wordnet.ADJ:
            # 检查是否是不规则形容词
            if lemma in IRREGULAR_ADJECTIVES:
                forms.update(IRREGULAR_ADJECTIVES[lemma])
            else:
                # 比较级和最高级
                if lemma.endswith('e'):
                    forms.add(lemma[:-1] + 'er')  # 去e加er
                    forms.add(lemma[:-1] + 'est')  # 去e加est
                elif lemma.endswith('y') and lemma[-2] not in 'aeiou':
                    forms.add(lemma[:-1] + 'ier')  # y变i加er
                    forms.add(lemma[:-1] + 'iest')  # y变i加est
                else:
                    forms.add(lemma + 'er')  # 一般情况
                    forms.add(lemma + 'est')  # 一般情况
                
                # 副词形式
                if lemma.endswith('y') and lemma[-2] not in 'aeiou':
                    forms.add(lemma[:-1] + 'ily')  # y变i加ly
                elif lemma.endswith('le'):
                    forms.add(lemma[:-2] + 'ly')  # 去le加ly
                else:
                    forms.add(lemma + 'ly')  # 一般情况
                
                # 处理双写辅音的情况
                if len(lemma) > 1:
                    last_char = lemma[-1]
                    second_last_char = lemma[-2]
                    # 如果最后一个字符是辅音，且倒数第二个字符不是辅音
                    if last_char not in 'aeiou' and second_last_char in 'aeiou':
                        # 添加双写辅音的形式
                        forms.add(lemma + last_char + 'er')  # 双写辅音的比较级
                        forms.add(lemma + last_char + 'est')  # 双写辅音的最高级
    
    # 使用NLTK的derivationally_related_forms()方法获取词性转换
    for synset in synsets:
        for lemma in synset.lemmas():
            # 获取派生相关的形式（词性转换）
            for related_lemma in lemma.derivationally_related_forms():
                forms.add(related_lemma.name().lower())
    
    # 添加常见的词性转换后缀（作为补充）
    target_lower = target_word.lower()
    
    # 形容词到名词的常见后缀
    if any(pos == wordnet.ADJ for pos in pos_tags):
        if target_lower.endswith('y') and target_lower[-2] not in 'aeiou':
            forms.add(target_lower[:-1] + 'iness')  # happy -> happiness
        elif target_lower.endswith('e'):
            forms.add(target_lower[:-1] + 'ness')   # wide -> wideness
        else:
            forms.add(target_lower + 'ness')        # thick -> thickness
    
    # 名词到形容词的常见后缀
    if any(pos == wordnet.NOUN for pos in pos_tags):
        if target_lower.endswith('ness'):
            base = target_lower[:-4]  # thickness -> thick
            forms.add(base)
            if base.endswith('i'):
                forms.add(base[:-1] + 'y')  # happiness -> happy
    
    # 特殊的名词化规则（基于常见模式）
    if any(pos == wordnet.ADJ for pos in pos_tags):
        if target_lower in SPECIAL_NOUNS:
            forms.add(SPECIAL_NOUNS[target_lower])
    
    # 特殊的名词到形容词转换
    if any(pos == wordnet.NOUN for pos in pos_tags):
        if target_lower in SPECIAL_ADJECTIVES:
            forms.add(SPECIAL_ADJECTIVES[target_lower])
    
    # 添加前缀变体检测
    for prefix in COMMON_PREFIXES:
        # 检查添加前缀后的形式
        prefixed_form = prefix + target_lower
        forms.add(prefixed_form)
        
        # 为前缀形式添加常见的后缀变化
        if prefixed_form.endswith('y') and prefixed_form[-2] not in 'aeiou':
            forms.add(prefixed_form[:-1] + 'iness')  # unhappy -> unhappiness
            forms.add(prefixed_form[:-1] + 'ily')    # unhappy -> unhappily
        elif prefixed_form.endswith('e'):
            forms.add(prefixed_form[:-1] + 'ness')   # wide -> wideness
            forms.add(prefixed_form + 'ly')          # wide -> widely
        else:
            forms.add(prefixed_form + 'ness')        # thick -> thickness
            forms.add(prefixed_form + 'ly')          # thick -> thickly
        
        # 检查去掉前缀后的形式（如果目标单词以某个前缀开头）
        if target_lower.startswith(prefix) and len(target_lower) > len(prefix):
            base_form = target_lower[len(prefix):]
            forms.add(base_form)
    
    return forms

def mask_word(word:str, content:str) -> str:
    """
    使用NLTK进行更专业的单词变体检测和掩码处理
    param word: 单词
    param content: 单词相关的内容，如单词、单词变体、例句、用法、扩展等。
    return: 处理后的content。
    """
    if not word or not content:
        return content

    def is_word_variant(base_word: str, test_word: str) -> bool:
        """
        使用NLTK检查test_word是否是base_word的变体
        """
        # 获取目标单词的所有可能形式
        word_forms = get_word_forms(base_word)
        
        # 清理测试单词
        test_word = test_word.lower()
        test_word = re.sub(r'[^\w\'-]', '', test_word)
        
        # 检查是否匹配任何形式
        return test_word in word_forms

    def split_text(text: str) -> list:
        """
        智能分割文本，处理中英文混合的情况
        :param text: 输入文本
        :return: 分割后的单词列表，保留原始格式
        """
        # 匹配英文单词（包括带连字符的单词）、数字和标点符号
        pattern = (
            r'[a-zA-Z]+(?:-[a-zA-Z]+)*|'  # 英文单词（包括连字符）
            r'\d+|'  # 数字
            r'[.,!?;:()\[\]{}"\']+|'  # 英文标点
            r'[\u3000-\u303f\uff00-\uffef]'  # 中文标点
        )
        
        # 使用正则表达式分割文本
        parts = []
        last_end = 0
        
        for match in re.finditer(pattern, text):
            # 添加英文单词前的非英文文本
            if match.start() > last_end:
                parts.append(text[last_end:match.start()])
            
            # 添加英文单词、数字或标点符号
            parts.append(match.group())
            last_end = match.end()
        
        # 添加最后一个匹配后的文本
        if last_end < len(text):
            parts.append(text[last_end:])
        
        return parts

    def is_english_word(text: str) -> bool:
        """
        判断是否为英文单词（包括带连字符的复合词）
        """
        return bool(re.match(r'^[a-zA-Z]+(?:-[a-zA-Z]+)*$', text))

    def check_compound_word(base_word: str, test_word: str) -> str:
        """
        检查test_word是否是包含base_word的复合词
        param base_word: 基础单词
        param test_word: 测试单词
        return: 掩码后的test_word，如果不是复合词则返回原test_word
        """
        base_lower = base_word.lower()
        test_lower = test_word.lower()
        
        # 检查是否是复合词（包含连字符）
        if '-' in test_word:
            parts = test_word.split('-')
            
            # 检查每个部分是否包含目标单词
            for i, part in enumerate(parts):
                if base_lower in part.lower():
                    # 找到匹配的部分，进行掩码
                    if len(part) > 1:
                        # 保留首字母，其余用*替换
                        masked_part = part[0] + '*' * (len(part) - 1)
                        parts[i] = masked_part
                        return '-'.join(parts)
        
        # 检查是否是其他形式的复合词（没有连字符）
        # 采用更保守的策略，只在明确是复合词的情况下才进行掩码
        if test_lower in COMMON_COMPOUND_WORDS and base_lower in test_lower:
            # 进行部分掩码
            start_pos = test_lower.find(base_lower)
            end_pos = start_pos + len(base_lower)
            original_part = test_word[start_pos:end_pos]
            if len(original_part) > 1:
                masked_part = original_part[0] + '*' * (len(original_part) - 1)
                return test_word[:start_pos] + masked_part + test_word[end_pos:]
        
        return test_word

    def fallback_mask(base_word: str, test_word: str) -> str:
        """
        兜底策略：如果test_word中包含base_word（大小写不敏感），进行掩码处理
        param base_word: 基础单词
        param test_word: 测试单词
        return: 掩码后的test_word，如果不包含则返回原test_word
        """
        base_lower = base_word.lower()
        test_lower = test_word.lower()
        
        # 检查test_word是否包含base_word
        if base_lower in test_lower:
            start_pos = test_lower.find(base_lower)
            end_pos = start_pos + len(base_lower)
            
            # 获取原始文本中对应位置的部分
            original_part = test_word[start_pos:end_pos]
            
            # 如果匹配的部分长度大于1，进行掩码
            if len(original_part) > 1:
                # 保留首字母，其余用*替换
                masked_part = original_part[0] + '*' * (len(original_part) - 1)
                return test_word[:start_pos] + masked_part + test_word[end_pos:]
        
        return test_word

    # 使用智能分割方法分割文本
    words = split_text(content)
    masked_words = []
    
    for w in words:
        # 如果当前部分不是英文单词，直接添加
        if not is_english_word(w):
            masked_words.append(w)
            continue
            
        # 检查是否是目标单词或其变体
        if is_word_variant(word, w):
            # 保留原始大小写
            first_char = w[0]
            # 保持原始大小写，其余替换为*
            masked_w = first_char + '*' * (len(w) - 1)
            masked_words.append(masked_w)
        else:
            # 检查是否是复合词（包含目标单词）
            masked_w = check_compound_word(word, w)
            
            # 如果复合词检测没有进行掩码，使用兜底策略
            if masked_w == w:
                masked_w = fallback_mask(word, w)
            
            masked_words.append(masked_w)
            
    # 重新组合所有部分
    return ''.join(masked_words)
