export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const envStatus = {
    success: true,
    message: 'API 路由正常工作!',
    environment: {
      supabase_url: process.env.SUPABASE_URL ? '✅ 已设置' : '❌ 未设置',
      supabase_key: process.env.SUPABASE_ANON_KEY ? '✅ 已设置' : '❌ 未设置',
      node_env: process.env.NODE_ENV || '未设置'
    },
    request: {
      method: req.method,
      url: req.url,
      query: req.query
    },
    timestamp: new Date().toISOString()
  };

  console.log('API 测试请求:', envStatus);
  res.status(200).json(envStatus);
}
