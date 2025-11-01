// 直接测试AI服务的脚本，绕过Express服务器
const dotenv = require('dotenv');
dotenv.config();

const aiService = require('./services/aiService');

async function testAIService() {
  console.log('开始直接测试AI服务...');
  
  try {
    // 测试API配置
    console.log('API URL:', aiService.apiUrl);
    console.log('API Model:', aiService.model);
    console.log('API Key存在:', !!aiService.apiKey);
    console.log('axios模块加载:', !!aiService.axios);
    
    // 测试关键词提取
    console.log('\n测试关键词提取...');
    const testDescription = '黑色皮质钱包，内有身份证和银行卡，在图书馆三楼遗失';
    const keywords = await aiService.extractKeywords(testDescription);
    console.log('关键词提取结果:', keywords);
    
    console.log('\nAI服务测试成功!');
  } catch (error) {
    console.error('\nAI服务测试失败:', error.message);
    console.error('错误详情:', error);
    
    // 检查是否是API密钥问题
    if (error.message.includes('授权') || error.message.includes('未授权') || error.message.includes('401')) {
      console.log('\n可能的原因:');
      console.log('1. API密钥无效或已过期');
      console.log('2. API密钥格式错误');
      console.log('3. API端点需要不同的认证方式');
    }
  }
}

testAIService().catch(err => {
  console.error('测试脚本执行失败:', err);
});