const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const itemsRoutes = require('./routes/itemsRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const dotenv = require('dotenv');
const { testConnection, createDatabase } = require('./config/database');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 初始化数据库
async function initDatabase() {
  try {
    await testConnection();
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error.message);
  }
}

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

// 物品相关路由
app.use('/api', itemsRoutes);

// 验证相关路由
app.use('/api', verificationRoutes);

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

// 启动服务器并初始化数据库
async function startServer() {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('API端点:');
    console.log(`  - 健康检查: GET http://localhost:${PORT}`);
    console.log(`  - 用户登录: POST http://localhost:${PORT}/api/login`);
    console.log(`  - 用户注册: POST http://localhost:${PORT}/api/register`);
    console.log(`  - 获取招领物品列表: GET http://localhost:${PORT}/api/found-items`);
    console.log(`  - 获取失物物品列表: GET http://localhost:${PORT}/api/lost-items`);
    console.log(`  - 获取物品详情: GET http://localhost:${PORT}/api/:itemType-items/:itemId`);
    console.log(`  - 获取物品图片: GET http://localhost:${PORT}/api/images/:itemId`);
    console.log(`  - 收藏操作: POST http://localhost:${PORT}/api/favorites`);
    console.log(`  - 生成验证问题: POST http://localhost:${PORT}/api/generate-verification`);
    console.log(`  - 验证用户答案: POST http://localhost:${PORT}/api/verify-answer`);
    console.log('\n默认管理员账户:');
    console.log('  - 用户名: admin');
    console.log('  - 密码: admin123');
  });
}

// 启动服务器
startServer().catch(error => {
  console.error('服务器启动失败:', error.message);
});