const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

// 从环境变量加载配置
const apiKey = process.env.AI_API_KEY || '';
const apiUrl = process.env.AI_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const model = process.env.AI_MODEL || 'deepseek-chat';

console.log('测试AI服务配置:');
console.log('- API URL:', apiUrl);
console.log('- Model:', model);
console.log('- API Key:', apiKey ? '已设置' : '未设置');

async function testExtractKeywords() {
  console.log('\n=== 测试关键词提取功能 ===');
  
  const description = '黑色皮质钱包，长方形，有LV标志，内部有身份证和银行卡';
  const prompt = `
    请从以下物品描述中提取2-5个核心关键词，每个关键词1-2个字，用于失物招领验证。
    关键词应该是物品的核心特征、品牌、颜色、形状等明显标识。
    请直接返回关键词数组，不要有其他文字，格式为[关键词1,关键词2,...]。
    
    物品描述: ${description}
  `;

  try {
    console.log('发送API请求...');
    const response = await axios.post(
      apiUrl,
      {
        model: model,
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
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    console.log('API响应状态:', response.status);
    console.log('AI返回的原始内容:', response.data.choices[0].message.content.trim());
    
    // 尝试解析JSON
    try {
      const rawContent = response.data.choices[0].message.content.trim();
      console.log('AI返回的原始内容:', rawContent);
      
      // 清理可能的Markdown代码块标记
      let cleanContent = rawContent;
      cleanContent = cleanContent.replace(/^```json|```$/g, '').trim();
      cleanContent = cleanContent.replace(/^```|```$/g, '').trim();
      
      // 尝试JSON解析
      try {
        const keywords = JSON.parse(cleanContent);
        console.log('解析后的关键词:', keywords);
      } catch (parseError) {
        // 如果JSON解析失败，尝试提取关键词
        console.log('JSON解析失败，尝试提取关键词...');
        const keywordMatches = cleanContent.match(/[\u4e00-\u9fa5a-zA-Z0-9]+/g);
        if (keywordMatches) {
          console.log('提取的关键词:', keywordMatches);
        } else {
          console.log('无法提取关键词');
        }
      }
    } catch (parseError) {
      console.error('JSON解析失败:', parseError.message);
    }
  } catch (error) {
    console.error('API调用失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求已发送但未收到响应');
    }
  }
}

async function testValidateAnswer() {
  console.log('\n=== 测试答案验证功能 ===');
  
  const userAnswer = '钱包是黑色的，皮质材质';
  const keywords = ['黑色', '皮质', '钱包', 'LV'];
  
  const prompt = `
    请判断用户的回答是否包含以下关键词中的至少一个。
    关键词: ${keywords.join(', ')}
    用户回答: ${userAnswer}
    
    请直接回答'是'或'否'，不要有其他文字。
  `;

  try {
    console.log('发送API请求...');
    const response = await axios.post(
      apiUrl,
      {
        model: model,
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
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    console.log('API响应状态:', response.status);
    console.log('AI返回的原始内容:', response.data.choices[0].message.content.trim());
    
    const result = response.data.choices[0].message.content.trim();
    console.log('验证结果:', result);
  } catch (error) {
    console.error('API调用失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求已发送但未收到响应');
    }
  }
}

async function testGenerateQuestions() {
  console.log('\n=== 测试问题生成功能 ===');
  
  const title = '黑色皮质钱包';
  const description = '黑色皮质钱包，长方形，有LV标志，内部有身份证和银行卡';
  
  const prompt = `
    请根据以下物品信息生成2-3个验证问题，用于失物招领身份验证。这些问题应该只能由物品的真正主人回答正确。
    
    物品标题: ${title}
    物品描述: ${description}
    
    请返回JSON格式，包含问题数组，每个问题包含id、question文本和expectedKeywords数组（这个数组应该包含描述中提到的关键词，用于验证答案）。
    例如：
    {
      "questions": [
        {
          "id": 1,
          "question": "请描述该物品的具体颜色？",
          "expectedKeywords": ["黑色", "皮质"]
        },
        {
          "id": 2,
          "question": "该物品上有什么特殊标识？",
          "expectedKeywords": ["LV", "logo"]
        }
      ]
    }
  `;

  try {
    console.log('发送API请求...');
    const response = await axios.post(
      apiUrl,
      {
        model: model,
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
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    console.log('API响应状态:', response.status);
    console.log('AI返回的原始内容:', response.data.choices[0].message.content.trim());
    
    // 尝试解析JSON
    try {
      const rawContent = response.data.choices[0].message.content.trim();
      console.log('AI返回的原始内容:', rawContent);
      
      // 清理Markdown代码块标记
      let cleanContent = rawContent;
      cleanContent = cleanContent.replace(/^```json|```$/g, '').trim();
      cleanContent = cleanContent.replace(/^```|```$/g, '').trim();
      
      try {
        const parsedResponse = JSON.parse(cleanContent);
        console.log('解析后的问题:', parsedResponse.questions);
      } catch (parseError) {
        console.log('JSON解析失败，返回原始内容:', cleanContent);
      }
    } catch (error) {
      console.error('处理AI响应失败:', error.message);
    }
  } catch (error) {
    console.error('API调用失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求已发送但未收到响应');
    }
  }
}

// 运行测试
async function runTests() {
  await testExtractKeywords();
  await testValidateAnswer();
  await testGenerateQuestions();
}

runTests().catch(console.error);