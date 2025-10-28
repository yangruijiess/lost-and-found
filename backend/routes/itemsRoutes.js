const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');
const favoritesController = require('../controllers/favoritesController');
const authMiddleware = require('../middlewares/auth'); // 可选的身份验证中间件
const upload = require('../config/multerConfig');

// 招领物品相关路由
router.get('/found-items', itemsController.getFoundItems);
router.post('/found-items', upload.single('image'), function(req, res, next) {
  console.log('收到招领物品发布请求，检查请求体:', req.body);
  console.log('File:', req.file);
  next();
}, itemsController.createFoundItem);

// 失物物品相关路由
router.get('/lost-items', itemsController.getLostItems);
router.post('/lost-items', upload.single('image'), function(req, res, next) {
  console.log('收到失物物品发布请求，检查请求体:', req.body);
  console.log('File:', req.file);
  next();
}, itemsController.createLostItem);

// 物品详情路由
router.get('/:itemType-items/:itemId', itemsController.getItemDetail);

// 图片获取路由
router.get('/images/:itemId', itemsController.getItemImages);

// 收藏相关路由
router.post('/favorites', favoritesController.toggleFavorite);
router.get('/favorites/check', favoritesController.checkFavorite);
router.get('/favorites', favoritesController.getUserFavorites);

module.exports = router;