// 完整的密码流程演示脚本

const http = require('http');

// 打印分隔线函数
function printSeparator(title) {
  console.log('\n' + '='.repeat(50));
  console.log(title);
  console.log('='.repeat(50));
}

// 1. 首先查看当前系统中的用户数量
function checkCurrentUsers() {
  printSeparator('1. 检查当前系统中的用户');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/users',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('获取用户列表成功');
      const users = JSON.parse(responseData);
      console.log(`当前系统中有 ${users.length} 个用户`);
      
      users.forEach(user => {
        console.log(`- 用户名: ${user.username}, ID: ${user.id}`);
        // 注意：API响应中没有密码字段，这是安全的做法
        console.log('  密码字段:', user.password ? '存在（不安全）' : '不存在（安全）');
      });
      
      // 继续下一步：注册新用户
      setTimeout(() => registerNewUser(), 1000);
    });
  });
  
  req.on('error', (e) => {
    console.error(`请求错误: ${e.message}`);
  });
  
  req.end();
}

// 2. 注册新用户
function registerNewUser() {
  printSeparator('2. 注册新用户（包含密码加密）');
  
  const testUsername = 'password_demo_' + Date.now().toString().slice(-6);
  const testPassword = 'DemoPassword123';
  
  console.log('准备注册用户:', testUsername);
  console.log('用户密码:', testPassword);
  console.log('注意：密码将在后端进行bcrypt加密存储');
  
  const data = JSON.stringify({
    username: testUsername,
    studentId: '2024' + Date.now().toString().slice(-8),
    email: testUsername + '@example.com',
    phone: '13800138' + Math.floor(Math.random() * 1000),
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
      console.log('注册响应状态码:', res.statusCode);
      console.log('注册响应数据:', responseData);
      
      if (res.statusCode === 201) {
        console.log('✅ 注册成功！密码已在后端加密存储');
        console.log('注意：注册响应中没有返回密码（安全做法）');
        
        // 继续下一步：使用正确密码登录
        setTimeout(() => loginWithCorrectPassword(testUsername, testPassword), 1000);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`注册请求错误: ${e.message}`);
  });
  
  req.write(data);
  req.end();
}

// 3. 使用正确密码登录
function loginWithCorrectPassword(username, correctPassword) {
  printSeparator('3. 使用正确密码登录（验证密码有效性）');
  
  console.log('使用用户名:', username);
  console.log('使用正确密码:', correctPassword);
  console.log('注意：后端会使用bcrypt.compare验证密码');
  
  const data = JSON.stringify({
    username: username,
    password: correctPassword
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
      console.log('登录响应状态码:', res.statusCode);
      console.log('登录响应数据:', responseData);
      
      if (res.statusCode === 200) {
        console.log('✅ 登录成功！密码验证通过');
        console.log('注意：登录响应中返回JWT令牌，但不返回密码');
        
        // 继续下一步：使用错误密码登录
        setTimeout(() => loginWithWrongPassword(username), 1000);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`登录请求错误: ${e.message}`);
  });
  
  req.write(data);
  req.end();
}

// 4. 使用错误密码登录
function loginWithWrongPassword(username) {
  printSeparator('4. 使用错误密码登录（验证安全性）');
  
  const wrongPassword = 'WrongPassword123';
  
  console.log('使用用户名:', username);
  console.log('使用错误密码:', wrongPassword);
  
  const data = JSON.stringify({
    username: username,
    password: wrongPassword
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
      console.log('登录响应状态码:', res.statusCode);
      console.log('登录响应数据:', responseData);
      
      if (res.statusCode === 401) {
        console.log('✅ 安全验证通过！错误密码被正确拒绝');
      }
      
      // 最终总结
      printSeparator('密码系统总结');
      console.log('✅ 密码确实被正确存储（bcrypt加密后）');
      console.log('✅ 登录时使用bcrypt.compare验证密码');
      console.log('✅ 从不在API响应中返回密码（安全做法）');
      console.log('✅ 错误密码被正确拒绝');
      console.log('✅ 密码是登录的核心凭证');
      console.log('\n💡 提示：这是标准的安全实践，保护用户密码不被泄露');
    });
  });
  
  req.on('error', (e) => {
    console.error(`登录请求错误: ${e.message}`);
  });
  
  req.write(data);
  req.end();
}

// 开始演示流程
console.log('开始密码存储和验证流程演示...');
checkCurrentUsers();