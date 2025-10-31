const { pool } = require('../config/database');
console.log('messageController: 使用共享数据库连接池');

// 通用数据库操作包装函数
async function withDatabaseRetry(operation, maxRetries = 2) {
    let retries = 0;
    
    while (retries <= maxRetries) {
        try {
            const result = await operation();
            return { success: true, result };
        } catch (error) {
            retries++;
            console.error(`数据库操作失败 (重试 ${retries}/${maxRetries}):`, error.message);
            
            if (retries > maxRetries) {
                console.error('达到最大重试次数，操作失败:', error.code);
                return { success: false, error: error.message };
            }
            
            await new Promise(resolve => setTimeout(resolve, 500 * retries));
        }
    }
}

// 获取用户的所有对话列表
async function getConversations(userId) {
    const result = await withDatabaseRetry(async () => {
        const connection = await pool.getConnection();
        try {
            // 查询用户参与的所有对话及其最新消息
            const [conversations] = await connection.query(
                `SELECT 
                    c.id,
                    CASE 
                        WHEN c.user1_id = ? THEN (SELECT username FROM users WHERE id = c.user2_id) 
                        ELSE (SELECT username FROM users WHERE id = c.user1_id) 
                    END as otherUsername,
                    CASE 
                        WHEN c.user1_id = ? THEN (SELECT id FROM users WHERE id = c.user2_id) 
                        ELSE (SELECT id FROM users WHERE id = c.user1_id) 
                    END as otherUserId,
                    (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as lastMessage,
                    (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as lastMessageTime,
                    (SELECT COUNT(*) FROM messages m 
                     LEFT JOIN message_read_status rs ON m.id = rs.message_id AND rs.user_id = ?
                     WHERE m.conversation_id = c.id AND m.sender_id != ? AND rs.message_id IS NULL) as unreadCount
                FROM conversations c
                WHERE c.user1_id = ? OR c.user2_id = ?
                ORDER BY lastMessageTime DESC`,
                [userId, userId, userId, userId, userId, userId]
            );
            return conversations;
        } finally {
            connection.release();
        }
    });
    
    if (!result.success) {
        console.log('获取对话列表失败:', result.error);
        return [];
    }
    
    return result.result;
}

// 获取对话的消息历史
async function getConversationMessages(conversationId, userId) {
  console.log(`获取对话消息: conversationId=${conversationId}, userId=${userId}`);
  
  // 验证conversationId是否有效
  if (!conversationId || isNaN(conversationId)) {
    console.log('无效的对话ID');
    return [];
  }
  
  try {
    const connection = await pool.getConnection();
    try {
      // 验证用户是否有权限访问此对话
      console.log(`检查对话权限: conversationId=${conversationId}, userId=${userId}`);
      const [conversation] = await connection.query(
        'SELECT id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
        [conversationId, userId, userId]
      );
      
      console.log(`对话查询结果:`, conversation);
      if (conversation.length === 0) {
        console.log(`用户${userId}无权访问对话${conversationId}或对话不存在`);
        return [];
      }
            
      // 标记消息为已读（通过message_read_status表）
      await connection.query(
        'INSERT IGNORE INTO message_read_status (message_id, user_id) SELECT m.id, ? FROM messages m WHERE m.conversation_id = ? AND m.sender_id != ? AND NOT EXISTS (SELECT 1 FROM message_read_status WHERE message_id = m.id AND user_id = ?)',
        [userId, conversationId, userId, userId]
      );
      
      // 查询消息，同时检查已读状态
        const [messages] = await connection.query(
          `SELECT m.*, CASE WHEN rs.message_id IS NULL THEN 0 ELSE 1 END as \`read\` FROM messages m LEFT JOIN message_read_status rs ON m.id = rs.message_id AND rs.user_id = ? WHERE m.conversation_id = ? ORDER BY m.created_at ASC`,
          [userId, conversationId]
        );
      
      console.log(`成功获取对话消息: 共${messages.length}条`);
      return messages;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(`获取对话消息失败:`, error);
    return [];
  }
}

// 发送消息
async function sendMessage(senderId, receiverId, content) {
    // 确保senderId和receiverId不同
    if (senderId === receiverId) {
        throw new Error('不能给自己发送消息');
    }
    
    const result = await withDatabaseRetry(async () => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            // 查找现有对话
            const [conversations] = await connection.query(
                'SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
                [senderId, receiverId, receiverId, senderId]
            );
            
            let conversationId;
            
            // 如果对话不存在，创建新对话
            if (conversations.length === 0) {
                const [insertResult] = await connection.query(
                    'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)',
                    [senderId, receiverId]
                );
                conversationId = insertResult.insertId;
            } else {
                conversationId = conversations[0].id;
            }
            
            // 发送消息
            const [messageResult] = await connection.query(
                'INSERT INTO messages (conversation_id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)',
                [conversationId, senderId, receiverId, content]
            );
            
            // 更新对话的最后消息时间
            await connection.query(
                'UPDATE conversations SET updated_at = NOW() WHERE id = ?',
                [conversationId]
            );
            
            await connection.commit();
            
            return {
                id: messageResult.insertId,
                conversationId,
                senderId,
                content,
                createdAt: new Date()
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    });
    
    if (!result.success) {
        console.log('发送消息失败:', result.error);
        throw new Error('发送消息失败');
    }
    
    return result.result;
}

// 获取用户信息（用于显示对话对象的信息）
async function getUserInfo(userId) {
    const result = await withDatabaseRetry(async () => {
        const connection = await pool.getConnection();
        try {
            const [users] = await connection.query(
                'SELECT id, username FROM users WHERE id = ?',
                [userId]
            );
            return users[0] || null;
        } finally {
            connection.release();
        }
    });
    
    if (!result.success) {
        console.log('获取用户信息失败:', result.error);
        return null;
    }
    
    return result.result;
}

// API控制器导出

// 获取对话列表
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await getConversations(userId);
        
        res.status(200).json({
            conversations,
            message: '获取对话列表成功'
        });
    } catch (error) {
        console.error('获取对话列表过程中的错误:', error);
        res.status(500).json({
            message: '获取对话列表失败',
            error: error.message
        });
    }
};

