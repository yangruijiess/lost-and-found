const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors({
  origin: '*', // 生产环境中应该设置具体的前端域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析请求体
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 健康检查路由
app.get('/', (req, res) => {
  res.json({
    message: '失物招领平台API服务运行正常',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 认证相关路由
app.use('/api', authRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    message: '请求的资源不存在'
  });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  res.status(500).json({
    message: '服务器内部错误，请稍后再试'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('API端点:');
  console.log('  - 健康检查: GET http://localhost:${PORT}');
  console.log('  - 用户登录: POST http://localhost:${PORT}/api/login');
  console.log('  - 用户注册: POST http://localhost:${PORT}/api/register');
  console.log('  - 获取用户列表(调试): GET http://localhost:${PORT}/api/users');
  console.log('\n默认管理员账户:');
  console.log('  - 用户名: admin');
  console.log('  - 密码: admin123');
});