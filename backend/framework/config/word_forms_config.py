"""
单词形式配置文件
包含不规则动词、名词和形容词的词典
"""

# 常见前缀列表（用于词形变化检测）
COMMON_PREFIXES = [
    # 否定前缀
    'un', 'in', 'im', 'il', 'ir', 'dis', 'mis', 'non',
    
    # 方向/位置前缀
    're', 'pre', 'post', 'sub', 'super', 'over', 'under', 'out', 'up', 'down',
    'fore', 'back', 'mid', 'inter', 'intra', 'extra', 'ultra', 'semi',
    
    # 数量前缀
    'bi', 'tri', 'multi', 'poly', 'mono', 'uni', 'omni', 'pan',
    
    # 其他常见前缀
    'anti', 'pro', 'auto', 'tele', 'micro', 'macro', 'mini', 'maxi',
    'neo', 'pseudo', 'quasi', 'vice', 'co', 'counter', 'de', 'en', 'em'
]

# 常见不规则动词词典
IRREGULAR_VERBS = {
    'be': ['am', 'is', 'are', 'was', 'were', 'been', 'being'],
    'do': ['does', 'did', 'done', 'doing'],
    'go': ['goes', 'went', 'gone', 'going'],
    'have': ['has', 'had', 'having'],
    'make': ['makes', 'made', 'making'],
    'take': ['takes', 'took', 'taken', 'taking'],
    'come': ['comes', 'came', 'coming'],
    'get': ['gets', 'got', 'gotten', 'getting'],
    'give': ['gives', 'gave', 'given', 'giving'],
    'know': ['knows', 'knew', 'known', 'knowing'],
    'see': ['sees', 'saw', 'seen', 'seeing'],
    'think': ['thinks', 'thought', 'thinking'],
    'write': ['writes', 'wrote', 'written', 'writing'],
    'begin': ['begins', 'began', 'begun', 'beginning'],
    'break': ['breaks', 'broke', 'broken', 'breaking'],
    'bring': ['brings', 'brought', 'bringing'],
    'build': ['builds', 'built', 'building'],
    'buy': ['buys', 'bought', 'buying'],
    'catch': ['catches', 'caught', 'catching'],
    'choose': ['chooses', 'chose', 'chosen', 'choosing'],
    'drink': ['drinks', 'drank', 'drunk', 'drinking'],
    'drive': ['drives', 'drove', 'driven', 'driving'],
    'eat': ['eats', 'ate', 'eaten', 'eating'],
    'fall': ['falls', 'fell', 'fallen', 'falling'],
    'feel': ['feels', 'felt', 'feeling'],
    'find': ['finds', 'found', 'finding'],
    'forget': ['forgets', 'forgot', 'forgotten', 'forgetting'],
    'forgive': ['forgives', 'forgave', 'forgiven', 'forgiving'],
    'freeze': ['freezes', 'froze', 'frozen', 'freezing'],
    'grow': ['grows', 'grew', 'grown', 'growing'],
    'hide': ['hides', 'hid', 'hidden', 'hiding'],
    'hold': ['holds', 'held', 'holding'],
    'keep': ['keeps', 'kept', 'keeping'],
    'lead': ['leads', 'led', 'leading'],
    'leave': ['leaves', 'left', 'leaving'],
    'lose': ['loses', 'lost', 'losing'],
    'mean': ['means', 'meant', 'meaning'],
    'meet': ['meets', 'met', 'meeting'],
    'pay': ['pays', 'paid', 'paying'],
    'put': ['puts', 'putting'],
    'read': ['reads', 'read', 'reading'],
    'ride': ['rides', 'rode', 'ridden', 'riding'],
    'ring': ['rings', 'rang', 'rung', 'ringing'],
    'rise': ['rises', 'rose', 'risen', 'rising'],
    'run': ['runs', 'ran', 'running'],
    'say': ['says', 'said', 'saying'],
    'sell': ['sells', 'sold', 'selling'],
    'send': ['sends', 'sent', 'sending'],
    'set': ['sets', 'set', 'setting'],
    'shake': ['shakes', 'shook', 'shaken', 'shaking'],
    'shine': ['shines', 'shone', 'shining'],
    'shoot': ['shoots', 'shot', 'shooting'],
    'show': ['shows', 'showed', 'shown', 'showing'],
    'shut': ['shuts', 'shut', 'shutting'],
    'sing': ['sings', 'sang', 'sung', 'singing'],
    'sit': ['sits', 'sat', 'sitting'],
    'sleep': ['sleeps', 'slept', 'sleeping'],
    'speak': ['speaks', 'spoke', 'spoken', 'speaking'],
    'spend': ['spends', 'spent', 'spending'],
    'stand': ['stands', 'stood', 'standing'],
    'steal': ['steals', 'stole', 'stolen', 'stealing'],
    'stick': ['sticks', 'stuck', 'sticking'],
    'strike': ['strikes', 'struck', 'striking'],
    'swim': ['swims', 'swam', 'swum', 'swimming'],
    'teach': ['teaches', 'taught', 'teaching'],
    'tell': ['tells', 'told', 'telling'],
    'throw': ['throws', 'threw', 'thrown', 'throwing'],
    'understand': ['understands', 'understood', 'understanding'],
    'wake': ['wakes', 'woke', 'woken', 'waking'],
    'wear': ['wears', 'wore', 'worn', 'wearing'],
    'win': ['wins', 'won', 'winning'],
    'write': ['writes', 'wrote', 'written', 'writing']
}