// 获取对话消息
exports.getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        
        console.log(`HTTP请求: 获取对话${conversationId}的消息历史，用户ID=${userId}`);
        const messages = await getConversationMessages(conversationId, userId);
        
        res.status(200).json({
            messages,
            message: '获取消息历史成功'
        });
    } catch (error) {
        console.error('获取消息历史过程中的错误:', error);
        res.status(403).json({
            message: error.message || '获取消息历史失败'
        });
    }
};

// 发送消息
exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId, content } = req.body;
        
        if (!receiverId || !content) {
            return res.status(400).json({
                message: '缺少必要参数'
            });
        }
        
        const message = await sendMessage(senderId, receiverId, content);
        
        res.status(201).json({
            message,
            message: '发送消息成功'
        });
    } catch (error) {
        console.error('发送消息过程中的错误:', error);
        res.status(500).json({
            message: error.message || '发送消息失败'
        });
    }
};

// 创建新对话
exports.createConversation = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId } = req.body;
        
        if (!receiverId) {
            return res.status(400).json({
                message: '缺少接收者ID'
            });
        }
        
        // 检查接收者是否存在
        const receiver = await getUserInfo(receiverId);
        if (!receiver) {
            return res.status(404).json({
                message: '接收者不存在'
            });
        }
        
        // 查找或创建对话
        const result = await withDatabaseRetry(async () => {
            const connection = await pool.getConnection();
            try {
                // 查找现有对话
                const [conversations] = await connection.query(
                    'SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
                    [senderId, receiverId, receiverId, senderId]
                );
                
                let conversationId;
                
                if (conversations.length === 0) {
                    const [insertResult] = await connection.query(
                        'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)',
                        [senderId, receiverId]
                    );
                    conversationId = insertResult.insertId;
                } else {
                    conversationId = conversations[0].id;
                }
                
                return { conversationId, receiver };
            } finally {
                connection.release();
            }
        });
        
        if (!result.success) {
            throw new Error('创建对话失败');
        }
        
        res.status(200).json({
            conversation: {
                id: result.result.conversationId,
                otherUserId: receiverId,
                otherUsername: result.result.receiver.username
            },
            message: '对话已创建'
        });
    } catch (error) {
        console.error('创建对话过程中的错误:', error);
        res.status(500).json({
            message: error.message || '创建对话失败'
        });
    }
};