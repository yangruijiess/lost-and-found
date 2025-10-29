// 测试服务器响应
const http = require('http');

// 测试招领页面
function testFoundPage() {
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: '/原型/失物招领平台_招领页面.html',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log('招领页面响应状态:', res.statusCode);
        console.log('响应头:', res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('响应体长度:', data.length);
            // 只打印前200个字符
            console.log('响应体前200字符:', data.substring(0, 200));
        });
    });

    req.on('error', (error) => {
        console.error('招领页面请求失败:', error.message);
    });

    req.end();
}

// 检查文件是否存在
const fs = require('fs');
const path = require('path');

function checkFileExists() {
    const foundFilePath = path.join(__dirname, '原型', '失物招领平台_招领页面.html');
    const lostFilePath = path.join(__dirname, '原型', '失物招领平台_失物页面.html');
    
    console.log('检查文件是否存在:');
    console.log('招领页面路径:', foundFilePath);
    console.log('招领页面存在:', fs.existsSync(foundFilePath));
    console.log('失物页面路径:', lostFilePath);
    console.log('失物页面存在:', fs.existsSync(lostFilePath));
}

// 先检查文件，再测试服务器
checkFileExists();
setTimeout(testFoundPage, 1000);