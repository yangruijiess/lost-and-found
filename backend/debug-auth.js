// 调试脚本：测试注册和登录流程

// 添加环境变量路径
process.env.PATH += ';D:\node.js';

// 简化的测试函数，不依赖axios
const http = require('http');

// 模拟注册请求
function registerTestUser() {
  const testUsername = 'testuser' + Date.now();
  const testStudentId = '2024' + Date.now();
  const testPassword = 'Test123456';
  
  console.log(`\n[调试] 准备注册测试用户: ${testUsername}`);
  
  const data = JSON.stringify({
    username: testUsername,
    studentId: testStudentId,
    email: testUsername + '@example.com',
    phone: '13800138002',
    password: testPassword
  });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };
  
  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log(`[调试] 注册响应状态码: ${res.statusCode}`);
      console.log(`[调试] 注册响应数据: ${responseData}`);
      
      if (res.statusCode === 201) {
        // 注册成功，尝试登录
        console.log(`\n[调试] 注册成功，尝试使用该账号登录...`);
        loginTestUser(testUsername, testPassword);
      } else {
        console.error(`[调试] 注册失败，状态码: ${res.statusCode}`);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`[调试] 注册请求错误: ${e.message}`);
  });
  
  req.write(data);
  req.end();
}

// 模拟登录请求
function loginTestUser(username, password) {
  const data = JSON.stringify({
    username: username,
    password: password,
    rememberMe: false
  });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };
  
  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log(`[调试] 登录响应状态码: ${res.statusCode}`);
      console.log(`[调试] 登录响应数据: ${responseData}`);
      
      if (res.statusCode === 200) {
        console.log(`\n[调试] ✅ 登录成功！`);
        console.log(`\n[调试] 后端功能正常，请检查前端表单提交的问题。`);
      } else {
        console.error(`\n[调试] ❌ 登录失败！请检查密码加密或用户存储逻辑。`);
      }
      
      // 最后获取所有用户列表进行检查
      fetchUsersList();
    });
  });
  
  req.on('error', (e) => {
    console.error(`[调试] 登录请求错误: ${e.message}`);
  });
  
  req.write(data);
  req.end();
}

// 获取用户列表
function fetchUsersList() {
  console.log(`\n[调试] 获取所有注册用户列表...`);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/users',
    method: 'GET'
  };
  
  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log(`[调试] 用户列表响应状态码: ${res.statusCode}`);
      console.log(`[调试] 用户列表: ${responseData}`);
      
      try {
        const users = JSON.parse(responseData);
        console.log(`\n[调试] 当前系统中共有 ${users.length} 个用户`);
        users.forEach(user => {
          console.log(`[调试] - 用户: ${user.username}, 学号: ${user.student_id}`);
        });
      } catch (e) {
        console.error(`[调试] 解析用户列表失败: ${e.message}`);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`[调试] 获取用户列表错误: ${e.message}`);
  });
  
  req.end();
}

// 运行测试
console.log('=== 开始验证注册和登录功能 ===');
registerTestUser();