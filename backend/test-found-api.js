// 测试API接口 - 使用Node.js内置http模块
const http = require('http');

function testFoundItemsAPI() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/found-items',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('招领物品API响应状态:', res.statusCode);
            try {
                const responseData = JSON.parse(data);
                console.log('招领物品数据数量:', responseData.items ? responseData.items.length : '无数据');
                console.log('完整响应数据:', JSON.stringify(responseData, null, 2));
            } catch (e) {
                console.error('解析响应数据失败:', e.message);
                console.error('原始响应数据:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('API调用失败:', error.message);
    });

    req.end();
}

testFoundItemsAPI();