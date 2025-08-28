// api/verify.js (Vercel Serverless Function)
const crypto = require('crypto');

// 假设你有一个有效的卡密列表（实际应用中应从数据库或持久化存储中获取）
// 这里用Map存储卡密及其相关信息（如有效期、已使用次数等）
const validKeys = new Map();
validKeys.set('ljxtest', { 
  expires: 604,800,000, // 过期时间戳（毫秒）
  used: 0, // 已使用次数
  maxUse: 9999999 // 最大使用次数
}); 
// 可以添加更多卡密

// 用于生成响应
function createResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // 允许Auto.js应用跨域访问
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(data)
  };
}

module.exports = async (req, res) => {
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return createResponse(200, {});
  }

  if (req.method === 'POST') {
    try {
      const { key, action = 'verify', deviceId } = req.body;

      if (!key) {
        return createResponse(400, { success: false, message: '卡密不能为空' });
      }

      // 查找卡密
      const keyInfo = validKeys.get(key);
      const now = Date.now();

      if (!keyInfo) {
        return createResponse(404, { success: false, message: '卡密无效' });
      }

      // 检查卡密是否过期
      if (keyInfo.expires && now > keyInfo.expires) {
        return createResponse(403, { success: false, message: '卡密已过期' });
      }

      // 检查使用次数
      if (keyInfo.maxUse && keyInfo.used >= keyInfo.maxUse) {
        return createResponse(403, { success: false, message: '卡密使用次数已耗尽' });
      }

      // 验证成功，更新使用次数（这里需要持久化存储支持才能真正更新）
      // validKeys.set(key, { ...keyInfo, used: keyInfo.used + 1 });

      return createResponse(200, { 
        success: true, 
        message: '验证成功',
        data: {
          expires: keyInfo.expires,
          // 可以返回其他授权信息，如用户权限等
        }
      });

    } catch (error) {
      console.error('验证出错:', error);
      return createResponse(500, { success: false, message: '服务器内部错误' });
    }
  } else {
    return createResponse(405, { success: false, message: '方法不允许' });
  }
};