# 常见不规则名词复数词典
IRREGULAR_NOUNS = {
    'child': 'children',
    'foot': 'feet',
    'goose': 'geese',
    'man': 'men',
    'mouse': 'mice',
    'person': 'people',
    'tooth': 'teeth',
    'woman': 'women',
    'ox': 'oxen',
    'crisis': 'crises',
    'criterion': 'criteria',
    'datum': 'data',
    'phenomenon': 'phenomena',
    'thesis': 'theses',
    'analysis': 'analyses',
    'basis': 'bases',
    'diagnosis': 'diagnoses',
    'ellipsis': 'ellipses',
    'hypothesis': 'hypotheses',
    'parenthesis': 'parentheses',
    'synopsis': 'synopses',
    'synthesis': 'syntheses'
}

# 常见不规则形容词词典
IRREGULAR_ADJECTIVES = {
    'good': ['better', 'best'],
    'bad': ['worse', 'worst'],
    'far': ['further', 'furthest'],
    'little': ['less', 'least'],
    'many': ['more', 'most'],
    'much': ['more', 'most'],
    'old': ['elder', 'eldest'],
    'late': ['later', 'latest'],
    'well': ['better', 'best'],
    'ill': ['worse', 'worst']
}

# 特殊的名词化规则（NLTK无法自动识别的词性转换）
SPECIAL_NOUNS = {
    # 形容词到名词的特殊转换（NLTK无法自动识别的情况）
    'honest': 'honesty',
    'wise': 'wisdom', 
    'young': 'youth',
    'old': 'age',
    'rich': 'richness',
    'poor': 'poverty',
    
    # 带前缀的特殊转换（NLTK无法自动识别的情况）
    'happy': 'unhappiness',  # 前缀变化
    'kind': 'unkindness',     # 前缀变化
    'clean': 'uncleanliness', # 前缀变化
    'ready': 'unreadiness',   # 前缀变化
    'possible': 'impossibility', # 前缀变化
    'necessary': 'unnecessity',   # 前缀变化
    'important': 'unimportance',  # 前缀变化
    'useful': 'uselessness',      # 前缀变化
    'honest': 'dishonesty',       # 前缀变化
    'patient': 'impatience',      # 前缀变化
    'careful': 'carelessness',    # 前缀变化
    'helpful': 'helplessness',    # 前缀变化
    'hopeful': 'hopelessness',    # 前缀变化
    'powerful': 'powerlessness',  # 前缀变化
    'fearful': 'fearlessness',    # 前缀变化
    'harmful': 'harmlessness',    # 前缀变化
    'colorful': 'colorlessness',  # 前缀变化
    'tasteful': 'tastelessness',  # 前缀变化
    'meaningful': 'meaninglessness', # 前缀变化
    'thoughtful': 'thoughtlessness', # 前缀变化
    'graceful': 'gracelessness',  # 前缀变化
    'skillful': 'unskillfulness', # 前缀变化
    'faithful': 'faithlessness',  # 前缀变化
    'truthful': 'untruthfulness', # 前缀变化
    'grateful': 'ungratefulness', # 前缀变化
    'successful': 'unsuccessfulness', # 前缀变化
    'fruitful': 'fruitlessness',  # 前缀变化
    'doubtful': 'doubtlessness',  # 前缀变化
    'shameful': 'shamelessness',  # 前缀变化
    'lawful': 'unlawfulness',     # 前缀变化
    'cheerful': 'cheerlessness',  # 前缀变化
    'tearful': 'tearlessness',    # 前缀变化
    'doubtful': 'doubtlessness',  # 前缀变化
    'grateful': 'ungratefulness', # 前缀变化
    'harmful': 'harmlessness',    # 前缀变化
    'helpful': 'helplessness',    # 前缀变化
    'hopeful': 'hopelessness',    # 前缀变化
    'joyful': 'joylessness',      # 前缀变化
    'lawful': 'unlawfulness',     # 前缀变化
    'painful': 'painlessness',    # 前缀变化
    'powerful': 'powerlessness',  # 前缀变化
    'purposeful': 'purposelessness', # 前缀变化
    'respectful': 'disrespect',   # 前缀变化
    'respectful': 'disrespectfulness', # 前缀变化
    'shameful': 'shamelessness',  # 前缀变化
    'skillful': 'unskillfulness', # 前缀变化
    'successful': 'unsuccessfulness', # 前缀变化
    'thankful': 'thanklessness',  # 前缀变化
    'thoughtful': 'thoughtlessness', # 前缀变化
    'truthful': 'untruthfulness', # 前缀变化
    'useful': 'uselessness',      # 前缀变化
    'wonderful': 'wonderlessness', # 前缀变化
    'worryful': 'worrylessness',  # 前缀变化
    'youthful': 'youthlessness',  # 前缀变化
}

