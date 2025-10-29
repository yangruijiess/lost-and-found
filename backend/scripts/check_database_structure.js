// 查询数据库表结构脚本
const mysql = require('mysql2/promise');

async function checkDatabaseStructure() {
  // 直接使用外部数据库配置
  const dbConfig = {
    host: '10.21.205.135',
    port: 3306,
    user: 'newadmin',
    password: 'newpassword',
    database: 'lostfound'
  };
  let connection;
  try {
    // 直接创建数据库连接
    connection = await mysql.createConnection(dbConfig);
    console.log('成功连接到数据库:', dbConfig.database);
    
    // 查询数据库中的所有表
    const [tables] = await connection.execute(
      "SHOW TABLES"
    );
    
    console.log('\n数据库中的表:');
    const tableNames = [];
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      tableNames.push(tableName);
      console.log(`- ${tableName}`);
    }
    
    // 查询每个表的结构
    for (const tableName of tableNames) {
      console.log(`\n表 ${tableName} 的结构:`);
      const [columns] = await connection.execute(
        `DESCRIBE ${tableName}`
      );
      
      console.log('字段名          类型              允许空  键     默认值  额外信息');
      console.log('---------------- ----------------- ------ ------ ------ --------------------');
      
      for (const column of columns) {
        console.log(
          `${column.Field.padEnd(16)} ${column.Type.padEnd(17)} ` +
          `${column.Null.padEnd(6)} ${column.Key.padEnd(6)} ` +
          `${(column.Default || '').toString().padEnd(6)} ${column.Extra}`
        );
      }
      
      // 查询表中的记录数
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) AS count FROM ${tableName}`
      );
      console.log(`\n记录数: ${countResult[0].count}`);
      
      // 如果记录数少于10条，显示前几条记录作为示例
      if (countResult[0].count > 0 && countResult[0].count <= 10) {
        console.log('\n前几条记录示例:');
        const [sampleRows] = await connection.execute(
          `SELECT * FROM ${tableName} LIMIT 3`
        );
        console.log(JSON.stringify(sampleRows, null, 2));
      }
    }
    
  } catch (error) {
    console.error('查询数据库结构失败:', error.message);
    console.error('错误详情:', error.code, error.errno);
  } finally {
    if (connection) {
      connection.release();
      console.log('\n数据库连接已释放');
    }
  }
}

// 执行查询
checkDatabaseStructure();