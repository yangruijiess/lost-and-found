const dotenv = require('dotenv');

dotenv.config();

// 尝试加载axios，如果失败则使用null
let axios = null;
try {
  axios = require('axios');
} catch (error) {
  console.warn('警告: 未能加载axios模块。AI服务将使用备用实现。');
  console.warn('建议运行: npm install axios 来启用完整的AI功能。');
}

/**
 * AI服务类，用于与外部大模型API交互
 */
class AIService {
  constructor() {
    // 从环境变量中获取API密钥和URL
    this.apiKey = process.env.AI_API_KEY || '';
    this.apiUrl = process.env.AI_API_URL || 'https://api.deepseek.com/v1/chat/completions';
    this.model = process.env.AI_MODEL || 'deepseek-chat';
    // 暴露axios实例，供外部使用
    this.axios = axios;
    
    console.log('AI服务初始化:', {
      apiUrl: this.apiUrl,
      model: this.model,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey ? this.apiKey.length : 0
    });
    
    // 验证必要的配置
    if (!this.apiKey) {
      console.error('⚠️  警告: 未配置AI_API_KEY环境变量，API调用将失败');
    }
  }

  /**
   * 从物品描述中提取关键词
   * @param {string} description - 物品描述文本
   * @returns {Promise<Array<string>>} - 返回提取的关键词数组
   */
  async extractKeywords(description) {
    try {
      // 检查axios是否可用
      if (!axios) {
        throw new Error('axios模块未安装，无法调用AI服务');
      }
      
      // 检查API配置是否完整
      if (!this.apiKey || !this.apiUrl) {
        throw new Error('AI服务配置不完整，请检查环境变量');
      }

      // 构建提示词
      const prompt = `
        请从以下物品描述中提取2-5个核心关键词，每个关键词1-2个字，用于失物招领验证。
        关键词应该是物品的核心特征、品牌、颜色、形状等明显标识。
        请直接返回关键词数组，不要有其他文字，格式为[关键词1,关键词2,...]。
        
        物品描述: ${description}
      `;

      // 调用外部大模型API
      console.log('开始调用AI服务提取关键词...');
      console.log('API URL:', this.apiUrl);
      console.log('API Model:', this.model);
      // 不要在日志中打印完整的API密钥，只显示前几位和后几位
      console.log('API Key:', this.apiKey ? `${this.apiKey.substring(0, 5)}...${this.apiKey.substring(this.apiKey.length - 5)}` : '未设置');
      
      // 简化axios调用，避免处理复杂的响应对象
      try {
        // 记录完整的API调用准备信息（除了完整的API密钥）
        console.log('准备调用DeepSeek API:', {
          apiUrl: this.apiUrl,
          model: this.model,
          authorizationHeaderPresent: !!this.apiKey,
          promptLength: prompt.length,
          currentEnv: process.env.NODE_ENV || 'development'
        });
        
        const response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            messages: [
              { role: 'system', content: '你是一个专业的关键词提取助手，擅长从物品描述中提取核心特征关键词。' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 100
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            timeout: 30000,
            // 保留完整的状态码信息
            validateStatus: function(status) {
              return true; // 不拒绝任何状态码，让我们自己处理
            }
          }
        );
        
        console.log('DeepSeek API调用完成，状态码:', response.status);
        
        // 如果状态码不是200，抛出错误
        if (response.status !== 200) {
          console.error('DeepSeek API返回非成功状态码:', response.status);
          throw new Error(`DeepSeek API错误: ${response.status} ${response.statusText}`);
        }
        
        // 只返回响应数据，不返回整个response对象
        if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
          throw new Error('API返回数据格式不正确');
        }
        
        // 直接返回需要的内容，避免处理整个response对象
        return {
          status: response.status,
          content: response.data.choices[0].message.content
        };
      } catch (axiosError) {
        // 详细记录错误信息，特别是关于401的情况
        console.error('=== DeepSeek API调用错误详情 ===');
        console.error('错误类型:', axiosError.name);
        console.error('错误代码:', axiosError.code);
        console.error('错误消息:', axiosError.message);
        
        if (axiosError.response) {
          console.error('HTTP状态码:', axiosError.response.status);
          console.error('HTTP状态文本:', axiosError.response.statusText);
          
          // 尝试安全地记录响应数据的键，避免循环引用
          if (axiosError.response.data) {
            console.error('响应数据键:', Object.keys(axiosError.response.data));
            // 特别记录error字段，如果存在
            if (axiosError.response.data.error) {
              console.error('DeepSeek API错误详情:', JSON.stringify(axiosError.response.data.error, null, 2));
            }
          }
          
          // 检查是否是授权问题
          if (axiosError.response.status === 401) {
            console.error('🔴 授权失败分析:');
            console.error('- API密钥是否存在:', !!this.apiKey);
            console.error('- API密钥长度:', this.apiKey ? this.apiKey.length : 0);
            console.error('- API URL:', this.apiUrl);
            console.error('- 可能原因: 密钥无效、已过期或权限不足');
            throw new Error(`DeepSeek API授权失败(401): ${axiosError.response.data?.error?.message || '未授权访问'}`);
          }
        } else if (axiosError.request) {
          console.error('未收到响应，请求已发送');
        }
        
        // 提供明确的错误消息，不包含复杂对象
        if (axiosError.response?.status === 403) {
          throw new Error(`DeepSeek API访问被拒绝(403): ${axiosError.response.data?.error?.message || '权限不足'}`);
        } else if (axiosError.response?.status === 404) {
          throw new Error('API端点不存在: ' + this.apiUrl);
        } else if (axiosError.code === 'ENOTFOUND') {
          throw new Error('无法连接到API服务器');
        } else if (axiosError.code === 'ECONNREFUSED') {
          throw new Error('API连接被拒绝');
        } else if (axiosError.code === 'ETIMEDOUT') {
          throw new Error('API请求超时');
        } else {
          throw new Error(`AI服务调用失败: ${axiosError.message}`);
        }
      }

      // 解析返回的关键词
      const keywordsText = response.data.choices[0].message.content.trim();
      console.log('AI返回的原始内容:', keywordsText);
      
      // 尝试解析JSON格式的关键词数组
      try {
        // 清理可能的格式问题
        let cleanText = keywordsText;
        
        // 移除可能的Markdown代码块标记
        cleanText = cleanText.replace(/^```json|```$/g, '').trim();
        
        // 尝试标准JSON解析
        let keywords;
        try {
          keywords = JSON.parse(cleanText);
        } catch (strictError) {
          // 如果严格解析失败，尝试处理DeepSeek返回的特殊格式
          console.log('尝试处理DeepSeek返回的非标准JSON格式...');
          
          // 处理形如 [关键词1,关键词2,...] 的格式
          if (cleanText.startsWith('[') && cleanText.endsWith(']')) {
            // 匹配中文字符和简单词汇
            const keywordMatches = cleanText.match(/[\u4e00-\u9fa5a-zA-Z0-9]+/g);
            if (keywordMatches) {
              keywords = keywordMatches;
            } else {
              throw new Error('无法提取关键词');
            }
          } else {
            // 尝试直接提取所有可能的关键词
            const keywordMatches = cleanText.match(/[\u4e00-\u9fa5a-zA-Z0-9]+/g);
            if (keywordMatches) {
              keywords = keywordMatches;
            } else {
              throw new Error('无法提取关键词');
            }
          }
        }
        
        // 确保返回的是数组格式
        if (!Array.isArray(keywords)) {
          // 如果不是数组，尝试转换
          const keywordMatches = String(keywords).match(/[\u4e00-\u9fa5a-zA-Z0-9]+/g);
          keywords = keywordMatches || [];
        }
        console.log('成功提取关键词:', keywords);
        return keywords;
      } catch (jsonError) {
        console.error('无法解析AI返回的关键词:', jsonError.message);
        // 即使解析失败，也尝试提取一些可能的关键词
        const fallbackKeywords = keywordsText.match(/[\u4e00-\u9fa5a-zA-Z0-9]+/g) || [];
        console.log('使用备用方式提取的关键词:', fallbackKeywords);
        return fallbackKeywords;
      }
    } catch (error) {
      console.error('调用AI服务提取关键词失败:', error.message);
      // 移除本地备用实现，强制要求使用外部API
      throw new Error(`AI服务调用失败: ${error.message}`);
    }
  }

  // 已移除本地备用关键词提取方法，强制使用外部API

  /**
   * 验证用户回答是否与关键词匹配
   * @param {string} userAnswer - 用户回答
   * @param {Array<string>} keywords - 关键词数组
   * @returns {Promise<boolean>} - 返回验证结果
   */
  async validateAnswer(userAnswer, keywords) {
    try {
      // 检查axios是否可用
      if (!axios) {
        throw new Error('axios模块未安装，无法调用AI服务');
      }
      
      // 检查API配置是否完整
      if (!this.apiKey || !this.apiUrl) {
        throw new Error('AI服务配置不完整，请检查环境变量');
      }
      
      // 验证输入参数
      if (!userAnswer || !Array.isArray(keywords) || keywords.length === 0) {
        throw new Error('无效的输入参数');
      }

      // 构建提示词
      const prompt = `
        请判断用户的回答是否包含以下关键词中的至少一个。
        关键词: ${keywords.join(', ')}
        用户回答: ${userAnswer}
        
        请直接回答'是'或'否'，不要有其他文字。
      `;

      // 调用外部大模型API
      console.log('开始调用AI服务验证答案...');
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            { role: 'system', content: '你是一个专业的答案验证助手，负责判断用户回答是否包含指定关键词。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 10
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      // 解析返回结果
      const result = response.data.choices[0].message.content.trim();
      console.log('AI验证结果:', result);
      return result === '是';
    } catch (error) {
      console.error('调用AI服务验证答案失败:', error.message);
      // 移除本地备用实现，强制要求使用外部API
      throw new Error(`AI服务调用失败: ${error.message}`);
    }
  }

  // 已移除本地备用答案验证方法，强制使用外部API
}

module.exports = new AIService();