const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/authRoutes');
const itemsRoutes = require('./routes/itemsRoutes');
const messageRoutes = require('./routes/messageRoutes');
const aiRoutes = require('./routes/aiRoutes');
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
    // 确保导入bcrypt用于密码哈希
    const bcrypt = require('bcrypt');
    // 获取数据库连接对象
    const db = require('./config/database');
    
    await testConnection();
    console.log('数据库连接测试成功');
    
    // 初始化数据库表
    try {
      // 使用正确的数据库连接对象
      const connection = await db.getConnection();
      try {
        // 创建用户表
        await connection.query(`
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            phone VARCHAR(20),
            avatar VARCHAR(255),
            role ENUM('user', 'admin') DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          );
        `);
        
        // 创建物品表
        await connection.query(`
          CREATE TABLE IF NOT EXISTS items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            category VARCHAR(50) NOT NULL,
            status ENUM('lost', 'found', 'returned') NOT NULL,
            location VARCHAR(255) NOT NULL,
            contact_info VARCHAR(255) NOT NULL,
            image_urls TEXT,
            user_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
          );
        `);
        
        // 创建评论表
        await connection.query(`
          CREATE TABLE IF NOT EXISTS comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            item_id INT NOT NULL,
            user_id INT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );
        `);
        
        // 创建对话表
        await connection.query(`
          CREATE TABLE IF NOT EXISTS conversations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user1_id INT NOT NULL,
            user2_id INT NOT NULL,
            last_message TEXT,
            last_message_time DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_users (user1_id, user2_id),
            FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
          );
        `);
        
        // 创建消息表
        await connection.query(`
          CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            conversation_id INT NOT NULL,
            sender_id INT NOT NULL,
            receiver_id INT NOT NULL,
            content TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
          );
        `);
        
        // 创建消息已读状态表
        await connection.query(`
          CREATE TABLE IF NOT EXISTS message_read_status (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message_id INT NOT NULL,
            user_id INT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            read_at DATETIME,
            FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_message_user (message_id, user_id)
          );
        `);
        
        // 创建索引以提高查询性能
        await connection.query('CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id)');
        await connection.query('CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id)');
        await connection.query('CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)');
        await connection.query('CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)');
        await connection.query('CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)');
        await connection.query('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)');
        
        // 创建默认管理员账户（如果不存在）
        const [existingAdmin] = await connection.query(
          'SELECT id FROM users WHERE username = ?',
          ['admin']
        );
        
        if (existingAdmin.length === 0) {
          await connection.query(
            'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
            ['admin', bcrypt.hashSync('admin123', 10), 'admin@example.com', 'admin']
          );
          console.log('默认管理员账户已创建: 用户名: admin, 密码: admin123');
        }
        
        // 创建一些测试用户（如果不存在）
        const testUsers = [
          { username: 'user1', password: 'password1', email: 'user1@example.com' },
          { username: '李明', password: 'password1', email: 'liming@example.com' },
          { username: '王芳', password: 'password1', email: 'wangfang@example.com' },
          { username: '张伟', password: 'password1', email: 'zhangwei@example.com' }
        ];
        
        for (const user of testUsers) {
          const [existing] = await connection.query('SELECT id FROM users WHERE username = ?', [user.username]);
          if (existing.length === 0) {
            await connection.query(
              'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
              [user.username, bcrypt.hashSync(user.password, 10), user.email]
            );
            console.log(`测试用户已创建: ${user.username}`);
          }
        }
        
        console.log('数据库初始化完成，包括私信功能相关表');
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('数据库表初始化失败:', error);
      // 继续运行，不因为数据库初始化失败而停止服务
    }
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

// 消息相关路由
app.use('/api', messageRoutes);

// AI相关路由
app.use('/api/ai', aiRoutes);

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
     console.log(`  - 提取物品关键词: GET http://localhost:${PORT}/api/ai/keywords/:itemType/:itemId`);
     console.log(`  - 验证答案: POST http://localhost:${PORT}/api/ai/validate/:itemType/:itemId`);
     console.log(`  - 生成验证问题: GET http://localhost:${PORT}/api/ai/questions/:itemType/:itemId`);
    console.log('\n默认管理员账户:');
    console.log('  - 用户名: admin');
    console.log('  - 密码: admin123');
  });
}

// 启动服务器
startServer().catch(error => {
  console.error('服务器启动失败:', error.message);
});