# 特殊的名词到形容词转换（NLTK无法自动识别的反向关系）
SPECIAL_ADJECTIVES = {
    # 基本词性转换（NLTK无法自动识别的情况）
    'strength': 'strong',
    'width': 'wide', 
    'length': 'long',
    'height': 'high',
    'depth': 'deep',
    'breadth': 'broad',
    'beauty': 'beautiful',  # NLTK只能单向识别
    'wisdom': 'wise',
    'youth': 'young',
    'age': 'old',
    
    # 带前缀的特殊转换（NLTK无法自动识别的情况）
    'unhappiness': 'unhappy',
    'unkindness': 'unkind',
    'uncleanliness': 'unclean',
    'unreadiness': 'unready',
    'impossibility': 'impossible',
    'unnecessity': 'unnecessary',
    'unimportance': 'unimportant',
    'uselessness': 'useless',
    'dishonesty': 'dishonest',
    'impatience': 'impatient',
    'carelessness': 'careless',
    'helplessness': 'helpless',
    'hopelessness': 'hopeless',
    'powerlessness': 'powerless',
    'fearlessness': 'fearless',
    'harmlessness': 'harmless',
    'colorlessness': 'colorless',
    'tastelessness': 'tasteless',
    'meaninglessness': 'meaningless',
    'thoughtlessness': 'thoughtless',
    'gracelessness': 'graceless',
    'unskillfulness': 'unskillful',
    'faithlessness': 'faithless',
    'untruthfulness': 'untruthful',
    'ungratefulness': 'ungrateful',
    'unsuccessfulness': 'unsuccessful',
    'fruitlessness': 'fruitless',
    'doubtlessness': 'doubtless',
    'shamelessness': 'shameless',
    'unlawfulness': 'unlawful',
    'cheerlessness': 'cheerless',
    'tearlessness': 'tearless',
    'joylessness': 'joyless',
    'painlessness': 'painless',
    'purposelessness': 'purposeless',
    'disrespect': 'disrespectful',
    'disrespectfulness': 'disrespectful',
    'thanklessness': 'thankless',
    'wonderlessness': 'wonderless',
    'worrylessness': 'worryless',
    'youthlessness': 'youthless',
}

# 常见复合词列表（用于复合词检测）
COMMON_COMPOUND_WORDS = [
    # 动词+副词/介词组合
    'roundup', 'checkin', 'login', 'logout', 'signup', 'signin',
    'startup', 'shutdown', 'backup', 'setup', 'cleanup', 'makeup',
    'breakup', 'buildup', 'callup', 'comeup', 'cookup', 'drawup', 
    'dressup', 'driveup', 'dropup', 'fillup', 'fixup', 'followup', 
    'getup', 'giveup', 'growup', 'hangup', 'holdup', 'keepup', 
    'lookup', 'mixup', 'openup', 'pickup', 'popup', 'pullup', 
    'pushup', 'putup', 'showup', 'shutup', 'situp', 'speedup', 
    'stepup', 'stopup', 'takeup', 'tearup', 'throwup', 'tieup', 
    'turnup', 'wakeup', 'warmup', 'workup', 'writeup',
    
    # 其他常见复合词
    'checkout', 'handout', 'layout', 'outlook', 'outcome', 'outdoor',
    'outline', 'output', 'outset', 'outward', 'overcome', 'overdo',
    'overeat', 'overhead', 'overlook', 'overnight', 'overseas',
    'overtake', 'overtime', 'undertake', 'underwear', 'underway',
    'upcoming', 'upgrade', 'uphold', 'upright', 'uprising', 'uproar',
    'uproot', 'upset', 'upside', 'upstairs', 'upstream', 'upturn',
    'downfall', 'downgrade', 'downhill', 'download', 'downplay',
    'downpour', 'downright', 'downstairs', 'downstream', 'downturn'
]