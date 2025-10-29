// 调试脚本：分析前端上传问题

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('./config/database');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置上传存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.floor(Math.random() * 1000000000) + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 模拟前端上传请求，捕获并记录详细错误
app.post('/debug-upload', upload.single('image'), async (req, res) => {
  console.log('===== 调试上传请求开始 =====');
  console.log('请求体:', req.body);
  console.log('文件信息:', req.file);
  
  try {
    // 模拟数据库操作，但不实际保存
    console.log('模拟数据库插入操作');
    
    // 返回一个格式良好的JSON响应
    const responseData = {
      success: true,
      data: {
        itemId: 123
      },
      message: '招领信息发布成功'
    };
    
    console.log('准备返回响应:', responseData);
    
    // 添加延迟以模拟网络延迟
    setTimeout(() => {
      res.status(201).json(responseData);
      console.log('===== 调试上传请求完成 =====');
    }, 100);
    
  } catch (error) {
    console.error('调试请求处理错误:', error);
    res.status(500).json({
      success: false,
      message: '测试错误',
      errorDetails: error.message
    });
  }
});

// 创建一个简单的HTML页面用于测试
app.get('/test-form', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>上传测试</title>
    </head>
    <body>
      <h1>上传调试表单</h1>
      <form id="testForm">
        <input type="text" name="title" placeholder="标题" required><br>
        <input type="text" name="category" placeholder="分类" required><br>
        <textarea name="description" placeholder="描述" required></textarea><br>
        <input type="text" name="location" placeholder="地点" required><br>
        <input type="datetime-local" name="time" required><br>
        <input type="file" name="image" accept="image/*"><br>
        <button type="submit">提交测试</button>
      </form>
      <div id="result"></div>
      
      <script>
        document.getElementById('testForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const resultDiv = document.getElementById('result');
          resultDiv.innerHTML = '开始上传...';
          
          try {
            const formData = new FormData(e.target);
            console.log('表单数据准备完成');
            
            // 记录发送前的准备信息
            console.log('准备发送请求到: http://localhost:3001/debug-upload');
            
            const response = await fetch('http://localhost:3001/debug-upload', {
              method: 'POST',
              body: formData,
              credentials: 'include',
              mode: 'cors'
            });
            
            console.log('响应状态:', response.status);
            console.log('响应类型:', response.type);
            console.log('响应头部:', Object.fromEntries(response.headers.entries()));
            
            // 尝试以不同方式读取响应
            try {
              const textResponse = await response.text();
              console.log('响应文本内容:', textResponse);
              
              resultDiv.innerHTML += '<br>响应状态: ' + response.status;
              resultDiv.innerHTML += '<br>响应文本: ' + textResponse;
              
              // 尝试手动解析JSON
              try {
                const jsonResponse = JSON.parse(textResponse);
                console.log('JSON解析成功:', jsonResponse);
                resultDiv.innerHTML += '<br>JSON解析成功';
              } catch (jsonError) {
                console.error('JSON解析错误:', jsonError);
                resultDiv.innerHTML += '<br>JSON解析错误: ' + jsonError.message;
                resultDiv.innerHTML += '<br>注意：即使JSON解析失败，上传可能仍成功';
              }
            } catch (readError) {
              console.error('读取响应错误:', readError);
              resultDiv.innerHTML += '<br>读取响应错误: ' + readError.message;
            }
            
          } catch (error) {
            console.error('上传过程错误:', error);
            resultDiv.innerHTML += '<br>上传过程错误: ' + error.message;
          }
        });
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// 启动调试服务器
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`调试服务器运行在 http://localhost:${PORT}`);
  console.log(`测试表单地址: http://localhost:${PORT}/test-form`);
  console.log('请访问测试表单并提交，查看控制台日志以分析问题');
});