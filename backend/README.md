# 失物招领平台后端API

## 项目介绍
这是失物招领平台的后端API服务，提供用户认证、授权和数据管理功能。

## 技术栈
- Node.js
- Express.js
- JSON Web Token (JWT)
- bcrypt (密码加密)
- dotenv (环境变量管理)

## 快速开始

### 前置条件
- Node.js 14.x 或更高版本
- npm 6.x 或更高版本

### 安装步骤

1. 克隆仓库（如果适用）
```bash
git clone [仓库地址]
cd 仓库目录/backend
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建并编辑 `.env` 文件（可以复制 `.env.example` 作为模板）
```bash
# JWT配置
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# 服务器配置
PORT=3000
```

### 启动服务

开发环境启动：
```bash
npm run dev
```

生产环境启动：
```bash
npm start
```

## API端点

- **健康检查**: `GET http://localhost:3000`
- **用户登录**: `POST http://localhost:3000/api/login`
- **用户注册**: `POST http://localhost:3000/api/register`
- **获取用户列表(调试)**: `GET http://localhost:3000/api/users`

## 默认管理员账户
- **用户名**: admin
- **密码**: admin123
- **额外管理员**: administrator/password

## 项目结构
```
backend/
├── app.js              # 主入口文件
├── config/             # 配置文件目录
│   └── jwt.js          # JWT配置
├── controllers/        # 控制器目录
│   └── authController.js # 认证相关控制器
├── middlewares/        # 中间件目录
│   └── auth.js         # 认证中间件
├── routes/             # 路由目录
│   └── authRoutes.js   # 认证相关路由
├── .env                # 环境变量文件
├── .env.example        # 环境变量示例文件
├── package.json        # 项目配置和依赖
└── README.md           # 项目说明文档
```

## 注意事项

1. 本项目使用模拟用户数据进行演示，实际生产环境应连接到真实数据库。
2. 当前使用明文密码仅用于测试目的，生产环境必须使用bcrypt等加密算法存储密码。
3. 生产环境部署时，应修改JWT_SECRET为强随机字符串，并配置适当的CORS源。
4. 项目路径引用均使用相对路径，确保在不同环境中都能正常工作。

## 故障排除

1. 如果遇到权限错误，确保你有权限访问项目目录和Node.js缓存目录。
2. 确保环境变量配置正确，特别是JWT_SECRET和PORT设置。
3. 检查端口是否被其他应用占用，如果是，可以修改.env文件中的PORT配置。

## 许可证
[MIT](https://choosealicense.com/licenses/mit/)