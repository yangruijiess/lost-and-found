const axios = require('axios');

// 测试登录接口
async function testLogin() {
  try {
    console.log('测试登录接口...');
    const response = await axios.post('http://localhost:3000/api/login', {
      username: 'admin',
      password: 'admin123',
      rememberMe: false
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('登录成功:', response.data);
    return true;
  } catch (error) {
    console.error('登录错误:', error.response ? error.response.data : error.message);
    return false;
  }
}

// 测试注册接口
async function testRegister() {
  try {
    console.log('\n测试注册接口...');
    const testUsername = 'testuser' + Date.now();
    const response = await axios.post('http://localhost:3000/api/register', {
      username: testUsername,
      studentId: '2024' + Date.now(),
      email: testUsername + '@example.com',
      phone: '13800138001',
      password: 'Test123456'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('注册成功:', response.data);
    return true;
  } catch (error) {
    console.error('注册错误:', error.response ? error.response.data : error.message);
    return false;
  }
}

// 运行测试
async function runTests() {
  console.log('开始测试API...');
  
  const loginSuccess = await testLogin();
  const registerSuccess = await testRegister();
  
  console.log('\n测试结果:');
  console.log('- 登录接口:', loginSuccess ? '✅ 成功' : '❌ 失败');
  console.log('- 注册接口:', registerSuccess ? '✅ 成功' : '❌ 失败');
}

runTests();