const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');
const favoritesController = require('../controllers/favoritesController');
const authMiddleware = require('../middlewares/auth'); // 可选的身份验证中间件

// 招领物品相关路由
router.get('/found-items', itemsController.getFoundItems);
router.post('/found-items', itemsController.createFoundItem);

// 失物物品相关路由
router.get('/lost-items', itemsController.getLostItems);
router.post('/lost-items', itemsController.createLostItem);

// 物品详情路由
router.get('/:itemType-items/:itemId', itemsController.getItemDetail);

// 图片获取路由
router.get('/images/:itemId', itemsController.getItemImages);

// 收藏相关路由
router.post('/favorites', favoritesController.toggleFavorite);
router.get('/favorites/check', favoritesController.checkFavorite);
router.get('/favorites', favoritesController.getUserFavorites);

module.exports = router;