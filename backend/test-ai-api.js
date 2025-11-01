const axios = require('axios');

/**
 * AI API测试脚本
 * 用于演示如何调用AI相关的API端点
 */

// 基础URL
const BASE_URL = 'http://localhost:3000/api';

/**
 * 测试提取关键词API
 */
async function testExtractKeywords(itemId, itemType) {
  try {
    console.log(`\n测试提取关键词 API (${itemType}-${itemId})...`);
    const response = await axios.get(`${BASE_URL}/ai/keywords/${itemType}/${itemId}`);
    console.log('提取关键词成功:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('提取关键词失败:', error.response?.data || error.message);
  }
}

/**
 * 测试生成验证问题API
 */
async function testGenerateQuestions(itemId, itemType) {
  try {
    console.log(`\n测试生成验证问题 API (${itemType}-${itemId})...`);
    const response = await axios.get(`${BASE_URL}/ai/questions/${itemType}/${itemId}`);
    console.log('生成验证问题成功:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('生成验证问题失败:', error.response?.data || error.message);
  }
}

/**
 * 测试验证答案API
 */
async function testValidateAnswer(itemId, itemType, answer, keywords) {
  try {
    console.log(`\n测试验证答案 API (${itemType}-${itemId})...`);
    const response = await axios.post(`${BASE_URL}/ai/validate/${itemType}/${itemId}`, {
      answer,
      keywords
    });
    console.log('验证答案成功:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('验证答案失败:', error.response?.data || error.message);
  }
}

/**
 * 运行完整测试流程
 */
async function runFullTest() {
  console.log('开始AI API测试...');

  // 测试参数
  const itemId = '1'; // 假设有一个ID为1的招领物品
  const itemType = 'found';

  // 1. 先测试提取关键词
  const keywordsResult = await testExtractKeywords(itemId, itemType);
  
  // 2. 测试生成验证问题
  const questionsResult = await testGenerateQuestions(itemId, itemType);

  // 3. 如果有结果，测试验证答案
  if (keywordsResult && keywordsResult.data && keywordsResult.data.keywords.length > 0) {
    const keywords = keywordsResult.data.keywords;
    
    // 测试正确答案
    await testValidateAnswer(itemId, itemType, `这个物品有${keywords[0]}特征`, keywords);
    
    // 测试错误答案
    await testValidateAnswer(itemId, itemType, '这个物品是红色的圆形', keywords);
  }

  console.log('\nAI API测试完成');
}

// 运行测试
runFullTest().catch(console.error);