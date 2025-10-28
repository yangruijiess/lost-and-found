const { pool } = require('../config/database');

// 获取招领物品列表
exports.getFoundItems = async (req, res) => {
  try {
    const { page = 1, limit = 6, category, timeRange, location, search } = req.query;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let conditions = [];
    let params = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (timeRange) {
      const now = new Date();
      let startTime;
      switch (timeRange) {
        case 'day':
          startTime = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          startTime = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startTime = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          break;
      }
      if (startTime) {
        conditions.push('found_time >= ?');
        params.push(startTime);
      }
    }

    if (location) {
      conditions.push('location LIKE ?');
      params.push(`%${location}%`);
    }

    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // 添加状态筛选，只显示已审核通过的物品
    conditions.push('status = ?');
    params.push('approved');

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // 查询物品列表
    const [items] = await pool.query(
      `SELECT * FROM found_items ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // 查询总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM found_items ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取招领物品列表失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取招领物品列表失败',
      errorCode: 'SERVER_ERROR'
    });
  }
};

// 获取失物物品列表
exports.getLostItems = async (req, res) => {
  try {
    const { page = 1, limit = 6, category, timeRange, location, search } = req.query;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let conditions = [];
    let params = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (timeRange) {
      const now = new Date();
      let startTime;
      switch (timeRange) {
        case 'day':
          startTime = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          startTime = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startTime = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          break;
      }
      if (startTime) {
        conditions.push('lost_time >= ?');
        params.push(startTime);
      }
    }

    if (location) {
      conditions.push('location LIKE ?');
      params.push(`%${location}%`);
    }

    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // 添加状态筛选，只显示已审核通过的物品
    conditions.push('status = ?');
    params.push('approved');

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // 查询物品列表
    const [items] = await pool.query(
      `SELECT * FROM lost_items ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // 查询总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM lost_items ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取失物物品列表失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取失物物品列表失败',
      errorCode: 'SERVER_ERROR'
    });
  }
};

