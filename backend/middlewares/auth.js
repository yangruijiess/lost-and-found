const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

// JWT认证中间件
exports.authenticateJWT = (req, res, next) => {
  // 从请求头获取token
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  // Bearer token格式
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '认证令牌格式错误' });
  }

  try {
    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 将用户信息附加到请求对象
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token验证错误:', error);
    return res.status(403).json({ message: '无效的认证令牌' });
  }
};

// 管理员权限检查中间件
exports.requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
};