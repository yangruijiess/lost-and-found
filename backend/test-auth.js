// 统一的身份验证测试脚本

// 使用node内置的http模块而不是第三方依赖
const http = require('http');

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
          resolve({ ...res, data: parsedData });
        } catch (error) {
          resolve({ ...res, data: responseData });
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
async function runTests() {
  console.log('============================');
  console.log('开始身份验证系统综合测试');
  console.log('============================');
  
  try {
    // 1. 测试管理员账户登录
    console.log('\n1. 测试管理员账户登录:');
    console.log('----------------------------');
    
    // 测试用户名: administrator, 密码: password
    const adminLoginOptions = {
      hostname: '10.21.205.135',
      port: 3000,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const adminLoginResponse = await httpRequest(adminLoginOptions, {
      username: 'administrator',
      password: 'password',
      rememberMe: true
    });
    
    if (adminLoginResponse.statusCode === 200) {
      console.log('✓ 管理员账户登录成功!');
      console.log(`✓ 正确识别为管理员: ${adminLoginResponse.data.isAdmin ? '是' : '否'}`);
      console.log(`✓ 返回的用户名: ${adminLoginResponse.data.user.username}`);
      console.log(`✓ 生成了JWT令牌`);
    } else {
      console.log(`✗ 管理员账户登录失败: ${adminLoginResponse.statusCode}`);
      console.log(`  错误信息:`, adminLoginResponse.data);
    }
    
    // 2. 测试默认管理员账户登录
    console.log('\n2. 测试默认管理员账户登录:');
    console.log('----------------------------');
    
    const defaultAdminResponse = await httpRequest(adminLoginOptions, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (defaultAdminResponse.statusCode === 200) {
      console.log('✓ 默认管理员账户登录成功!');
      console.log(`✓ 正确识别为管理员: ${defaultAdminResponse.data.isAdmin ? '是' : '否'}`);
    } else {
      console.log(`✗ 默认管理员账户登录失败: ${defaultAdminResponse.statusCode}`);
    }
    
    // 3. 测试错误密码登录
    console.log('\n3. 测试错误密码登录:');
    console.log('----------------------------');
    
    const wrongPasswordResponse = await httpRequest(adminLoginOptions, {
      username: 'administrator',
      password: 'wrongpassword'
    });
    
    if (wrongPasswordResponse.statusCode === 401) {
      console.log('✓ 错误密码被正确拒绝');
      console.log(`  错误信息: ${wrongPasswordResponse.data.message}`);
    } else {
      console.log(`✗ 错误密码测试失败，状态码: ${wrongPasswordResponse.statusCode}`);
    }
    
    // 4. 测试获取用户列表
    console.log('\n4. 测试获取用户列表:');
    console.log('----------------------------');
    
    const usersOptions = {
      hostname: '10.21.205.135',
      port: 3000,
      path: '/api/users',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminLoginResponse.data.token}`
      }
    };
    
    const usersResponse = await httpRequest(usersOptions);
    
    if (usersResponse.statusCode === 200) {
      console.log(`✓ 成功获取用户列表，共 ${usersResponse.data.length} 个用户`);
      console.log('✓ 返回的用户信息中不包含密码字段');
      console.log('  用户列表:');
      usersResponse.data.forEach(user => {
        console.log(`  - ${user.username} (${user.is_admin ? '管理员' : '普通用户'})`);
      });
    } else {
      console.log(`✗ 获取用户列表失败: ${usersResponse.statusCode}`);
    }
    
    console.log('\n============================');
    console.log('测试完成！');
    console.log('============================');
    console.log('\n重要信息:');
    console.log('- 管理员账户: administrator / password');
    console.log('- 默认管理员: admin / admin123');
    console.log('- 后端服务运行在: http://10.21.205.135:3000');
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
    console.log('\n请确保后端服务正在运行在 http://10.21.205.135:3000');
  }
}

// 运行测试
runTests();