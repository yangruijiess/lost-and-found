// 简单的HTTP服务器用于测试前端页面
const http = require('http');
const fs = require('fs');
const path = require('path');

// 服务器配置
const PORT = 8080;
const BASE_DIR = __dirname;

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
};

// 创建服务器
const server = http.createServer((req, res) => {
    // 记录请求路径
    console.log(`原始请求路径: ${req.url}`);
    
    // 处理CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    try {
            // 解码URL路径，确保正确处理中文字符
            // 先移除查询参数部分
            const urlWithoutQuery = req.url.split('?')[0];
            const decodedUrl = decodeURIComponent(urlWithoutQuery);
            console.log(`原始请求路径: ${req.url}`);
            console.log(`解码后请求路径: ${decodedUrl}`);
            
            // 解析请求URL
            let filePath = decodedUrl === '/' ? '/原型/index.html' : decodedUrl;
            
            // 构建完整的文件路径
            const fullPath = path.join(BASE_DIR, filePath);
            console.log(`文件路径: ${fullPath}`);
        
        // 防止目录遍历攻击
        if (!fullPath.startsWith(BASE_DIR)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }
        
        // 获取文件扩展名
        const extname = path.extname(filePath);
        
        // 设置MIME类型
        const contentType = mimeTypes[extname] || 'text/html';
        
        // 读取文件
        fs.readFile(fullPath, (error, content) => {
            if (error) {
                console.error(`读取文件错误: ${error.code}`);
                if (error.code === 'ENOENT') {
                    // 文件不存在
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('File not found');
                } else {
                    // 服务器错误
                    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('Internal Server Error');
                }
            } else {
                // 成功读取文件
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
    } catch (error) {
        console.error('处理请求时出错:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Internal Server Error');
    }
});

// 启动服务器
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`招领页面: http://localhost:${PORT}/原型/失物招领平台_招领页面.html`);
    console.log(`失物页面: http://localhost:${PORT}/原型/失物招领平台_失物页面.html`);
});

// 错误处理
server.on('error', (err) => {
    console.error('服务器错误:', err);
});