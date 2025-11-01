// 直接测试DeepSeek API认证问题的脚本
const axios = require('axios');
require('dotenv').config();

async function testDeepSeekAuth() {
  console.log('=== DeepSeek API认证测试 ===');
  console.log('当前环境:', process.env.NODE_ENV || 'development');
  
  // 获取API配置
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL || 'https://api.deepseek.com/v1/chat/completions';
  const model = process.env.AI_API_MODEL || 'deepseek-chat';
  
  console.log('API配置检查:');
  console.log('- API URL:', apiUrl);
  console.log('- 模型:', model);
  console.log('- API密钥存在:', !!apiKey);
  console.log('- API密钥长度:', apiKey ? apiKey.length : 0);
  console.log('- API密钥前5位:', apiKey ? apiKey.substring(0, 5) + '...' : '无');
  
  if (!apiKey) {
    console.error('❌ 错误: 未配置AI_API_KEY环境变量');
    process.exit(1);
  }
  
  // 测试简单的API调用
  try {
    console.log('\n开始测试API调用...');
    
    const response = await axios.post(
      apiUrl,
      {
        model: model,
        messages: [
          { role: 'system', content: '你是一个助手。' },
          { role: 'user', content: '测试' }
        ],
        temperature: 0.3,
        max_tokens: 20
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 20000
      }
    );
    
    console.log('✅ API调用成功!');
    console.log('状态码:', response.status);
    console.log('响应数据:', response.data);
    
  } catch (error) {
    console.error('❌ API调用失败!');
    console.error('错误类型:', error.name);
    console.error('错误代码:', error.code);
    console.error('错误消息:', error.message);
    
    if (error.response) {
      console.error('\nHTTP响应详情:');
      console.error('- 状态码:', error.response.status);
      console.error('- 状态文本:', error.response.statusText);
      
      // 详细检查响应数据
      if (error.response.data) {
        console.error('- 响应数据:', JSON.stringify(error.response.data, null, 2));
        
        // 分析DeepSeek特定的错误信息
        if (error.response.status === 401) {
          console.error('\n🔴 认证失败分析:');
          console.error('- 可能原因1: API密钥无效');
          console.error('- 可能原因2: API密钥已过期');
          console.error('- 可能原因3: API密钥格式错误');
          console.error('- 可能原因4: DeepSeek API服务需要额外的注册或审批');
          
          if (error.response.data.error?.message) {
            console.error('- DeepSeek错误信息:', error.response.data.error.message);
          }
        }
      }
    } else if (error.request) {
      console.error('\n未收到响应，请求已发送');
      console.error('- 可能原因: 网络问题、防火墙阻止、API服务不可用');
    }
    
    process.exit(1);
  }
}

// 运行测试
testDeepSeekAuth().catch(err => {
  console.error('测试脚本执行失败:', err);
  process.exit(1);
});