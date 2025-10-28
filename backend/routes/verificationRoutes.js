const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');

/**
 * 3.10 生成验证问题接口
 * 路径: /api/generate-verification
 * 方法: POST
 * 功能: 根据招领页面的图片生成验证页面的问题和答案
 */
router.post('/generate-verification', verificationController.generateVerification);

/**
 * 验证用户答案接口
 * 路径: /api/verify-answer
 * 方法: POST
 * 功能: 验证用户提交的答案是否正确
 */
router.post('/verify-answer', verificationController.verifyAnswer);

module.exports = router;