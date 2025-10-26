export default async function handler(req, res) {
  // 返回环境变量信息（不暴露敏感值）
  res.json({
    success: true,
    supabase_url: process.env.SUPABASE_URL ? '已设置' : '未设置',
    supabase_key: process.env.SUPABASE_ANON_KEY ? '已设置' : '未设置',
    node_env: process.env.NODE_ENV
  })
}
