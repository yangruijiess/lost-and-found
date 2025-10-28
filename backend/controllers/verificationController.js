const axios = require('axios');

// 配置豆包大语言模型API
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || 'your_api_key_here';
const DOUBAO_API_URL = 'https://api.doubao.com/chat/completions';

/**
 * 生成验证问题接口
 * 用于根据物品图片生成验证问题和关键词答案
 * 只有用户答对问题才能进入招领物品的详情页面
 */
exports.generateVerification = async (req, res) => {
  try {
    const { imageUrl, itemId, itemType } = req.body;
    
    // 1. 验证请求参数
    if (!imageUrl || !itemId || !itemType || !['lost', 'found'].includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: '参数错误',
        errorCode: 'INVALID_PARAMS'
      });
    }
    
    // 2. 调用豆包大语言模型API分析图片内容
    let question, keywords;
    
    try {
      // 调用豆包API分析图片并生成验证问题
      const response = await axios.post(DOUBAO_API_URL, {
        model: 'ERNIE-Bot',
        messages: [
          {
            role: 'system',
            content: '你是一个图片分析助手，请根据提供的图片URL分析图片内容，并生成3个验证问题和3个对应的关键词答案。问题应该是关于图片中物品的具体细节，答案应该是1-2个字的关键词。返回格式必须为JSON: {\"question\": \"问题内容\", \"keywords\": [\"关键词1\", \"关键词2\", \"关键词3\"]}'
          },
          {
            role: 'user',
            content: `请分析这张图片并生成验证信息: ${imageUrl}`
          }
        ],
        temperature: 0.3, // 降低随机性，确保回答更确定
        max_tokens: 200
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DOUBAO_API_KEY}`
        }
      });
      
      // 解析API响应
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const modelContent = response.data.choices[0].message.content;
        try {
          const result = JSON.parse(modelContent);
          question = result.question;
          keywords = result.keywords;
          
          // 验证返回的数据格式
          if (!question || !Array.isArray(keywords) || keywords.length === 0) {
            throw new Error('模型返回的数据格式不正确');
          }
        } catch (parseError) {
          console.error('解析模型返回的JSON失败:', parseError.message);
          throw new Error('模型返回的数据格式不正确');
        }
      } else {
        throw new Error('模型未返回有效数据');
      }
      
    } catch (apiError) {
      console.error('调用豆包大语言模型API失败:', apiError.message);
      
      // 如果API调用失败或配置不正确，使用备用的模拟问题生成逻辑
      console.log('使用备用模拟逻辑生成验证问题');
      
      // 根据物品类型和ID生成模拟的验证问题和答案
      const mockQuestions = {
        'lost': [
          { q: '图片中物品的主要颜色是什么？', k: ['红色', '蓝色', '黑色'] },
          { q: '物品上有什么明显标志？', k: ['logo', '图案', '文字'] },
          { q: '物品是什么形状的？', k: ['圆形', '方形', '长方形'] },
          { q: '物品的材质看起来像什么？', k: ['金属', '塑料', '布料'] },
          { q: '物品大约有多大？', k: ['小型', '中型', '大型'] }
        ],
        'found': [
          { q: '图片中拾得物品的颜色是？', k: ['白色', '黑色', '灰色'] },
          { q: '物品有什么特殊特征？', k: ['拉链', '口袋', '纽扣'] },
          { q: '物品表面有文字吗？', k: ['有', '无'] },
          { q: '物品的用途可能是？', k: ['学习', '工作', '生活'] },
          { q: '物品看起来是新的还是旧的？', k: ['新的', '旧的'] }
        ]
      };
      
      // 使用物品ID生成一个伪随机索引，确保相同物品生成相同问题
      const idHash = itemId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const index = idHash % mockQuestions[itemType].length;
      const selected = mockQuestions[itemType][index];
      question = selected.q;
      keywords = selected.k;
    }
    
    // 3. 返回问题和关键词信息
    res.json({
      success: true,
      data: {
        question: question,
        keywords: keywords,
        itemId: itemId,
        itemType: itemType,
        timestamp: new Date().getTime()
      },
      message: '验证问题生成成功'
    });
  } catch (error) {
    console.error('生成验证问题失败:', error.message);
    res.status(500).json({
      success: false,
      message: '验证问题生成失败',
      errorCode: 'SERVER_ERROR',
      errorDetails: error.message
    });
  }
};

/**
 * 验证用户答案接口
 * 用于验证用户提交的答案是否正确
 */
exports.verifyAnswer = (req, res) => {
  try {
    const { question, userAnswer, keywords } = req.body;
    
    // 验证请求参数
    if (!question || !userAnswer || !Array.isArray(keywords)) {
      return res.status(400).json({
        success: false,
        message: '参数错误',
        errorCode: 'INVALID_PARAMS'
      });
    }
    
    // 转换为小写并去除空格进行比较
    const normalizedUserAnswer = userAnswer.toLowerCase().trim();
    const normalizedKeywords = keywords.map(keyword => keyword.toLowerCase().trim());
    
    // 检查用户答案是否与任何关键词匹配
    const isCorrect = normalizedKeywords.some(keyword => 
      normalizedUserAnswer.includes(keyword) || keyword.includes(normalizedUserAnswer)
    );
    
    res.json({
      success: true,
      data: {
        isCorrect: isCorrect,
        correctAnswers: keywords
      },
      message: isCorrect ? '验证成功' : '验证失败，请检查您的答案'
    });
  } catch (error) {
    console.error('验证答案失败:', error.message);
    res.status(500).json({
      success: false,
      message: '验证答案失败',
      errorCode: 'SERVER_ERROR'
    });
  }
};