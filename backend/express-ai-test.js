// 简化的Express测试脚本，用于定位AI路由的未授权问题
const express = require('express');
const cors = require('cors');
const aiService = require('./services/aiService');
const app = express();
const PORT = 3001;

// 使用宽松的CORS配置
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: '*'
}));

// 解析请求体
app.use(express.json());

// 添加详细的请求日志中间件
app.use((req, res, next) => {
  console.log('收到请求:', req.method, req.url);
  console.log('请求头:', req.headers);
  next();
});

// 简单的关键词提取路由
app.get('/api/ai/keywords/found/1', async (req, res) => {
  try {
    console.log('处理关键词提取请求...');
    const testDescription = '黑色皮质钱包，内有身份证和银行卡，在图书馆三楼遗失';
    const keywords = await aiService.extractKeywords(testDescription);
    
    console.log('关键词提取成功:', keywords);
    res.json({
      success: true,
      data: {
        keywords
      },
      message: '关键词提取成功'
    });
  } catch (error) {
    console.error('关键词提取失败:', error.message);
    // 避免循环引用，只返回必要的错误信息
    res.status(500).json({
      success: false,
      message: error.message,
      errorType: error.name,
      errorCode: error.code
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`测试服务器运行在 http://localhost:${PORT}`);
  console.log(`测试端点: GET http://localhost:${PORT}/api/ai/keywords/found/1`);
});