const mysql = require('mysql2/promise');
require('dotenv').config();

async function createVerificationTable() {
  let connection;
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: '18.tcp.vip.cpolar.cn',
      port: 13376,
      user: 'newadmin',
      password: 'newpassword',
      database: 'lostfound'
    });

    console.log('已连接到数据库');

    // 创建verification_logs表的SQL语句
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS verification_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        item_id INT NOT NULL,
        item_type ENUM('found', 'lost') NOT NULL,
        user_answer TEXT NOT NULL,
        is_valid BOOLEAN NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_item (item_id, item_type),
        INDEX idx_created_at (created_at)
      );
    `;

    // 执行SQL语句
    await connection.query(createTableSQL);
    console.log('verification_logs表创建成功');

    // 插入一些示例数据
    const insertDataSQL = `
      INSERT INTO verification_logs (item_id, item_type, user_answer, is_valid)
      VALUES 
        (1, 'found', '黑色的皮质钱包，上面有LV标志', 1),
        (2, 'lost', '蓝色的书包', 0),
        (3, 'found', '银色的iPhone手机', 1);
    `;

    await connection.query(insertDataSQL);
    console.log('示例数据插入成功');

  } catch (error) {
    console.error('创建表失败:', error.message);
    console.error('错误详情:', error.code);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行函数
createVerificationTable();