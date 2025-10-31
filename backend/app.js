const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/authRoutes');
const itemsRoutes = require('./routes/itemsRoutes');
const dotenv = require('dotenv');
const { testConnection, createDatabase } = require('./config/database');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 使用真实的multer配置处理文件上传
// 配置在config/multerConfig.js中，在路由文件中导入使用

// 初始化数据库
async function initDatabase() {
  try {
    await testConnection();
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error.message);
  }
}

// 中间件配置 - 更宽松的CORS配置用于测试
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
  credentials: true,
  preflightContinue: true,
  optionsSuccessStatus: 200
}));

// 处理OPTIONS预检请求
app.options('*', cors());

// 解析请求体 - 增加对multipart/form-data的支持
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 添加详细的请求日志中间件
app.use((req, res, next) => {
  console.log('收到请求:', req.method, req.url);
  console.log('请求头:', JSON.stringify(req.headers, null, 2));
  console.log('Content-Type:', req.headers['content-type']);
  next();
});

// 提供静态文件访问，使上传的图片可以通过URL访问
app.use('/uploads', express.static(uploadDir));

// 提供原型目录的静态文件访问 - 修复版本
const prototypeDir = path.join(__dirname, '..', '原型');
console.log('=== 原型目录路径 ===:', prototypeDir);

// 立即检查目录和文件
fs.access(prototypeDir, fs.constants.F_OK, (err) => {
    if (err) {
        console.error('❌ 原型目录不存在:', err.message);
    } else {
        console.log('✅ 原型目录存在');
        // 直接测试simple-test.html文件是否存在
        const testFilePath = path.join(prototypeDir, 'simple-test.html');
        fs.access(testFilePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('❌ simple-test.html不存在:', err.message);
            } else {
                console.log('✅ simple-test.html文件存在');
            }
        });
    }
});

// 创建一个更通用的静态文件处理中间件，处理URL编码和查询参数问题
app.use((req, res, next) => {
    // 检查请求URL是否包含原型目录（编码或未编码）
    const decodedUrl = decodeURI(req.url);
    console.log('🔍 收到请求:', req.url, '(解码后:', decodedUrl, ')');
    
    if (decodedUrl.startsWith('/原型/')) {
        // 提取相对路径并移除查询参数
        let relativePath = decodedUrl.substring('/原型/'.length);
        // 移除URL查询参数部分
        const queryIndex = relativePath.indexOf('?');
        if (queryIndex !== -1) {
            relativePath = relativePath.substring(0, queryIndex);
            console.log('⚠️  移除查询参数，使用纯文件路径:', relativePath);
        }
        
        console.log('相对路径:', relativePath);
        
        // 构建完整文件路径
        const filePath = path.join(prototypeDir, relativePath);
        console.log('📁 完整文件路径:', filePath);
        
        // 检查文件是否存在
        if (fs.existsSync(filePath)) {
            console.log('✅ 文件存在，准备发送:', filePath);
            // 直接发送文件
            res.sendFile(filePath, (err) => {
                if (err) {
                    console.error('❌ 发送文件失败:', err.message);
                    res.status(500).json({ error: '发送文件失败', message: err.message });
                } else {
                    console.log('✅ 文件发送成功:', relativePath);
                }
            });
        } else {
            console.log('❌ 文件不存在:', filePath);
            res.status(404).json({ error: '文件不存在', path: filePath });
        }
    } else {
        // 不是原型目录的请求，继续处理
        next();
    }
});

console.log('🌐 原型目录文件服务已重新配置');

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
     console.log(`  - 健康检查: GET http://localhost:${PORT}`);
     console.log(`  - 用户登录: POST http://localhost:${PORT}/api/login`);
     console.log(`  - 用户注册: POST http://localhost:${PORT}/api/register`);
     console.log(`  - 获取招领物品列表: GET http://localhost:${PORT}/api/found-items`);
     console.log(`  - 获取失物物品列表: GET http://localhost:${PORT}/api/lost-items`);
     console.log(`  - 获取物品详情: GET http://localhost:${PORT}/api/:itemType-items/:itemId`);
     console.log(`  - 获取物品图片: GET http://localhost:${PORT}/api/images/:itemId`);
     console.log(`  - 收藏操作: POST http://localhost:${PORT}/api/favorites`);
    console.log('\n默认管理员账户:');
    console.log('  - 用户名: admin');
    console.log('  - 密码: admin123');
  });
}

// 启动服务器
startServer().catch(error => {
  console.error('服务器启动失败:', error.message);
});