// 首先确保没有依赖问题
console.log('Function starting...');

module.exports = async (req, res) => {
  try {
    console.log('Request received:', req.method, req.url);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      return res.status(200).end();
    }

    // 只处理POST请求
    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method);
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed. Use POST.' 
      });
    }

    // 解析请求体
    let body = {};
    try {
      if (req.body) {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      }
    } catch (e) {
      console.log('JSON parse error:', e.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid JSON format' 
      });
    }

    const { key } = body;
    console.log('Received key:', key);

    // 验证卡密
    if (!key) {
      return res.status(400).json({ 
        success: false, 
        message: '卡密不能为空' 
      });
    }

    // 简单的卡密验证（先去掉md5依赖测试）
    const validKeys = ['ljxtest'];
    
    if (validKeys.includes(key.trim())) {
      console.log('Key validation successful');
      return res.status(200).json({ 
        success: true, 
        message: '验证成功',
        data: { 
          expires: Date.now() + 24 * 60 * 60 * 1000 // 24小时
        }
      });
    } else {
      console.log('Key validation failed');
      return res.status(403).json({ 
        success: false, 
        message: '卡密无效' 
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器内部错误: ' + error.message 
    });
  }
};
