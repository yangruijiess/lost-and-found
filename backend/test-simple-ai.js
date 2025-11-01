// 测试简化Express服务器上的AI路由
const axios = require('axios');

async function testSimpleAI() {
  try {
    console.log('测试简化Express服务器上的AI路由...');
    
    const response = await axios.get('http://localhost:3001/api/ai/keywords/found/1');
    
    console.log('测试成功! 响应状态:', response.status);
    console.log('响应数据:', response.data);
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求已发送但未收到响应');
    } else {
      console.error('请求配置错误:', error.message);
    }
  }
}

testSimpleAI();