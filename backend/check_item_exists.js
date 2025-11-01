const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkItemExists() {
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

    // 检查found_items表中是否存在ID为1的物品
    const [foundItems] = await connection.query(
      'SELECT * FROM found_items WHERE id = ?',
      [1]
    );

    console.log('招领物品表(found_items)中ID为1的物品:');
    if (foundItems.length > 0) {
      console.log(JSON.stringify(foundItems[0], null, 2));
    } else {
      console.log('不存在');
    }

    // 也检查一下lost_items表
    const [lostItems] = await connection.query(
      'SELECT * FROM lost_items WHERE id = ?',
      [1]
    );

    console.log('\n失物物品表(lost_items)中ID为1的物品:');
    if (lostItems.length > 0) {
      console.log(JSON.stringify(lostItems[0], null, 2));
    } else {
      console.log('不存在');
    }

    // 检查一下有哪些表存在
    const [tables] = await connection.query(
      "SHOW TABLES"
    );
    console.log('\n数据库中的表:');
    tables.forEach(row => {
      console.log(Object.values(row)[0]);
    });

  } catch (error) {
    console.error('查询失败:', error.message);
    console.error('错误详情:', error.code);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 执行函数
checkItemExists();