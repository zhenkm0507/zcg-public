import React, { useState } from 'react';
import { Card, Collapse, Typography, Divider, Tag, Space } from 'antd';
import { 
  BookOutlined, 
  BulbOutlined, 
  MenuOutlined, 
  TrophyOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  StarOutlined,
  CrownOutlined,
  StarFilled
} from '@ant-design/icons';
import styles from './page.module.css';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const GuideSection: React.FC = () => {
  const [activeKeys, setActiveKeys] = useState<string[]>(['1', '2', '3', '4']);

  const handlePanelChange = (keys: string | string[]) => {
    setActiveKeys(Array.isArray(keys) ? keys : [keys]);
  };

  return (
    <div className={styles.guideContent}>
      <div className={styles.guideHeader}>
        <Title level={2} className={styles.guideTitle}>
          <BookOutlined className={styles.guideIcon} />
          斩词阁使用指南
        </Title>
        <Paragraph className={styles.guideSubtitle}>
          欢迎来到斩词阁！这里是您的词汇修炼圣地，本指南将助您快速掌握系统奥秘，开启一段精彩的词汇修炼之旅。
        </Paragraph>
        <div className={styles.blessingSection}>
          <Text italic className={styles.blessingText}>
            <span className={styles.highlightText}>「嘉」</span>者，美好、嘉奖、吉庆也；<span className={styles.highlightText}>「熙」</span>者，光明、兴盛、和乐也。愿您在词汇修炼的江湖中，<span className={styles.highlightText}>嘉熙</span>相伴，一生美好，前途光明！
          </Text>
        </div>
      </div>

      <Collapse 
        activeKey={activeKeys} 
        onChange={handlePanelChange}
        className={styles.guideCollapse}
        expandIconPosition="end"
      >
        {/* 一、斩词阁简介 */}
        <Panel 
          header={
            <div className={styles.panelHeader}>
              <CrownOutlined className={styles.panelIcon} />
              <span>一、斩词阁简介</span>
            </div>
          } 
          key="1"
          className={styles.guidePanel}
        >
          <div className={styles.panelContent}>
            <Card className={styles.guideCard}>
              <Title level={4} className={styles.cardTitle}>
                <StarOutlined className={styles.cardIcon} />
                系统概述
              </Title>
              <Paragraph className={styles.cardContent}>
                古阁凌云，词汇如珠，珍宝、武林、秘籍、宝剑、盔甲……诸般奇珍异宝汇于一阁，尽显东方浪漫风华！
              </Paragraph>
              <Paragraph className={styles.cardContent}>
                斩词阁是一座融合现代科技与古典美学的词汇修炼圣地，以武侠国风为底蕴，让枯燥的背单词化作一场精彩的修炼之旅。
                通过"斩杀"单词的独特方式，激发您的学习热情，助您在词汇的江湖中披荆斩棘，最终成为词汇大师。
              </Paragraph>
            </Card>

            <Card className={styles.guideCard}>
              <Title level={4} className={styles.cardTitle}>
                <CheckCircleOutlined className={styles.cardIcon} />
                核心特色
              </Title>
              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <Tag color="gold" className={styles.featureTag}>武侠国风</Tag>
                  <Text>武侠国风，尽展华夏浪漫；每一次修炼，皆如行走江湖，快意恩仇，精彩纷呈！</Text>
                </div>
                <div className={styles.featureItem}>
                  <Tag color="blue" className={styles.featureTag}>智能考核</Tag>
                  <Text>词汇、特殊形式、短语搭配，全方位智能考核，助您全面掌握词汇。</Text>
                </div>
                <div className={styles.featureItem}>
                  <Tag color="green" className={styles.featureTag}>成就系统</Tag> 
                  <Text>丰富的奖励机制如同江湖中的奇遇，激励您持续修炼，在词汇的江湖中留下传奇！</Text>
                </div>
                <div className={styles.featureItem}>
                  <Tag color="purple" className={styles.featureTag}>数据统计</Tag>
                  <Text>如同武林秘籍般详细记录您的修炼历程，让您随时掌握自己的词汇修为进展。</Text>
                </div>
              </div>
            </Card>
          </div>
        </Panel>

        {/* 二、概念解释 */}
        <Panel 
          header={
            <div className={styles.panelHeader}>
              <BulbOutlined className={styles.panelIcon} />
              <span>二、概念解释</span>
            </div>
          } 
          key="2"
          className={styles.guidePanel}
        >
          <div className={styles.panelContent}>
            <Card className={styles.guideCard}>
              <Title level={4} className={styles.cardTitle}>
                <InfoCircleOutlined className={styles.cardIcon} />
                名词概念
              </Title>
              <div className={styles.conceptGrid}>
                <div className={styles.conceptItem}>
                  <div className={styles.conceptHeader}>
                    <Text strong>背词/背词率</Text>
                  </div>
                  <Text>于斩词阁中，若能将一词之本义、变形、短语搭配等尽数答对，便谓之"背词"。</Text>
                  <Text>背词率，乃所背之词数与词库总数之比也。</Text>
                </div>
                <div className={styles.conceptItem}>
                  <div className={styles.conceptHeader}>
                    <Text strong>斩词/斩词率</Text>
                  </div>
                  <Text>"斩词"者，谓对某词已成永久之记忆。初次背词后，时隔一月再度全对，方可称"斩"。</Text>
                  <Text>斩词率，乃所斩之词数与词库总数之比。</Text>
                </div>
                <div className={styles.conceptItem}>
                  <div className={styles.conceptHeader}>
                    <Text strong>经验值</Text>
                  </div>
                  <Text>经验值，随背词之数而增，计为：背词数除以词库总数，乘以百。可在揽月台-资料页面查看。</Text>
                </div>
                <div className={styles.conceptItem}>
                  <div className={styles.conceptHeader}>
                    <Text strong>士气值</Text>
                  </div>
                  <Text>士气者，修炼之气也。初始六十，每一时辰内，背词成功率若高于八成，则士气加一；若低于七成，则士气减一。可在揽月台-资料页面查看。</Text>
                </div>
                <div className={styles.conceptItem}>
                  <div className={styles.conceptHeader}>
                    <Text strong>修罗词</Text>
                  </div>
                  <Text>"修罗"本为恶魔，亦指极其激烈之境。修罗词，乃记忆尤难之词，若背词失败逾阈（可于揽月台-资料设定），即列为修罗。</Text>
                </div>
              </div>
            </Card>

            <Card className={styles.guideCard}>
              <Title level={4} className={styles.cardTitle}>
                <TrophyOutlined className={styles.cardIcon} />
                等级系统
              </Title>
              <div className={styles.levelExamplesCard}>
                <div className={styles.levelCard}>
                  <Tag color="default">功夫小子</Tag>
                  <div className={styles.levelDesc}>斩词率&lt;20%</div>
                </div>
                <div className={styles.levelCard}>
                  <Tag color="processing">武林新秀</Tag>
                  <div className={styles.levelDesc}>20%≤斩词率&lt;50%</div>
                </div>
                <div className={styles.levelCard}>
                  <Tag color="warning">江湖豪侠</Tag>
                  <div className={styles.levelDesc}>50%≤斩词率&lt;80%</div>
                </div>
                <div className={styles.levelCard}>
                  <Tag color="success">一代宗师</Tag>
                  <div className={styles.levelDesc}>80%≤斩词率&lt;100%</div>
                </div>
                <div className={styles.levelCard}>
                  <Tag color="error">绝世高手</Tag>
                  <div className={styles.levelDesc}>斩词率=100%</div>
                </div>
              </div>
            </Card>
          </div>
        </Panel>

        {/* 三、菜单介绍 */}
        <Panel 
          header={
            <div className={styles.panelHeader}>
              <MenuOutlined className={styles.panelIcon} />
              <span>三、菜单介绍</span>
            </div>
          } 
          key="3"
          className={styles.guidePanel}
        >
          <div className={styles.panelContent}>
            <Card className={styles.guideCard}>
              <Title level={4} className={styles.cardTitle}>
                <BookOutlined className={styles.cardIcon} />
                菜单导航
              </Title>
              <div className={styles.menuGrid}>
                <div className={styles.menuItem}>
                  <div className={styles.menuIcon}>🏛️</div>
                  <div className={styles.menuInfo}>
                    <div className={styles.menuTitle}>登科堂</div>
                    <div className={styles.menuScene}>阁楼一层，展示大堂</div>
                    <Text type="secondary">如武林大会之金榜，陈列修炼之功业，见证您的词海征途与步步高升。</Text>
                  </div>
                </div>
                <div className={styles.menuItem}>
                  <div className={styles.menuIcon}>📚</div>
                  <div className={styles.menuInfo}>
                    <div className={styles.menuTitle}>墨耕斋</div>
                    <div className={styles.menuScene}>阁楼二层，主修道场</div>
                    <Text type="secondary">词汇修炼之主场，挥毫泼墨，单词对决如江湖论剑，激烈非常。</Text>
                  </div>
                </div>
                <div className={styles.menuItem}>
                  <div className={styles.menuIcon}>⚔️</div>
                  <div className={styles.menuInfo}>
                    <div className={styles.menuTitle}>淬词坊</div>
                    <div className={styles.menuScene}>阁楼三层，密训之所</div>
                    <Text type="secondary">千淬百炼，修罗战场。聚焦屡背屡忘之难词。</Text>
                  </div>
                </div>
                <div className={styles.menuItem}>
                  <div className={styles.menuIcon}>📖</div>
                  <div className={styles.menuInfo}>
                    <div className={styles.menuTitle}>汗青廊</div>
                    <div className={styles.menuScene}>阁楼四层，汗青记忆</div>
                    <Text type="secondary">修炼史册，江湖足迹。回顾往昔修炼之路，铭记每一段成长。</Text>
                  </div>
                </div>
                <div className={styles.menuItem}>
                  <div className={styles.menuIcon}>🗄️</div>
                  <div className={styles.menuInfo}>
                    <div className={styles.menuTitle}>藏经枢</div>
                    <div className={styles.menuScene}>阁楼五层，藏经之所</div>
                    <Text type="secondary">词汇宝典，秘籍云集。珍藏各类词库，亦有特殊变形、谚语等珍稀典籍。</Text>
                  </div>
                </div>
                <div className={styles.menuItem}>
                  <div className={styles.menuIcon}>🌙</div>
                  <div className={styles.menuInfo}>
                    <div className={styles.menuTitle}>揽月台</div>
                    <div className={styles.menuScene}>阁楼顶层，揽月静修，诗意浪漫</div>
                    <Text type="secondary">长夜漫漫，修炼之余，登台揽月，静赏装备与成果，体味词海修行的诗意与浪漫。</Text>
                  </div>
                </div>
              </div>
            </Card>

            <Card className={styles.guideCard}>
              <Title level={4} className={styles.cardTitle}>
                <StarOutlined className={styles.cardIcon} />
                使用建议
              </Title>
              <div className={styles.usageTips}>
                <div className={styles.tipItem}>
                  <Text strong><span className={styles.noWrap}>1. 每日修炼：</span></Text>
                  <Text>
                    如武林高手晨昏不辍，贵在持之以恒。每日于<strong>墨耕斋</strong>修炼词汇，步步精进，修为自高。
                  </Text>
                  <div className={styles.tipDetail}>
                    <div className={styles.tipDetailTitle}>背词方式有两种：</div>
                    <ol className={styles.tipDetailList}>
                      <li>
                        <b>常规修炼：</b> 从墨耕斋——斩词页面进入，系统自动为你挑选未斩单词。
                      </li>
                      <li>
                        <b>自定批次：</b> 在墨耕斋——批次设置页面新建学习批次，勾选想背的单词，点击开始学习后，系统会自动从所选单词集中安排修炼。
                      </li>
                    </ol>
                  </div>
                </div>
                <div className={styles.tipItem}>
                  <Text strong><span className={styles.noWrap}>2. 进度掌控：</span></Text>
                  <Text>常<strong>登科堂</strong>，观榜自省。正如江湖豪杰比武论道，时常检视修炼成果，方能知己知彼，百战不殆。</Text>
                </div>
                <div className={styles.tipItem}>
                  <Text strong><span className={styles.noWrap}>3. 重点突破：</span></Text>
                  <Text>直面修罗词，专攻难关。于<strong>淬词坊</strong>苦练，犹如大侠破阵斩敌，逐一攻克，终成绝学。</Text>
                </div>
                <div className={styles.tipItem}>
                  <Text strong><span className={styles.noWrap}>4. 记录回顾：</span></Text>
                  <Text>时至<strong>汗青廊</strong>，翻阅修炼旧章。正如前辈温故知新，回望过往修行，方能巩固根基，厚积薄发。</Text>
                </div>
              </div>
            </Card>
          </div>
        </Panel>

        {/* 四、激励机制 */}
        <Panel 
          header={
            <div className={styles.panelHeader}>
              <TrophyOutlined className={styles.panelIcon} />
              <span>四、成就系统</span>
            </div>
          } 
          key="4"
          className={styles.guidePanel}
        >
          <div className={styles.panelContent}>
            <Card className={styles.guideCard}>
              <Title level={4} className={styles.cardTitle}>
                <InfoCircleOutlined className={styles.cardIcon} />
                系统概述
              </Title>
              <Paragraph className={styles.cardContent}>
                成就系统是斩词阁的核心激励机制，包含四个重要组成部分：
              </Paragraph>
              <div className={styles.achievementOverview}>
                <div className={styles.achievementItem}>
                  <Tag color="blue">经验值</Tag>
                  <Text>随背词数量增长，反映修炼进度</Text>
                </div>
                <div className={styles.achievementItem}>
                  <Tag color="green">士气值</Tag>
                  <Text>根据背词成功率动态调整，体现修炼状态</Text>
                </div>
                <div className={styles.achievementItem}>
                  <Tag color="orange">个人等级</Tag>
                  <Text>基于斩词率划分，从功夫小子到武林至尊</Text>
                </div>
                <div className={styles.achievementItem}>
                  <Tag color="purple">奖品体系</Tag>
                  <Text>完成一定学习目标，可获得珍宝、秘籍、宝剑、盔甲等奖励</Text>
                </div>
              </div>
              <Paragraph className={styles.cardContent}>
                其中经验值、士气值、个人等级已在前面章节详细介绍，本节重点为您介绍<strong>奖品体系</strong>。
              </Paragraph>
            </Card>

            <Card className={styles.guideCard}>
              <Title level={4} className={styles.cardTitle}>
                <CrownOutlined className={styles.cardIcon} />
                奖品体系
              </Title>
              <div className={styles.awardTypeGroup}>
                {/* 珍宝 */}
                <div className={styles.awardTypeBlock}>
                  <div className={styles.awardTypeTitle}>珍宝</div>
                  <div className={styles.awardTypeDesc}>一天背词60+，可随机获得某种类型的珍宝</div>
                  <div className={styles.awardList}>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>平安扣</div>
                      <div className={styles.awardCondition}>获奖概率23%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>十二生肖</div>
                      <div className={styles.awardCondition}>获奖概率20%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>断剑饰品</div>
                      <div className={styles.awardCondition}>获奖概率14%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>金箍棒饰品</div>
                      <div className={styles.awardCondition}>获奖概率13%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>浮雕翡翠</div>
                      <div className={styles.awardCondition}>获奖概率10%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>八瑞相</div>
                      <div className={styles.awardCondition}>获奖概率8%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>黄金貔貅</div>
                      <div className={styles.awardCondition}>获奖概率6%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>海洋之泪</div>
                      <div className={styles.awardCondition}>获奖概率4%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>星辰钻</div>
                      <div className={styles.awardCondition}>获奖概率2%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>传国玉玺</div>
                      <div className={styles.awardCondition}>仅斩词率100%可获得且唯一</div>
                    </div>
                  </div>
                </div>
                {/* 秘籍 */}
                <div className={styles.awardTypeBlock}>
                  <div className={styles.awardTypeTitle}>秘籍</div>
                  <div className={styles.awardTypeDesc}>背词率/斩词率达一定值，可获得对应段位的武林秘籍</div>
                  <div className={styles.awardList}>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>吐纳诀</div>
                      <div className={styles.awardCondition}>背词率 &gt; 2%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>华山剑法</div>
                      <div className={styles.awardCondition}>背词率 &gt; 15%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>六脉神剑</div>
                      <div className={styles.awardCondition}>背词率 &gt; 50%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>独孤九剑</div>
                      <div className={styles.awardCondition}>斩词率 &gt; 60%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>九阴真经</div>
                      <div className={styles.awardCondition}>斩词率 &gt; 70%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>易筋经</div>
                      <div className={styles.awardCondition}>斩词率 &gt; 90%</div>
                    </div>
                  </div>
                </div>
                {/* 宝剑 */}
                <div className={styles.awardTypeBlock}>
                  <div className={styles.awardTypeTitle}>宝剑</div>
                  <div className={styles.awardTypeDesc}>背词率/斩词率达一定值，可获得对应段位的宝剑</div>
                  <div className={styles.awardList}>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>竹剑</div>
                      <div className={styles.awardCondition}>背词率 &gt; 5%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>铁剑</div>
                      <div className={styles.awardCondition}>背词率 &gt; 20%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>青釭剑</div>
                      <div className={styles.awardCondition}>背词率 &gt; 35%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>玄铁重剑</div>
                      <div className={styles.awardCondition}>斩词率 &gt; 50%</div>
                    </div>
                    <div className={[styles.awardItem, styles.awardItemUltimate].join(' ')}>
                      <div className={styles.awardNameUltimate}>
                        轩辕剑 <CrownOutlined className={styles.ultimateIcon} />
                      </div>
                      <div className={styles.awardConditionUltimate}>斩词率 = 100%</div>
                    </div>
                  </div>
                </div>
                {/* 盔甲 */}
                <div className={styles.awardTypeBlock}>
                  <div className={styles.awardTypeTitle}>盔甲</div>
                  <div className={styles.awardTypeDesc}>背词率/斩词率达一定值，可获得对应段位的盔甲</div>
                  <div className={styles.awardList}>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>玄衣</div>
                      <div className={styles.awardCondition}>开局即送</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>玄铁锁子甲</div>
                      <div className={styles.awardCondition}>背词率 &gt; 30%</div>
                    </div>
                    <div className={styles.awardItem}>
                      <div className={styles.awardName}>明光山文铠</div>
                      <div className={styles.awardCondition}>斩词率 &gt; 65%</div>
                    </div>
                    <div className={[styles.awardItem, styles.awardItemUltimate].join(' ')}>
                      <div className={styles.awardNameUltimate}>
                        神御玄金甲 <CrownOutlined className={styles.ultimateIcon} />
                      </div>
                      <div className={styles.awardConditionUltimate}>斩词率 = 100%</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className={styles.guideCard}>
              <Title level={4} className={styles.cardTitle}>
                <StarOutlined className={styles.cardIcon} />
                学习建议
              </Title>
              <div className={styles.studyAdvice}>
                <table className={styles.adviceTable}>
                  <tbody>
                    <tr className={styles.adviceRow}>
                      <td className={styles.adviceTitle}><Text strong><span className={styles.noWrap}>• 保持连续性：</span></Text></td>
                      <td className={styles.adviceContent}><Text>如同武林高手每日练功不辍，每天坚持修炼，保持修炼节奏，让词汇成为您的本能</Text></td>
                    </tr>
                    <tr className={styles.adviceRow}>
                      <td className={styles.adviceTitle}><Text strong><span className={styles.noWrap}>• 注重质量：</span></Text></td>
                      <td className={styles.adviceContent}><Text>如同修炼武功讲究根基扎实，确保每个单词都真正掌握，不要急于求成，稳扎稳打</Text></td>
                    </tr>
                    <tr className={styles.adviceRow}>
                      <td className={styles.adviceTitle}><Text strong><span className={styles.noWrap}>• 及时复习：</span></Text></td>
                      <td className={styles.adviceContent}><Text>如同武林前辈温故知新，定期回顾已学单词，巩固记忆效果，让词汇深深扎根</Text></td>
                    </tr>
                    <tr className={styles.adviceRow}>
                      <td className={styles.adviceTitle}><Text strong><span className={styles.noWrap}>• 享受过程：</span></Text></td>
                      <td className={styles.adviceContent}><Text>如同武林高手享受修炼的乐趣，将学习当作一场精彩的修炼之旅，享受提升的过程，享受揽月台的诗意浪漫</Text></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </Panel>
      </Collapse>

      <Divider className={styles.guideDivider} />
    </div>
  );
};

export default GuideSection; 