const mysql = require('mysql2/promise');
require('dotenv').config();

// 创建数据库连接池
const pool = mysql.createPool({
  host: '10.12.54.148',
  port: 3306,
  user: 'newadmin',
  password: 'newpassword',
  database: 'lostfound',
  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0,
  connectTimeout: 30000,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// 测试数据库连接（带重试机制）
async function testConnection(maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    let connection;
    try {
      console.log(`尝试连接数据库 (${retries + 1}/${maxRetries})...`);
      
      // 使用连接池获取连接
      connection = await pool.getConnection();
      
      // 执行简单查询测试连接
      await connection.query('SELECT 1');
      console.log('数据库连接成功');
      connection.release();
      return true;
    } catch (error) {
      retries++;
      console.error(`数据库连接失败 (尝试 ${retries}/${maxRetries}):`, error.message);
      console.error('错误详情:', error.code, error.errno);
      
      if (connection) connection.release();
      
      // 如果是超时错误且还有重试机会，等待一段时间后重试
      if (error.code === 'ETIMEDOUT' && retries < maxRetries) {
        const waitTime = retries * 2000; // 递增等待时间
        console.log(`等待 ${waitTime}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (retries >= maxRetries) {
        console.error('达到最大重试次数，连接失败');
        return false;
      }
    }
  }
  return false;
}

// 创建数据库和表结构
async function createDatabase() {
  console.log('跳过数据库创建，直接尝试使用现有数据库');
  return false;
}

module.exports = {
  pool,
  testConnection,
  createDatabase
};