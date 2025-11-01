// 调试脚本：详细检查401错误的来源
const axios = require('axios');
const fs = require('fs');

async function debug401Error() {
  try {
    console.log('=== 开始调试401错误 ===');
    
    // 1. 测试AI路由
    console.log('\n1. 测试AI路由: GET /api/ai/keywords/found/1');
    try {
      const aiResponse = await axios.get(
        'http://localhost:3000/api/ai/keywords/found/1',
        {
          headers: {
            'Accept': 'application/json'
          },
          // 捕获完整的错误信息
          validateStatus: () => true
        }
      );
      console.log('AI路由响应状态:', aiResponse.status);
      console.log('AI路由响应数据:', JSON.stringify(aiResponse.data, null, 2));
      console.log('AI路由响应头:', JSON.stringify(aiResponse.headers, null, 2));
    } catch (error) {
      if (error.response) {
        console.log('AI路由错误状态:', error.response.status);
        console.log('AI路由错误数据:', JSON.stringify(error.response.data, null, 2));
        console.log('AI路由错误头:', JSON.stringify(error.response.headers, null, 2));
      } else {
        console.log('AI路由请求错误:', error.message);
      }
    }
    
    // 2. 测试其他不需要认证的路由进行对比
    console.log('\n2. 测试健康检查路由: GET /');
    try {
      const healthResponse = await axios.get(
        'http://localhost:3000',
        {
          headers: {
            'Accept': 'application/json'
          },
          validateStatus: () => true
        }
      );
      console.log('健康检查响应状态:', healthResponse.status);
      console.log('健康检查响应数据:', JSON.stringify(healthResponse.data, null, 2));
    } catch (error) {
      console.log('健康检查路由错误:', error.message);
    }
    
    // 3. 测试获取招领物品列表路由
    console.log('\n3. 测试招领物品列表路由: GET /api/found-items');
    try {
      const foundItemsResponse = await axios.get(
        'http://localhost:3000/api/found-items',
        {
          headers: {
            'Accept': 'application/json'
          },
          validateStatus: () => true
        }
      );
      console.log('招领物品列表响应状态:', foundItemsResponse.status);
      console.log('招领物品列表响应数据:', JSON.stringify(foundItemsResponse.data, null, 2).substring(0, 200) + '...');
    } catch (error) {
      if (error.response) {
        console.log('招领物品列表错误状态:', error.response.status);
        console.log('招领物品列表错误数据:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('招领物品列表请求错误:', error.message);
      }
    }
    
    // 4. 检查路由配置文件
    console.log('\n4. 检查路由配置文件:');
    const aiRoutesPath = './routes/aiRoutes.js';
    if (fs.existsSync(aiRoutesPath)) {
      const aiRoutesContent = fs.readFileSync(aiRoutesPath, 'utf8');
      console.log('AI路由文件内容:');
      console.log(aiRoutesContent);
    }
    
    // 5. 输出可能的问题原因
    console.log('\n=== 可能的问题原因分析 ===');
    console.log('1. 检查是否有全局认证中间件');
    console.log('2. 检查app.js中路由挂载顺序');
    console.log('3. 检查是否有其他中间件拦截了请求');
    console.log('4. 检查JWT配置是否正确');
    
    return '调试完成';
  } catch (error) {
    console.error('调试过程中发生错误:', error.message);
    return '调试失败';
  }
}

// 执行调试
debug401Error()
  .then(result => {
    console.log('\n' + result);
  })
  .catch(error => {
    console.error('\n调试异常:', error);
  });