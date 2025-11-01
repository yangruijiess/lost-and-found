const { pool: db } = require('../config/database');
const aiService = require('../services/aiService');

/**
 * AI控制器，处理与AI相关的API请求
 */
const aiController = {
  /**
   * 从物品描述中提取关键词
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  extractKeywords: async (req, res) => {
    try {
      const { itemId, itemType } = req.params;
      
      // 验证参数
      if (!itemId || !['found', 'lost'].includes(itemType)) {
        return res.status(400).json({
          success: false,
          message: '无效的请求参数',
          errorCode: 'INVALID_PARAMETERS'
        });
      }

      // 从数据库获取物品描述
      const tableName = itemType === 'found' ? 'found_items' : 'lost_items';
      const [rows] = await db.query(
        `SELECT description FROM ${tableName} WHERE id = ?`,
        [itemId]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '未找到指定物品',
          errorCode: 'ITEM_NOT_FOUND'
        });
      }

      const description = rows[0].description;
      if (!description || description.trim() === '') {
        return res.status(400).json({
          success: false,
          message: '物品没有描述信息',
          errorCode: 'NO_DESCRIPTION'
        });
      }

      // 调用AI服务提取关键词
      console.log('准备调用AI服务提取关键词...');
      try {
        // aiService现在返回包含status和content的对象
        const aiResult = await aiService.extractKeywords(description);
        
        console.log('关键词提取成功:', aiResult);
        
        // 解析content中的关键词数组（去除可能的中括号）
        let keywordsArray = [];
        try {
          // 尝试解析JSON格式的关键词
          keywordsArray = JSON.parse(aiResult.content.replace(/\[|\]/g, ''));
        } catch (parseError) {
          // 如果解析失败，尝试直接处理字符串
          console.log('解析JSON失败，尝试直接处理字符串:', parseError.message);
          // 移除中括号并分割
          keywordsArray = aiResult.content.replace(/\[|\]/g, '').split(',').map(k => k.trim());
        }
        
        res.json({
          success: true,
          data: {
            itemId,
            itemType,
            description,
            keywords: keywordsArray,
            aiResponse: aiResult
          },
          message: '关键词提取成功'
        });
      } catch (aiError) {
        console.error('AI服务调用详细错误:', aiError.message);
        res.status(500).json({
          success: false,
          message: `AI服务调用失败: ${aiError.message}`,
          errorCode: 'AI_SERVICE_ERROR'
        });
      }
    } catch (error) {
      console.error('提取关键词失败:', error.message);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        errorCode: 'SERVER_ERROR',
        errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 验证用户答案是否与关键词匹配
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  validateAnswer: async (req, res) => {
    try {
      const { itemId, itemType } = req.params;
      const { answer, keywords } = req.body;

      // 验证参数
      if (!itemId || !['found', 'lost'].includes(itemType) || !answer || !Array.isArray(keywords)) {
        return res.status(400).json({
          success: false,
          message: '无效的请求参数',
          errorCode: 'INVALID_PARAMETERS'
        });
      }

      // 调用AI服务验证答案
      const isValid = await aiService.validateAnswer(answer, keywords);

      // 记录验证结果（可选）
      try {
        await db.query(
          'INSERT INTO verification_logs (item_id, item_type, user_answer, is_valid, created_at) VALUES (?, ?, ?, ?, NOW())',
          [itemId, itemType, answer, isValid ? 1 : 0]
        );
      } catch (logError) {
        console.warn('记录验证日志失败:', logError.message);
      }

      res.json({
        success: true,
        data: {
          itemId,
          itemType,
          isValid,
          userAnswer: answer,
          checkedKeywords: keywords
        },
        message: isValid ? '答案验证通过' : '答案验证失败'
      });
    } catch (error) {
      console.error('验证答案失败:', error.message);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        errorCode: 'SERVER_ERROR',
        errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 生成验证问题
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  generateQuestions: async (req, res) => {
    try {
      const { itemId, itemType } = req.params;

      // 验证参数
      if (!itemId || !['found', 'lost'].includes(itemType)) {
        return res.status(400).json({ success: false, message: '无效的请求参数', errorCode: 'INVALID_PARAMETERS' });
      }

      // 从数据库获取物品描述
      const tableName = itemType === 'found' ? 'found_items' : 'lost_items';
      const [rows] = await db.query(
        `SELECT description, title FROM ${tableName} WHERE id = ?`,
        [itemId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: '未找到指定物品', errorCode: 'ITEM_NOT_FOUND' });
      }

      const { description, title } = rows[0];
      if (!description || description.trim() === '') {
        return res.status(400).json({ success: false, message: '物品没有描述信息', errorCode: 'NO_DESCRIPTION' });
      }

      // 提取关键词
      const keywords = await aiService.extractKeywords(description);

      // 检查axios是否可用
      if (!aiService.axios) {
        throw new Error('AI服务依赖axios模块未安装，请先安装axios');
      }

      // 调用外部AI服务生成验证问题
      const prompt = `
        请根据以下物品描述严格生成2个验证问题，用于失物招领身份验证。
        
        重要要求：
        1. 问题数量必须为2，不多不少
        2. 所有问题必须严格基于物品描述生成，不使用标题信息
        3. 每个问题的expectedKeywords数组只能包含描述中出现的核心关键词
        4. 关键词必须简短（1-2个字最佳，最长不超过3个字）
        5. 问题应该能有效区分物品的真正主人和其他人
        6. 绝不允许编造或添加描述中不存在的信息
        
        物品描述: ${description}
        
        请返回JSON格式，包含questions数组，每个问题包含id、question文本和expectedKeywords数组。
        示例输出格式：
        {
          "questions": [
            {
              "id": 1,
              "question": "物品的颜色是什么？",
              "expectedKeywords": ["黑色"]
            },
            {
              "id": 2,
              "question": "物品上有什么标识？",
              "expectedKeywords": ["LV"]
            }
          ]
        }
      `;

      // 直接调用外部API（复用aiService中的配置）
      const response = await aiService.axios.post(
        aiService.apiUrl,
        {
          model: aiService.model,
          messages: [
            { role: 'system', content: '你是一个专业的验证问题生成助手，擅长根据物品信息创建安全的身份验证问题。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 300
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiService.apiKey}`
          }
        }
      );

      // 解析AI返回的问题
      let questions;
      try {
        const aiResponse = response.data.choices[0].message.content.trim();
        console.log('AI返回的问题原始内容:', aiResponse);
        
        // 清理Markdown代码块标记，处理DeepSeek可能返回的格式
        let cleanResponse = aiResponse;
        // 移除 ```json 和 ``` 标记
        cleanResponse = cleanResponse.replace(/^```json|```$/g, '').trim();
        // 也处理可能只有 ``` 的情况
        cleanResponse = cleanResponse.replace(/^```|```$/g, '').trim();
        console.log('清理后的问题内容:', cleanResponse);
        
        const parsedResponse = JSON.parse(cleanResponse);
        questions = parsedResponse.questions || [];
        
        // 确保questions是数组且有内容
        if (!Array.isArray(questions) || questions.length === 0) {
          console.warn('AI返回的问题数组为空或无效');
          // 生成备用问题
          questions = [
            { id: 1, question: '请描述该物品的颜色？', expectedKeywords: keywords.slice(0, 2) },
            { id: 2, question: '请描述该物品的主要特征？', expectedKeywords: keywords.slice(2, 4) }
          ];
        }
        
        // 确保每个问题都有必要的字段
        questions = questions.map((q, index) => ({
          id: q.id || index + 1,
          question: q.question || '',
          expectedKeywords: Array.isArray(q.expectedKeywords) ? q.expectedKeywords : keywords
        }));
      } catch (parseError) {
        console.error('解析AI返回的问题失败:', parseError.message);
        throw new Error('无法解析AI生成的验证问题，请检查API配置');
      }

      res.json({
        success: true,
        data: {
          itemId,
          itemType,
          title,
          description,
          questions,
          keywords
        },
        message: '验证问题生成成功'
      });
    } catch (error) {
      console.error('生成验证问题失败:', error.message);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        errorCode: 'SERVER_ERROR',
        errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = aiController;