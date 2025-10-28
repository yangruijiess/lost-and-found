const { pool } = require('../config/database');

// 收藏/取消收藏物品
exports.toggleFavorite = async (req, res) => {
  try {
    const { itemId, type, action } = req.body;
    const userId = req.user?.id || 1; // 默认用户ID，实际应该从JWT中获取

    // 验证参数
    if (!itemId || !type || !action) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
        errorCode: 'MISSING_PARAMS'
      });
    }

    if (!['lost', 'found'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的物品类型',
        errorCode: 'INVALID_TYPE'
      });
    }

    if (!['favorite', 'unfavorite'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: '无效的操作类型',
        errorCode: 'INVALID_ACTION'
      });
    }

    // 验证物品是否存在
    const tableName = type === 'lost' ? 'lost_items' : 'found_items';
    const [items] = await pool.query(`SELECT id FROM ${tableName} WHERE id = ?`, [itemId]);
    
    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: '物品不存在',
        errorCode: 'ITEM_NOT_FOUND'
      });
    }

    if (action === 'favorite') {
      // 添加收藏
      try {
        await pool.query(
          'INSERT INTO favorites (user_id, item_id, item_type) VALUES (?, ?, ?)',
          [userId, itemId, type]
        );
        
        res.json({
          success: true,
          message: '收藏成功'
        });
      } catch (error) {
        // 处理唯一键冲突，说明已经收藏过
        if (error.code === 'ER_DUP_ENTRY') {
          return res.json({
            success: true,
            message: '已经收藏过该物品'
          });
        }
        throw error;
      }
    } else {
      // 取消收藏
      const [result] = await pool.query(
        'DELETE FROM favorites WHERE user_id = ? AND item_id = ? AND item_type = ?',
        [userId, itemId, type]
      );

      if (result.affectedRows === 0) {
        return res.json({
          success: true,
          message: '未收藏该物品'
        });
      }

      res.json({
        success: true,
        message: '取消收藏成功'
      });
    }
  } catch (error) {
    console.error('收藏操作失败:', error.message);
    res.status(500).json({
      success: false,
      message: '操作失败，请稍后重试',
      errorCode: 'SERVER_ERROR'
    });
  }
};

// 检查是否已收藏
exports.checkFavorite = async (req, res) => {
  try {
    const { itemId, type } = req.query;
    const userId = req.user?.id || 1; // 默认用户ID

    if (!itemId || !type) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
        errorCode: 'MISSING_PARAMS'
      });
    }

    if (!['lost', 'found'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的物品类型',
        errorCode: 'INVALID_TYPE'
      });
    }

    const [favorites] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? AND item_id = ? AND item_type = ?',
      [userId, itemId, type]
    );

    res.json({
      success: true,
      data: {
        isFavorite: favorites.length > 0
      }
    });
  } catch (error) {
    console.error('检查收藏状态失败:', error.message);
    res.status(500).json({
      success: false,
      message: '检查失败，请稍后重试',
      errorCode: 'SERVER_ERROR'
    });
  }
};

// 获取用户收藏列表
exports.getUserFavorites = async (req, res) => {
  try {
    const userId = req.user?.id || 1; // 默认用户ID
    const { page = 1, limit = 6, type } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['user_id = ?'];
    let params = [userId];

    if (type && ['lost', 'found'].includes(type)) {
      conditions.push('item_type = ?');
      params.push(type);
    }

    // 查询收藏记录
    const [favorites] = await pool.query(
      `SELECT * FROM favorites WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // 查询总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM favorites WHERE ${conditions.join(' AND ')}`,
      params
    );

    // 获取收藏物品的详细信息
    const itemDetails = await Promise.all(
      favorites.map(async (favorite) => {
        const tableName = favorite.item_type === 'lost' ? 'lost_items' : 'found_items';
        const [items] = await pool.query(`SELECT * FROM ${tableName} WHERE id = ?`, [favorite.item_id]);
        return items[0] ? { ...items[0], item_type: favorite.item_type } : null;
      })
    );

    // 过滤掉不存在的物品
    const validItems = itemDetails.filter(item => item !== null);

    res.json({
      success: true,
      data: {
        items: validItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取收藏列表失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取收藏列表失败，请稍后重试',
      errorCode: 'SERVER_ERROR'
    });
  }
};