// 创建招领物品
exports.createFoundItem = async (req, res) => {
  console.log('开始处理招领物品创建请求');
  console.log('请求体内容:', req.body);
  console.log('req.file状态:', req.file);
  
  try {
    // 提取表单数据 - 适配数据库实际字段结构
    const { title, category, description, location, time, contactName, contactPhone, contactEmail } = req.body;
    console.log('提取的表单数据:', { title, category, description, location, time, contactName, contactPhone, contactEmail });

    // 验证必填字段 - 提供更具体的缺失字段信息
    const missingFields = [];
    if (!title) missingFields.push('标题');
    if (!category) missingFields.push('分类');
    if (!description) missingFields.push('描述');
    if (!location) missingFields.push('地点');
    if (!time) missingFields.push('发现时间');
    
    if (missingFields.length > 0) {
      const errorMsg = `请填写以下必填字段: ${missingFields.join('、')}`;
      console.warn('必填字段缺失:', errorMsg);
      return res.status(400).json({
        success: false,
        message: errorMsg,
        errorCode: 'MISSING_FIELDS',
        missingFields: missingFields
      });
    }

    // 获取用户ID，使用可选链避免潜在错误
    const userId = req.user?.id || 1; // 如果未登录，使用默认用户
    console.log('用户ID:', userId);

    // 处理图片上传 - 明确记录无图片情况
    let imageUrl = null;
    if (req.file) {
      // 使用multer保存的文件路径
      imageUrl = '/uploads/' + req.file.filename;
      console.log('图片上传成功，保存路径:', imageUrl);
    } else {
      console.log('没有上传图片');
    }

    // 创建物品记录 - 适配数据库实际字段结构
    console.log('准备执行数据库插入操作');
    const query = `INSERT INTO found_items 
       (title, description, category, location, found_time, image_url, publisher_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    // 将联系方式添加到描述中，因为数据库没有单独的联系字段
    let enhancedDescription = description;
    if (contactName || contactPhone || contactEmail) {
      enhancedDescription += `\n\n联系方式：`;
      if (contactName) enhancedDescription += `联系人: ${contactName} `;
      if (contactPhone) enhancedDescription += `电话: ${contactPhone} `;
      if (contactEmail) enhancedDescription += `邮箱: ${contactEmail}`;
    }
    
    const values = [title, enhancedDescription, category, location, new Date(time), imageUrl, userId, 'approved'];
    
    console.log('SQL参数:', values);
    
    const [result] = await pool.query(query, values);
    console.log('数据库插入成功，返回结果:', result);

    console.log('招领信息发布成功，返回itemId:', result.insertId);
    res.status(201).json({
      success: true,
      data: {
        itemId: result.insertId
      },
      message: '招领信息发布成功'
    });
  } catch (error) {
    console.error('创建招领物品失败:', error.message);
    console.error('错误详情:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: '发布失败，请稍后重试',
      errorCode: 'SERVER_ERROR',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 创建失物物品
exports.createLostItem = async (req, res) => {
  console.log('开始处理失物物品创建请求');
  console.log('请求体内容:', req.body);
  console.log('req.file状态:', req.file);
  
  try {
    // 提取表单数据 - 适配数据库实际字段结构
    const { title, category, description, location, time, contactName, contactPhone, contactEmail } = req.body;
    console.log('提取的表单数据:', { title, category, description, location, time, contactName, contactPhone, contactEmail });

    // 验证必填字段 - 提供更具体的缺失字段信息
    const missingFields = [];
    if (!title) missingFields.push('标题');
    if (!category) missingFields.push('分类');
    if (!description) missingFields.push('描述');
    if (!location) missingFields.push('地点');
    if (!time) missingFields.push('丢失时间');
    
    if (missingFields.length > 0) {
      const errorMsg = `请填写以下必填字段: ${missingFields.join('、')}`;
      console.warn('必填字段缺失:', errorMsg);
      return res.status(400).json({
        success: false,
        message: errorMsg,
        errorCode: 'MISSING_FIELDS',
        missingFields: missingFields
      });
    }

    // 获取用户ID，使用可选链避免潜在错误
    const userId = req.user?.id || 1; // 如果未登录，使用默认用户
    console.log('用户ID:', userId);

    // 处理图片上传 - 明确记录无图片情况
    let imageUrl = null;
    if (req.file) {
      // 使用multer保存的文件路径
      imageUrl = '/uploads/' + req.file.filename;
      console.log('图片上传成功，保存路径:', imageUrl);
    } else {
      console.log('没有上传图片');
    }

    // 创建物品记录 - 适配数据库实际字段结构
    console.log('准备执行数据库插入操作');
    const query = `INSERT INTO lost_items 
       (title, description, category, location, lost_time, image_url, publisher_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    // 将联系方式添加到描述中，因为数据库没有单独的联系字段
    let enhancedDescription = description;
    if (contactName || contactPhone || contactEmail) {
      enhancedDescription += `\n\n联系方式：`;
      if (contactName) enhancedDescription += `联系人: ${contactName} `;
      if (contactPhone) enhancedDescription += `电话: ${contactPhone} `;
      if (contactEmail) enhancedDescription += `邮箱: ${contactEmail}`;
    }
    
    const values = [title, enhancedDescription, category, location, new Date(time), imageUrl, userId, 'approved'];
    
    console.log('SQL参数:', values);
    
    const [result] = await pool.query(query, values);
    console.log('数据库插入成功，返回结果:', result);

    console.log('失物信息发布成功，返回itemId:', result.insertId);
    res.status(201).json({
      success: true,
      data: {
        itemId: result.insertId
      },
      message: '失物信息发布成功'
    });
  } catch (error) {
    console.error('创建失物物品失败:', error.message);
    console.error('错误详情:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: '发布失败，请稍后重试',
      errorCode: 'SERVER_ERROR',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取物品详情
exports.getItemDetail = async (req, res) => {
  try {
    const { itemType, itemId } = req.params;

    // 验证物品类型
    if (!['lost', 'found'].includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: '无效的物品类型',
        errorCode: 'INVALID_ITEM_TYPE'
      });
    }

    const tableName = itemType === 'lost' ? 'lost_items' : 'found_items';

    // 查询物品详情
    const [items] = await pool.query(
      `SELECT i.*, u.username, u.student_id 
       FROM ${tableName} i 
       LEFT JOIN users u ON i.publisher_id = u.id 
       WHERE i.id = ?`,
      [itemId]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: '物品不存在',
        errorCode: 'ITEM_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: items[0]
    });
  } catch (error) {
    console.error('获取物品详情失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取物品详情失败',
      errorCode: 'SERVER_ERROR'
    });
  }
};

// 获取物品图片
exports.getItemImages = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { type } = req.query;

    if (!['lost', 'found'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的物品类型',
        errorCode: 'INVALID_ITEM_TYPE'
      });
    }

    const tableName = type === 'lost' ? 'lost_items' : 'found_items';

    const [items] = await pool.query(
      `SELECT image_url FROM ${tableName} WHERE id = ?`,
      [itemId]
    );

    if (items.length === 0 || !items[0].image_url) {
      // 返回默认占位图
      return res.status(404).json({
        success: false,
        message: '图片不存在',
        errorCode: 'IMAGE_NOT_FOUND'
      });
    }

    // 实际应用中应该重定向到图片URL或直接返回图片文件
    res.json({
      success: true,
      data: {
        imageUrl: items[0].image_url
      }
    });
  } catch (error) {
    console.error('获取物品图片失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取图片失败',
      errorCode: 'SERVER_ERROR'
    });
  }
};