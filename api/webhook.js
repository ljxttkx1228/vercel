import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const discordEmbed = req.body;
    const embed = discordEmbed.embeds[0];
    
    // 从描述文本中解析数据
    const description = embed.description || '';
    const lines = description.split('\n');
    const extractedData = {};

    lines.forEach(line => {
      if (line.includes('用户:')) extractedData.username = line.split('用户:')[1]?.trim();
      if (line.includes('已运行时间:')) extractedData.play_duration = line.split('已运行时间:')[1]?.trim();
      if (line.includes('当前金额:')) extractedData.current_balance = parseInt(line.split('当前金额:')[1]?.trim().replace(/,/g, '')) || 0;
      if (line.includes('本次变化:')) extractedData.current_change = line.split('本次变化:')[1]?.trim();
      if (line.includes('总计收益:')) extractedData.total_earnings = line.split('总计收益:')[1]?.trim();
      if (line.includes('平均速度:')) extractedData.average_speed = parseInt(line.split('平均速度:')[1]?.split('/')[0]?.trim().replace(/,/g, '')) || 0;
      if (line.includes('当前排名:')) extractedData.current_rank = line.split('当前排名:')[1]?.trim();
    });

    // 构建结构化数据
    const structuredData = {
      game: embed.title?.replace('游戏: ', '') || 'Driving Empire',
      username: extractedData.username,
      play_duration: extractedData.play_duration,
      current_balance: extractedData.current_balance,
      current_change: extractedData.current_change,
      total_earnings: extractedData.total_earnings,
      average_speed: extractedData.average_speed,
      current_rank: extractedData.current_rank,
      event_timestamp: embed.timestamp ? new Date(embed.timestamp).toISOString() : new Date().toISOString(),
      raw_data: discordEmbed
    };

    // 存入Supabase
    const { data, error } = await supabase
      .from('driving_empire_records')
      .insert([structuredData]);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Data processed successfully' });

  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
