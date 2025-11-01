// 临时脚本用于查询found_items表内容
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

async function queryFoundItems() {
    let connection;
    try {
        // 创建数据库连接 - 使用硬编码的正确参数
        connection = await mysql.createConnection({
            host: '18.tcp.vip.cpolar.cn',
            port: 13376,
            user: 'newadmin',
            password: 'newpassword',
            database: 'lostfound',
            connectTimeout: 30000
        });

        console.log('成功连接到数据库');

        // 查询found_items表
        const [rows, fields] = await connection.execute('SELECT * FROM found_items');
        
        console.log('\nfound_items表内容:');
        console.log(JSON.stringify(rows, null, 2));
        
        // 显示记录总数
        console.log(`\n总计 ${rows.length} 条记录`);

    } catch (error) {
        console.error('查询过程中发生错误:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n数据库连接已关闭');
        }
    }
}

// 执行查询
queryFoundItems();