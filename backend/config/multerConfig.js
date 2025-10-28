const multer = require('multer');
const path = require('path');

// 配置存储引擎
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/'); // 上传文件保存的目录
  },
  filename: (req, file, cb) => {
    // 使用时间戳和原始文件名，避免文件覆盖
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤，只允许上传图片
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件！'));
  }
};

// 配置multer实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
  },
  fileFilter: fileFilter
});

module.exports = upload;