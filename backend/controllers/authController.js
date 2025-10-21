const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');
const mysql = require('mysql2/promise');

// MySQL数据库连接配置
const DB_CONFIG = {
    host: '10.21.205.135',
    port: 3306,
    user: 'newadmin',
    password: 'newpassword',
    database: 'lostfound',
    connectTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// 创建数据库连接池
let pool = null;

// 测试数据库连接的函数
async function testDatabaseConnection() {
    try {
        pool = mysql.createPool(DB_CONFIG);
        console.log('数据库连接池已创建');
        
        // 测试连接
        const connection = await pool.getConnection();
        console.log('数据库连接测试成功');
        connection.release();
        return true;
    } catch (error) {
        console.error('数据库连接失败:', error.message);
        console.error('错误代码:', error.code);
        pool = null;
        return false;
    }
}

// 初始化时测试连接
(async () => {
    await testDatabaseConnection();
})();

// 仅使用数据库验证，不再使用本地模拟数据

// 数据库操作函数

// 通用数据库操作包装函数，添加重试逻辑
async function withDatabaseRetry(operation, maxRetries = 2) {
    let retries = 0;
    
    while (retries <= maxRetries) {
        try {
            // 如果连接池未初始化，尝试重新初始化
            if (!pool) {
                console.log('尝试重新初始化数据库连接池...');
                await testDatabaseConnection();
                
                // 如果仍然没有连接池，直接返回失败
                if (!pool) {
                    return { success: false, error: '数据库连接池初始化失败' };
                }
            }
            
            // 执行数据库操作
            const result = await operation();
            return { success: true, result };
        } catch (error) {
            retries++;
            console.error(`数据库操作失败 (重试 ${retries}/${maxRetries}):`, error.message);
            
            // 如果达到最大重试次数，返回失败
            if (retries > maxRetries) {
                // 如果是连接超时或连接断开，重置连接池
                if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
                    console.log('连接已断开，重置连接池');
                    pool = null;
                }
                return { success: false, error: error.message };
            }
            
            // 重试前等待一段时间
            await new Promise(resolve => setTimeout(resolve, 500 * retries));
        }
    }
}

// 数据库登录函数
async function dbLogin(username, password) {
    const result = await withDatabaseRetry(async () => {
        const connection = await pool.getConnection();
        try {
            // 查询用户
            const [rows] = await connection.query(
                'SELECT id, username, password, student_id, email, phone FROM users WHERE username = ?',
                [username]
            );
            
            if (rows.length === 0) {
                return null; // 用户不存在
            }
            
            const user = rows[0];
            
            // 验证密码
            let passwordValid = false;
            try {
                passwordValid = await bcrypt.compare(password, user.password);
            } catch (e) {
                // 密码解密失败，可能是明文密码
                console.log('密码验证失败，尝试明文匹配');
            }
            
            // 如果哈希比较失败，尝试明文比较（仅用于测试）
            if (!passwordValid) {
                passwordValid = (user.password === password && user.password.length < 20);
            }
            
            if (passwordValid) {
                return {
                    id: user.id,
                    username: user.username,
                    student_id: user.student_id,
                    email: user.email,
                    phone: user.phone
                };
            }
            
            return null; // 密码错误
        } finally {
            connection.release();
        }
    });
    
    if (!result.success) {
        console.log('数据库登录失败:', result.error);
        return null;
    }
    
    return result.result;
}

// 数据库注册函数
async function dbRegister(username, password, studentId, email, phone) {
    const userData = { username, password, studentId, email, phone };
    const result = await withDatabaseRetry(async () => {
        const connection = await pool.getConnection();
        try {
            // 开始事务
            await connection.beginTransaction();
            
            // 检查用户名是否已存在
            const [usernameCheck] = await connection.query(
                'SELECT id FROM users WHERE username = ?',
                [userData.username]
            );
            
            if (usernameCheck.length > 0) {
                await connection.rollback();
                throw new Error('用户名已被使用');
            }
            
            // 检查学号是否已存在
            const [studentIdCheck] = await connection.query(
                'SELECT id FROM users WHERE student_id = ?',
                [userData.studentId]
            );
            
            if (studentIdCheck.length > 0) {
                await connection.rollback();
                throw new Error('学号已被注册');
            }
            
            // 密码加密
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            
            // 插入新用户
            const [insertResult] = await connection.query(
                `INSERT INTO users (username, student_id, email, phone, password)
                 VALUES (?, ?, ?, ?, ?)`,
                [userData.username, userData.studentId, userData.email, userData.phone, hashedPassword]
            );
            
            // 提交事务
            await connection.commit();
            
            return {
                id: insertResult.insertId,
                username: userData.username,
                student_id: userData.studentId,
                email: userData.email,
                phone: userData.phone
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    });
    
    if (!result.success) {
        console.log('数据库注册失败:', result.error);
        return { success: false, error: { general: result.error } };
    }
    
    return { success: true, user: result.result };
}

// 获取所有用户
async function dbGetUsers() {
    const result = await withDatabaseRetry(async () => {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                'SELECT id, username, student_id, email, phone FROM users'
            );
            return rows;
        } finally {
            connection.release();
        }
    });
    
    if (!result.success) {
        console.log('数据库获取用户列表失败:', result.error);
        return null;
    }
    
    return result.result;
}

