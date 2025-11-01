const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// 直接定义一个简单的模拟认证中间件函数
function authMiddleware(req, res, next) {
  // 简单的模拟认证，实际项目中应该使用真实的JWT验证
  const token = req.headers.authorization?.split(' ')[1];
  // 确保设置为有效的用户ID (1)，与测试数据匹配
  if (token || process.env.NODE_ENV === 'development') {
    req.user = { id: 1, username: 'user1' }; // 固定使用ID为1的用户，与测试数据匹配
    console.log('模拟认证: 用户ID = 1');
    next();
  } else {
    res.status(401).json({ message: '未授权' });
  }
}

// 获取对话列表 - 应用认证中间件
router.get('/conversations', authMiddleware, messageController.getConversations);

// 获取消息历史 - 应用认证中间件
router.get('/conversations/:conversationId/messages', authMiddleware, messageController.getMessages);

// 发送消息 - 应用认证中间件
router.post('/messages', authMiddleware, messageController.sendMessage);

// 创建新对话 - 应用认证中间件
router.post('/conversations', authMiddleware, messageController.createConversation);

module.exports = router;