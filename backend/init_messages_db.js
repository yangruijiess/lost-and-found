const mysql = require('mysql2/promise');

// 使用正确的数据库配置
const config = {
  host: '18.tcp.vip.cpolar.cn',
  port: 13376,
  user: 'newadmin',
  password: 'newpassword',
  database: 'lostfound',
  connectTimeout: 30000
};

async function initMessagesDatabase() {
  let connection;
  try {
    // 建立数据库连接
    connection = await mysql.createConnection(config);
    console.log('数据库连接成功');
    
    // 分开执行SQL语句
    // 创建对话表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS conversations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user1_id INT NOT NULL,
          user2_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_conversation (user1_id, user2_id),
          INDEX idx_user1 (user1_id),
          INDEX idx_user2 (user2_id)
      );
    `);
    console.log('✅ conversations表创建成功');
    
    // 创建消息表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          conversation_id INT NOT NULL,
          sender_id INT NOT NULL,
          receiver_id INT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_conversation (conversation_id),
          INDEX idx_sender (sender_id),
          INDEX idx_receiver (receiver_id)
      );
    `);
    console.log('✅ messages表创建成功');
    
    // 创建消息阅读状态表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS message_read_status (
          message_id INT NOT NULL,
          user_id INT NOT NULL,
          read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (message_id, user_id),
          INDEX idx_message (message_id),
          INDEX idx_user (user_id)
      );
    `);
    console.log('✅ message_read_status表创建成功');
    
    // 创建测试用户（如果不存在）- 不包含role字段
    await connection.query(`
      INSERT IGNORE INTO users (username, password, email) VALUES 
      ('user1', 'password1', 'user1@example.com'),
      ('user2', 'password2', 'user2@example.com'),
      ('user3', 'password3', 'user3@example.com');
    `);
    console.log('✅ 测试用户创建成功');
    console.log('✅ 私信功能数据库表创建成功');
    
    // 创建测试对话
    await connection.query(`
      INSERT IGNORE INTO conversations (user1_id, user2_id) VALUES 
      (1, 2),
      (1, 3);
    `);
    console.log('✅ 测试对话创建成功');
    
    // 创建测试消息
    await connection.query(`
      INSERT INTO messages (conversation_id, sender_id, receiver_id, content) VALUES
      (1, 1, 2, '你好，我想了解一下你发布的失物信息'),
      (1, 2, 1, '好的，请问你想了解什么信息？'),
      (2, 1, 3, '嗨，我找到了你的钱包'),
      (2, 3, 1, '真的吗？太感谢了！');
    `);
    console.log('✅ 测试消息创建成功');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行初始化
initMessagesDatabase();