// AI路由详细调试脚本
const axios = require('axios');

async function testAiRoute() {
  console.log('=== AI路由详细调试 ===');
  
  // 测试提取关键词路由
  const itemType = 'found'; // 招领物品类型
  const itemId = '1';       // 假设存在的物品ID
  const apiUrl = `http://localhost:3000/api/ai/keywords/${itemType}/${itemId}`;
  
  console.log('测试API:', apiUrl);
  console.log('开始发送请求...');
  
  const startTime = Date.now();
  try {
    const response = await axios.get(apiUrl, {
      timeout: 30000,
      // 记录完整的请求头
      headers: {
        'User-Agent': 'Debug-Tool/1.0',
        'Accept': 'application/json'
      },
      // 允许重定向
      maxRedirects: 5,
      // 记录完整的响应数据
      responseType: 'json'
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ 请求成功! 耗时: ${duration}ms`);
    console.log('状态码:', response.status);
    console.log('响应头:', response.headers);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ 请求失败! 耗时: ${duration}ms`);
    
    // 记录完整的错误信息
    console.error('\n错误详情:');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    
    // 分析响应错误
    if (error.response) {
      console.error('\nHTTP响应详情:');
      console.error('- 状态码:', error.response.status);
      console.error('- 状态文本:', error.response.statusText);
      console.error('- 响应头:', error.response.headers);
      console.error('- 响应数据:', JSON.stringify(error.response.data, null, 2));
      
      // 特别分析401错误
      if (error.response.status === 401) {
        console.error('\n🔴 401未授权分析:');
        console.error('- 可能原因1: 服务器内部认证中间件拦截');
        console.error('- 可能原因2: 路由处理错误');
        console.error('- 可能原因3: 数据库访问权限问题');
        console.error('- 可能原因4: 请求格式不正确');
      }
    } 
    // 分析请求错误
    else if (error.request) {
      console.error('\n请求发送但未收到响应:');
      console.error('- 请求对象:', error.request);
      console.error('- 可能原因: 服务器崩溃、端口错误、网络问题');
    }
    // 分析配置错误
    else {
      console.error('\n请求配置错误:');
      console.error('- 错误消息:', error.message);
    }
  }
}

// 立即运行测试
testAiRoute().catch(err => {
  console.error('测试脚本执行失败:', err);
  process.exit(1);
});