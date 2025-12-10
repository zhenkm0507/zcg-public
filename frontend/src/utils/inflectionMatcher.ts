/**
 * 变形形式判断工具函数
 * 支持以下两种规则：
 * 1. 答案：lit,lighted   用户输入lit或者lighted都算成功
 * 2. 答案：travel(l)ed   用户输入 travel(l)ed、travelled、traveled这三种都算正确
 */

export const checkInflectionAnswer = (userInput: string, correctAnswer: string): boolean => {
  const trimmedInput = userInput.trim();
  const trimmedAnswer = correctAnswer.trim();
  
  if (!trimmedInput || !trimmedAnswer) {
    return false;
  }

  // 情况1：答案包含逗号，表示多个正确答案
  if (trimmedAnswer.includes(',')) {
    const answers = trimmedAnswer.split(',').map(ans => ans.trim());
    return answers.some(answer => trimmedInput === answer);
  }

  // 情况2：答案包含括号，表示括号内内容可选
  if (trimmedAnswer.includes('(') && trimmedAnswer.includes(')')) {
    // 使用正则表达式处理括号内的可选内容
    const regex = /\(([^)]+)\)/g;
    let match: RegExpExecArray | null;
    let possibleAnswers = [trimmedAnswer];
    
    // 生成所有可能的答案组合
    while ((match = regex.exec(trimmedAnswer)) !== null) {
      const optionalContent = match[1];
      const newAnswers: string[] = [];
      
      possibleAnswers.forEach(answer => {
        // 包含可选内容的版本
        newAnswers.push(answer.replace(match![0], optionalContent));
        // 不包含可选内容的版本
        newAnswers.push(answer.replace(match![0], ''));
      });
      
      possibleAnswers = newAnswers;
    }
    
    // 去重并检查用户输入是否匹配任一答案
    const uniqueAnswers = [...new Set(possibleAnswers)];
    return uniqueAnswers.some(answer => trimmedInput === answer);
  }

  // 情况3：普通精确匹配
  return trimmedInput === trimmedAnswer;
};

// 测试用例
export const testInflectionMatcher = () => {
  console.log('=== 变形形式匹配测试 ===');
  
  // 测试情况1：逗号分隔的多个答案
  console.log('测试1 - 逗号分隔答案:');
  console.log('答案: "lit,lighted"');
  console.log('输入 "lit":', checkInflectionAnswer('lit', 'lit,lighted')); // true
  console.log('输入 "lighted":', checkInflectionAnswer('lighted', 'lit,lighted')); // true
  console.log('输入 "light":', checkInflectionAnswer('light', 'lit,lighted')); // false
  
  // 测试情况2：括号内的可选内容
  console.log('\n测试2 - 括号可选内容:');
  console.log('答案: "travel(l)ed"');
  console.log('输入 "travel(l)ed":', checkInflectionAnswer('travel(l)ed', 'travel(l)ed')); // true
  console.log('输入 "travelled":', checkInflectionAnswer('travelled', 'travel(l)ed')); // true
  console.log('输入 "traveled":', checkInflectionAnswer('traveled', 'travel(l)ed')); // true
  console.log('输入 "travel":', checkInflectionAnswer('travel', 'travel(l)ed')); // false
  
  // 测试复杂情况：多个括号
  console.log('\n测试3 - 多个括号:');
  console.log('答案: "colour(ed)"');
  console.log('输入 "coloured":', checkInflectionAnswer('coloured', 'colour(ed)')); // true
  console.log('输入 "colour":', checkInflectionAnswer('colour', 'colour(ed)')); // true
  
  // 测试情况3：普通精确匹配
  console.log('\n测试4 - 普通精确匹配:');
  console.log('答案: "went"');
  console.log('输入 "went":', checkInflectionAnswer('went', 'went')); // true
  console.log('输入 "go":', checkInflectionAnswer('go', 'went')); // false
  
  // 测试边界情况
  console.log('\n测试5 - 边界情况:');
  console.log('空输入:', checkInflectionAnswer('', 'went')); // false
  console.log('空答案:', checkInflectionAnswer('went', '')); // false
  console.log('空格处理:', checkInflectionAnswer('  went  ', 'went')); // true
}; 