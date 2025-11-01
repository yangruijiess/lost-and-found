-- 创建验证日志表
CREATE TABLE IF NOT EXISTS verification_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    item_type ENUM('found', 'lost') NOT NULL,
    user_answer TEXT NOT NULL,
    is_valid BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 可以添加用户ID字段，如果需要记录是哪个用户进行的验证
    -- user_id INT,
    -- FOREIGN KEY (user_id) REFERENCES users(id),
    
    INDEX idx_item (item_id, item_type),
    INDEX idx_created_at (created_at)
);

-- 插入示例数据（可选）
INSERT INTO verification_logs (item_id, item_type, user_answer, is_valid)
VALUES 
    (1, 'found', '黑色的皮质钱包，上面有LV标志', 1),
    (2, 'lost', '蓝色的书包', 0),
    (3, 'found', '银色的iPhone手机', 1);