import axios from 'axios';

export default async (req, res) => {
  const { token, phone, keyword = 'URL' } = req.query;
  
  if (!token || !phone) {
    return res.status(400).json({ error: '缺少token或手机号参数' });
  }

  try {
    const response = await axios.get('http://api.eomsg.com/zc/data.php', {
      params: {
        code: 'getMsg',
        token,
        phone,
        keyWord: keyword
      }
    });
    
    // 返回易码API的原始响应
    res.status(200).send(response.data);
  } catch (error) {
    console.error('易码API请求失败:', error);
    res.status(500).json({ error: '获取验证码失败' });
  }
};
