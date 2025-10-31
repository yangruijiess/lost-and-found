-- 创建对话表
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    last_message TEXT,
    last_message_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_users (user1_id, user2_id),
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建消息表
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建消息已读状态表（用于跟踪每个用户的消息已读状态）
CREATE TABLE IF NOT EXISTS message_read_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_message_user (message_id, user_id)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- 插入一些测试数据
INSERT INTO conversations (user1_id, user2_id, last_message, last_message_time) VALUES 
(1, 2, '太好了！我大约半小时后可以到图书馆，我们在二楼大厅见面可以吗？', NOW()),
(1, 3, '我找到了您丢失的蓝色书包', NOW() - INTERVAL 1 DAY),
(1, 4, '谢谢您，我已经收到了失物，非常感谢您的帮助！', NOW() - INTERVAL 2 DAY);

-- 插入测试消息数据
INSERT INTO messages (conversation_id, sender_id, receiver_id, content) VALUES 
(1, 2, 1, '您好，我在平台上看到您发布的黑色钱包招领信息，我想确认一下是不是我的'),
(1, 1, 2, '您好，我确实捡到了一个黑色钱包，请问您能描述一下钱包的具体特征吗？比如品牌、里面有什么物品等'),
(1, 2, 1, '钱包是Coach品牌的，黑色皮质，里面有我的身份证（姓名：李明）、一张工商银行信用卡、一张饭卡和200元现金'),
(1, 1, 2, '描述基本符合，请问您什么时候方便来认领？我现在在图书馆二楼自习室'),
(1, 2, 1, '太好了！我大约半小时后可以到图书馆，我们在二楼大厅见面可以吗？'),
(2, 1, 3, '您好，请问您发布的是蓝色书包的招领信息吗？'),
(2, 3, 1, '是的，我在教学楼A栋捡到了一个蓝色书包'),
(2, 3, 1, '我找到了您丢失的蓝色书包'),
(3, 1, 4, '非常感谢您捡到了我的笔记本电脑！'),
(3, 4, 1, '不客气，很高兴能帮到您！'),
(3, 1, 4, '谢谢您，我已经收到了失物，非常感谢您的帮助！');