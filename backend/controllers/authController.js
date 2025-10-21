const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');

// 模拟用户数据存储（实际项目中替换为数据库查询）
const mockUsers = [
  // 默认管理员账户
  {
    id: 1,
    username: 'admin',
    student_id: 'admin123',
    email: 'admin@shiwutong.com',
    phone: '13800138000',
    password: 'admin123', // 明文密码用于测试，实际生产环境应使用bcrypt加密
    is_admin: true
  },
  // 额外管理员账户
  {
    id: 2,
    username: 'administrator',
    student_id: 'admin001',
    email: 'administrator@shiwutong.com',
    phone: '13800138001',
    password: 'password', // 明文密码用于测试，实际生产环境应使用bcrypt加密
    is_admin: true
  }
];

// 登录控制器
exports.login = async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    // 只支持用户名登录
    const user = mockUsers.find(u => u.username === username);

    // 模拟密码验证（使用bcrypt验证哈希密码）
    // 对于演示环境，为了简化，我们也支持直接比较明文密码
    const passwordValid = user && 
      (await bcrypt.compare(password, user.password) || 
       (user.password === password && user.password.length < 20)); // 简单密码的特殊处理

    if (!user || !passwordValid) {
      return res.status(401).json({
        message: '用户名或密码错误'
      });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id, isAdmin: user.is_admin },
      JWT_SECRET,
      { expiresIn: rememberMe ? '7d' : JWT_EXPIRES_IN }
    );

    // 返回用户信息和令牌
    res.status(200).json({
      token,
      isAdmin: user.is_admin,
      user: {
        id: user.id,
        username: user.username,
        studentId: user.student_id,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      message: '服务器内部错误，请稍后再试'
    });
  }
};

// 注册控制器
exports.register = async (req, res) => {
  try {
    // 直接使用req.body，确保支持前端发送的字段名
    const { username, studentId, email, phone, password } = req.body;
    const errors = {};

    // 简化字段名称处理，确保studentId正确映射到student_id
    const student_id = studentId || req.body.student_id;

    // 模拟检查用户名是否已存在
    const existingUser = mockUsers.find(u => u.username === username);
    if (existingUser) {
      errors.username = '用户名已被使用';
    }

    // 模拟检查学号是否已存在
    const existingStudentId = mockUsers.find(u => u.student_id === student_id);
    if (existingStudentId) {
      errors.studentId = '学号已被注册';
    }

    // 模拟检查邮箱是否已存在
    const existingEmail = mockUsers.find(u => u.email === email);
    if (existingEmail) {
      errors.email = '邮箱已被注册';
    }

    // 模拟检查手机号是否已存在
    const existingPhone = mockUsers.find(u => u.phone === phone);
    if (existingPhone) {
      errors.phone = '手机号已被注册';
    }

    // 如果有错误，返回错误信息
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: '注册失败，请检查表单信息',
        errors
      });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const newUser = {
      id: mockUsers.length + 1,
      username: username,
      student_id: student_id,
      email: email,
      phone: phone,
      password: hashedPassword, // 重要：保存加密后的密码
      is_admin: false
    };

    // 将新用户添加到模拟数据中
    mockUsers.push(newUser);

    console.log('新用户注册:', newUser.username, 'ID:', newUser.id);
    console.log('密码已加密存储:', newUser.password); // 记录密码存储情况

    // 返回注册成功信息
    res.status(201).json({
      message: '注册成功',
      user: {
        id: newUser.id,
        username: newUser.username,
        studentId: newUser.student_id
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      message: '服务器内部错误，请稍后再试'
    });
  }
};

// 获取所有用户（仅用于调试）
exports.getAllUsers = (req, res) => {
  // 返回不带密码的用户信息
  const usersWithoutPassword = mockUsers.map(user => ({
    id: user.id,
    username: user.username,
    student_id: user.student_id,
    email: user.email,
    phone: user.phone,
    is_admin: user.is_admin
  }));
  
  res.status(200).json(usersWithoutPassword);
};

// 导出mockUsers以便测试
module.exports.mockUsers = mockUsers;