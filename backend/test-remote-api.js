// 测试远程MySQL数据库API连接
const http = require('http');

// 从控制器导入配置
const { remoteConfig, mockUsers } = require('./controllers/authController');
const { REMOTE_API_URL, REMOTE_API_PORT, REMOTE_API_PREFIX } = remoteConfig;

// 发送HTTP请求的工具函数
function httpRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ 
            statusCode: res.statusCode, 
            headers: res.headers, 
            data: parsedData 
          });
        } catch (error) {
          resolve({ 
            statusCode: res.statusCode, 
            headers: res.headers, 
            data: responseData, 
            parseError: error.message 
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// 测试函数
async function testRemoteAPI() {
  console.log('============================');
  console.log('开始测试远程MySQL数据库API连接');
  console.log('============================');
  
  try {
    // 1. 测试健康检查接口（如果有）
    console.log('\n1. 测试健康检查接口:');
    console.log('----------------------------');
    
    const healthOptions = {
      hostname: REMOTE_API_URL,
      port: REMOTE_API_PORT,
      path: '/',
      method: 'GET'
    };
    
    try {
      const healthResponse = await httpRequest(healthOptions);
      console.log('健康检查响应状态:', healthResponse.statusCode);
      console.log('响应内容:', JSON.stringify(healthResponse.data, null, 2));
    } catch (error) {
      console.log('健康检查失败，可能该端点不存在');
      console.log('错误详情:', error.message);
      console.log('注意：在应用中会自动降级到本地模式，使用本地模拟数据');
    }
    
    // 2. 测试登录接口
    console.log('\n2. 测试登录接口:');
    console.log('----------------------------');
    
    const loginOptions = {
      hostname: REMOTE_API_URL,
      port: REMOTE_API_PORT,
      path: `${REMOTE_API_PREFIX}/login`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    try {
      // 使用示例登录信息
      const loginData = {
        username: 'admin',
        password: 'admin123'
      };
      
      console.log('发送登录请求:', JSON.stringify(loginData));
      const loginResponse = await httpRequest(loginOptions, loginData);
      console.log('登录响应状态:', loginResponse.statusCode);
      console.log('响应内容:', JSON.stringify(loginResponse.data, null, 2));
      
      // 检查是否返回了token
      if (loginResponse.statusCode === 200 && loginResponse.data.token) {
        console.log('✓ 登录成功，获取到token');
      } else if (loginResponse.statusCode === 401) {
        console.log('⚠ 登录失败，用户名或密码错误（这可能是预期行为）');
        console.log('注意：在应用中会自动降级到本地模式，使用本地模拟数据');
      } else {
        console.log('⚠ 登录返回了非预期状态码');
        console.log('注意：在应用中会自动降级到本地模式，使用本地模拟数据');
      }
    } catch (error) {
      console.error('登录接口测试失败:', error.message);
      console.log('注意：在应用中会自动降级到本地模式，使用本地模拟数据');
    }
    
    // 3. 测试用户列表接口
    console.log('\n3. 测试用户列表接口:');
    console.log('----------------------------');
    
    const usersOptions = {
      hostname: REMOTE_API_URL,
      port: REMOTE_API_PORT,
      path: `${REMOTE_API_PREFIX}/users`,
      method: 'GET'
    };
    
    try {
      const usersResponse = await httpRequest(usersOptions);
      console.log('用户列表响应状态:', usersResponse.statusCode);
      
      // 检查响应是否为数组
      if (Array.isArray(usersResponse.data)) {
        console.log('✓ 获取到用户列表，共', usersResponse.data.length, '个用户');
        console.log('前2个用户样本:', JSON.stringify(usersResponse.data.slice(0, 2), null, 2));
      } else {
        console.log('响应内容:', JSON.stringify(usersResponse.data, null, 2));
      }
    } catch (error) {
      console.error('用户列表接口测试失败:', error.message);
      console.log('注意：在应用中会自动降级到本地模式，使用本地模拟数据');
    }
    
    // 4. 测试本地降级功能
    console.log('\n4. 测试本地降级功能:');
    console.log('----------------------------');
    
    try {
      // 检查本地模拟数据
      console.log('本地模拟用户数量:', mockUsers.length);
      console.log('本地默认管理员账户:');
      mockUsers.forEach(user => {
        if (user.is_admin) {
          console.log(`  - 用户名: ${user.username}, 密码: ${user.password}`);
        }
      });
    } catch (error) {
      console.error('本地降级功能测试失败:', error.message);
    }
    
    console.log('\n============================');
    console.log('远程MySQL数据库API连接测试完成');
    console.log('============================');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 运行测试
testRemoteAPI();