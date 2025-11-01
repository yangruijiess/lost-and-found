const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

/**
 * AI相关路由
 * 用于处理物品描述关键词提取、答案验证等AI功能
 */

// 从物品描述中提取关键词
// GET /api/ai/keywords/:itemType/:itemId
router.get('/keywords/:itemType/:itemId', aiController.extractKeywords);

// 验证用户答案
// POST /api/ai/validate/:itemType/:itemId
router.post('/validate/:itemType/:itemId', aiController.validateAnswer);

// 生成验证问题
// GET /api/ai/questions/:itemType/:itemId
router.get('/questions/:itemType/:itemId', aiController.generateQuestions);

module.exports = router;