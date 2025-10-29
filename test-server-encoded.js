// 测试服务器响应 - 使用URL编码
const http = require('http');

// 测试招领页面
function testFoundPage() {
    // 正确编码URL路径中的中文字符
    const encodedPath = '/%E5%8E%9F%E5%9E%8B/%E5%A4%B1%E7%89%A9%E6%8B%9B%E9%A2%86%E5%B9%B3%E5%8F%B0_%E6%8B%9B%E9%A2%86%E9%A1%B5%E9%9D%A2.html';
    
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: encodedPath,
        method: 'GET'
    };

    console.log('请求招领页面:', encodedPath);
    const req = http.request(options, (res) => {
        console.log('招领页面响应状态:', res.statusCode);
        console.log('响应头:', res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('响应体长度:', data.length);
            console.log('页面加载成功!');
        });
    });

    req.on('error', (error) => {
        console.error('招领页面请求失败:', error.message);
    });

    req.end();
}

// 测试失物页面
function testLostPage() {
    const encodedPath = '/%E5%8E%9F%E5%9E%8B/%E5%A4%B1%E7%89%A9%E6%8B%9B%E9%A2%86%E5%B9%B3%E5%8F%B0_%E5%A4%B1%E7%89%A9%E9%A1%B5%E9%9D%A2.html';
    
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: encodedPath,
        method: 'GET'
    };

    console.log('请求失物页面:', encodedPath);
    const req = http.request(options, (res) => {
        console.log('失物页面响应状态:', res.statusCode);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('响应体长度:', data.length);
            console.log('页面加载成功!');
        });
    });

    req.on('error', (error) => {
        console.error('失物页面请求失败:', error.message);
    });

    req.end();
}

// 执行测试
testFoundPage();
setTimeout(testLostPage, 1000);