// 仅使用数据库验证，不再使用本地验证函数

// 登录控制器
exports.login = async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;
    
    console.log('登录请求处理:', { username });
    
    // 首先尝试使用数据库登录
    let user = await dbLogin(username, password);
    // 数据库登录失败，直接返回错误，不再使用本地验证
    if (!user) {
      console.log('用户名或密码错误');
      return res.status(401).json({
        message: '用户名或密码错误'
      });
    }
    
    const message = '登录成功（数据库模式）';
    
    if (user) {
      // 生成JWT令牌
      const token = jwt.sign(
        { 
          id: user.id,
          isAdmin: user.is_admin || false
        },
        JWT_SECRET,
        { expiresIn: rememberMe ? '7d' : JWT_EXPIRES_IN }
      );
      
      // 返回成功响应
      res.status(200).json({
        token,
        isAdmin: user.is_admin || false,
        user: {
          id: user.id,
          username: user.username,
          studentId: user.student_id,
          email: user.email,
          phone: user.phone
        },
        message: message
      });
    } else {
      // 登录失败
      res.status(401).json({
        message: '用户名或密码错误'
      });
    }
  } catch (error) {
    console.error('登录过程中的错误:', error);
    res.status(500).json({
      message: '登录服务暂时不可用，请稍后重试',
      error: error.message
    });
  }
};

// 注册控制器
exports.register = async (req, res) => {
  try {
    const { username, password, studentId, email, phone } = req.body;
    
    console.log('注册请求处理:', { username, studentId });
    
    // 首先尝试使用数据库注册
    let registrationResult = await dbRegister(username, password, studentId, email, phone);

    
    // 数据库注册失败，直接返回错误，不再使用本地注册
    if (!registrationResult.success) {
      console.log('注册失败:', registrationResult.error);
      return res.status(400).json({
        message: '注册失败',
        error: registrationResult.error
      });
    }
    
    // 数据库注册成功
    res.status(201).json({
      message: message,
      user: registrationResult.user
    });
  } catch (error) {
    console.error('注册过程中的错误:', error);
    res.status(500).json({
      message: '注册服务暂时不可用，请稍后重试',
      error: error.message
    });
  }
};

// 获取所有用户控制器（仅管理员）
exports.getAllUsers = async (req, res) => {
  try {
    // 检查权限
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        message: '没有权限访问此资源'
      });
    }
    
    console.log('获取用户列表请求处理');
    
    // 首先尝试从数据库获取用户
    let users = await dbGetUsers();

    
    // 数据库获取失败，直接返回错误，不再使用本地数据
    if (!users || users.length === 0) {
      console.log('未找到用户数据');
      return res.status(404).json({
        message: '未找到用户数据'
      });
    }
    
    const message = '获取用户列表成功（数据库模式）';
    
    // 格式化用户数据
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      studentId: user.student_id,
      email: user.email,
      phone: user.phone,
      isAdmin: user.is_admin || false
    }));
    
    res.status(200).json({
      users: formattedUsers,
      message: message
    });
  } catch (error) {
    console.error('获取用户列表过程中的错误:', error);
    res.status(500).json({
      message: '获取用户列表服务暂时不可用，请稍后重试',
      error: error.message
    });
  }
};

// 导出配置和数据供测试使用
module.exports.pool = pool;
module.exports.DB_CONFIG = DB_CONFIG;
module.exports.JWT_SECRET = JWT_SECRET;
module.exports.JWT_EXPIRES_IN = JWT_EXPIRES_IN;
