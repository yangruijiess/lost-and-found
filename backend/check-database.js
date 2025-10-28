const { pool } = require('./config/database');

async function checkDatabaseStructure() {
  try {
    console.log('开始检查数据库结构...');
    
    // 分别检查表是否存在
    const tableNames = ['found_items', 'lost_items', 'favorites', 'users'];
    const existingTables = [];
    
    for (const table of tableNames) {
      const [result] = await pool.query(`SHOW TABLES LIKE '${table}'`);
      if (result.length > 0) {
        existingTables.push(table);
      }
    }
    
    console.log('\n存在的表:');
    existingTables.forEach(table => {
      console.log('-', table);
    });
    
    // 创建tables数组格式以匹配后续检查
    let tables = existingTables.map(table => ({ [`Tables_in_lostfound`]: table }));
    
    // 检查found_items表结构
    if (tables.some(table => Object.values(table)[0] === 'found_items')) {
      console.log('\nfound_items表结构:');
      const [columns] = await pool.query('DESCRIBE found_items');
      columns.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''} ${col.Key} ${col.Default || ''}`);
      });
    }
    
    // 检查lost_items表结构
    if (tables.some(table => Object.values(table)[0] === 'lost_items')) {
      console.log('\nlost_items表结构:');
      const [columns] = await pool.query('DESCRIBE lost_items');
      columns.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''} ${col.Key} ${col.Default || ''}`);
      });
    }
    
    // 检查favorites表结构
    if (tables.some(table => Object.values(table)[0] === 'favorites')) {
      console.log('\nfavorites表结构:');
      const [columns] = await pool.query('DESCRIBE favorites');
      columns.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''} ${col.Key} ${col.Default || ''}`);
      });
    }
    
    // 检查users表结构
    if (tables.some(table => Object.values(table)[0] === 'users')) {
      console.log('\nusers表结构:');
      const [columns] = await pool.query('DESCRIBE users');
      columns.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''} ${col.Key} ${col.Default || ''}`);
      });
    }
    
    // 检查表之间的外键关系
    console.log('\n外键关系:');
    const [foreignKeys] = await pool.query(
      `SELECT table_name, column_name, referenced_table_name, referenced_column_name 
       FROM information_schema.key_column_usage 
       WHERE referenced_table_name IS NOT NULL 
       AND table_schema = 'lostfound'`
    );
    
    if (foreignKeys.length > 0) {
      foreignKeys.forEach(fk => {
        console.log(`- ${fk.table_name}.${fk.column_name} -> ${fk.referenced_table_name}.${fk.referenced_column_name}`);
      });
    } else {
      console.log('- 未找到外键关系');
    }
    
    // 检查示例数据（如果有）
    console.log('\n检查数据样本:');
    const [foundSample] = await pool.query('SELECT id, title, status FROM found_items LIMIT 3');
    const [lostSample] = await pool.query('SELECT id, title, status FROM lost_items LIMIT 3');
    
    console.log('found_items样本:', foundSample);
    console.log('lost_items样本:', lostSample);
    
  } catch (error) {
    console.error('检查数据库结构时出错:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabaseStructure();