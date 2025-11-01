// 测试实际应用中的AI路由是否正常工作
const axios = require('axios');

async function testRealAiRoute() {
  try {
    console.log('测试实际应用中的AI路由...');
    console.log('目标URL: http://localhost:3000/api/ai/keywords/found/1');
    
    const startTime = Date.now();
    const response = await axios.get(
      'http://localhost:3000/api/ai/keywords/found/1',
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    const endTime = Date.now();
    console.log(`测试成功! 响应状态: ${response.status}`);
    console.log(`响应时间: ${endTime - startTime}ms`);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('测试失败!');
    
    if (error.response) {
      // 服务器返回错误响应
      console.error('HTTP状态码:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // 请求已发送但未收到响应
      console.error('未收到响应:', error.message);
    } else {
      // 请求配置出错
      console.error('请求错误:', error.message);
    }
    
    throw error;
  }
}

// 执行测试
testRealAiRoute()
  .then(result => {
    console.log('\n测试完成: 成功');
  })
  .catch(error => {
    console.log('\n测试完成: 失败');
    process.exit(1);
  });