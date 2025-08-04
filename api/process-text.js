// 文本处理API - Vercel Serverless Function
// 支持 # 号标记和空格分隔自动换行

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理OPTIONS请求（预检请求）
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: '只支持POST请求',
      message: '请使用POST方法发送请求'
    });
  }

  try {
    const { text, mode = 'auto' } = req.body;

    // 验证输入
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: '无效的输入',
        message: '请提供有效的文本内容'
      });
    }

    // 处理文本
    const result = processTextAdvanced(text, mode);
    
    // 计算统计信息
    const stats = calculateStats(text, result);

    // 返回结果
    res.status(200).json({
      success: true,
      result: result,
      stats: stats,
      mode: mode,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API处理错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      message: '处理请求时发生错误'
    });
  }
}

// 核心文本处理函数（从HTML中提取的逻辑）
function processTextAdvanced(text, mode = 'auto') {
  // 自动模式：检测是否包含 # 号
  if (mode === 'auto') {
    if (text.includes('#')) {
      return processHashMode(text);
    } else {
      return processSpaceMode(text);
    }
  }
  
  // 指定模式
  if (mode === 'hash') {
    return processHashMode(text);
  }
  
  if (mode === 'space') {
    return processSpaceMode(text);
  }
  
  throw new Error('不支持的处理模式');
}

// # 号标记模式处理
function processHashMode(text) {
  const hashPattern = /#([^#\s]+)/g;
  const matches = text.match(hashPattern);
  
  if (!matches) {
    return '未找到 # 号标记的内容';
  }
  
  // 提取 # 号后的内容（去掉 # 号）
  const extractedTexts = matches.map(match => match.substring(1));
  
  // 用换行符连接所有提取的文本
  return extractedTexts.join('\n');
}

// 空格分隔模式处理
function processSpaceMode(text) {
  const words = text.trim().split(/\s+/);
  
  if (words.length === 0 || (words.length === 1 && words[0] === '')) {
    return '未找到可处理的文本内容';
  }
  
  // 过滤掉空字符串，并用换行符连接
  const filteredWords = words.filter(word => word.trim() !== '');
  return filteredWords.join('\n');
}

// 计算统计信息
function calculateStats(originalText, processedText) {
  const originalCount = originalText.length;
  const processedCount = processedText.length;
  const hashCount = (originalText.match(/#/g) || []).length;
  const lineCount = processedText.split('\n').length;
  
  return {
    originalCount,
    processedCount,
    hashCount,
    lineCount,
    reduction: originalCount - processedCount,
    reductionPercentage: originalCount > 0 ? ((originalCount - processedCount) / originalCount * 100).toFixed(2) : 0
  };
} 