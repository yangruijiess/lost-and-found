const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 登录接口
router.post('/login', authController.login);

// 注册接口
router.post('/register', authController.register);

// 调试用：获取所有用户（实际项目中应添加权限控制）
router.get('/users', authController.getAllUsers);

module.exports = router;