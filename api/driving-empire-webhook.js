import { createClient } from '@supabase/supabase-js'

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  console.log('🚗 收到 Driving Empire Webhook 请求')
  
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 只处理 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: '只允许 POST 请求' 
    })
  }

  try {
    const rawData = req.body
    console.log('📨 原始请求数据:', JSON.stringify(rawData, null, 2))

    // 检查是否是 Discord Embed 格式
    if (!rawData.embeds || !Array.isArray(rawData.embeds) || rawData.embeds.length === 0) {
      console.warn('⚠️ 数据格式不符合 Discord Embed 标准')
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Discord Embed format: missing embeds array' 
      })
    }

    const embed = rawData.embeds[0]
    console.log('🔍 Embed 数据:', {
      title: embed.title,
      description: embed.description?.substring(0, 100) + '...',
      fields_count: embed.fields?.length || 0
    })

    // 从描述文本中解析数据
    const description = embed.description || ''
    const lines = description.split('\n')
    const extractedData = {}

    console.log('📝 开始解析描述文本...')
    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      console.log(`  行 ${index}: ${trimmedLine}`)
      
      if (trimmedLine.includes('用户:')) {
        extractedData.username = trimmedLine.split('用户:')[1]?.trim()
        console.log(`  ✅ 提取用户名: ${extractedData.username}`)
      } else if (trimmedLine.includes('已运行时间:')) {
        extractedData.play_duration = trimmedLine.split('已运行时间:')[1]?.trim()
        console.log(`  ✅ 提取运行时间: ${extractedData.play_duration}`)
      } else if (trimmedLine.includes('当前金额:')) {
        const amountText = trimmedLine.split('当前金额:')[1]?.trim()
        extractedData.current_balance = parseInt(amountText?.replace(/,/g, '')) || 0
        console.log(`  ✅ 提取当前金额: ${extractedData.current_balance}`)
      } else if (trimmedLine.includes('本次变化:')) {
        extractedData.current_change = trimmedLine.split('本次变化:')[1]?.trim()
        console.log(`  ✅ 提取本次变化: ${extractedData.current_change}`)
      } else if (trimmedLine.includes('总计收益:')) {
        extractedData.total_earnings = trimmedLine.split('总计收益:')[1]?.trim()
        console.log(`  ✅ 提取总计收益: ${extractedData.total_earnings}`)
      } else if (trimmedLine.includes('平均速度:')) {
        const speedText = trimmedLine.split('平均速度:')[1]?.split('/')[0]?.trim()
        extractedData.average_speed = parseInt(speedText?.replace(/,/g, '')) || 0
        console.log(`  ✅ 提取平均速度: ${extractedData.average_speed}`)
      } else if (trimmedLine.includes('当前排名:')) {
        extractedData.current_rank = trimmedLine.split('当前排名:')[1]?.trim()
        console.log(`  ✅ 提取当前排名: ${extractedData.current_rank}`)
      } else if (trimmedLine.includes('下次通知')) {
        extractedData.next_notification = trimmedLine.split('下次通知')[1]?.replace(':', '')?.trim()
        console.log(`  ✅ 提取下次通知: ${extractedData.next_notification}`)
      } else if (trimmedLine.includes('作者:')) {
        extractedData.author = trimmedLine.split('作者:')[1]?.trim()
        console.log(`  ✅ 提取作者: ${extractedData.author}`)
      }
    })

    // 从标题提取游戏信息
    if (embed.title) {
      const gameMatch = embed.title.match(/游戏: (.+)/)
      extractedData.game = gameMatch ? gameMatch[1] : embed.title
      console.log(`  ✅ 提取游戏: ${extractedData.game}`)
    }

    // 构建结构化数据
    const structuredData = {
      // 基础信息
      game: extractedData.game || 'Driving Empire',
      username: extractedData.username || '未知用户',
      
      // 时间信息
      play_duration: extractedData.play_duration,
      play_duration_seconds: durationToSeconds(extractedData.play_duration),
      event_timestamp: embed.timestamp ? new Date(embed.timestamp).toISOString() : new Date().toISOString(),
      
      // 金额数据
      current_balance: extractedData.current_balance || 0,
      current_change: extractedData.current_change,
      current_change_amount: extractNumberFromChange(extractedData.current_change),
      total_earnings: extractedData.total_earnings,
      total_earnings_amount: extractNumberFromChange(extractedData.total_earnings),
      
      // 性能数据
      average_speed: extractedData.average_speed || 0,
      current_rank: extractedData.current_rank || '未知',
      
      // 其他信息
      next_notification: extractedData.next_notification,
      author: extractedData.author,
      embed_color: embed.color,
      
      // 原始数据备份
      raw_description: description,
      raw_data: rawData,
      processed_at: new Date().toISOString()
    }

    console.log('✅ 解析完成的结构化数据:', JSON.stringify(structuredData, null, 2))

    // 验证必要字段
    if (!structuredData.username || structuredData.username === '未知用户') {
      throw new Error('无法解析用户名')
    }

    // 保存到 Supabase 数据库
    console.log('💾 开始保存到数据库...')
    const { data: dbResult, error: dbError } = await supabase
      .from('driving_empire_records')
      .insert([structuredData])
      .select() // 返回插入的数据

    if (dbError) {
      console.error('❌ 数据库保存失败:', dbError)
      throw new Error(`数据库错误: ${dbError.message}`)
    }

    console.log('✅ 数据保存成功，记录ID:', dbResult?.[0]?.id)

    // 返回成功响应
    const response = {
      success: true,
      message: 'Driving Empire 数据处理成功',
      data: {
        username: structuredData.username,
        game: structuredData.game,
        balance: structuredData.current_balance,
        record_id: dbResult?.[0]?.id
      },
      processed_at: new Date().toISOString()
    }

    console.log('🎉 Webhook 处理完成')
    res.status(200).json(response)

  } catch (error) {
    console.error('💥 Webhook 处理错误:', error)
    
    // 返回错误响应（但状态码为200，避免Roblox重试）
    res.status(200).json({
      success: false,
      error: error.message,
      received_data: req.body ? '数据已接收' : '无数据',
      note: '错误已记录，请求被接受以避免重试'
    })
  }
}

// 辅助函数：将时间字符串转换为秒数
function durationToSeconds(duration) {
  if (!duration) return 0
  
  try {
    // 匹配 "02小时30分01秒" 格式
    const parts = duration.match(/(\d+)小时(\d+)分(\d+)秒/)
    if (parts) {
      const hours = parseInt(parts[1])
      const minutes = parseInt(parts[2])
      const seconds = parseInt(parts[3])
      return hours * 3600 + minutes * 60 + seconds
    }
    
    // 匹配 "02:30:01" 格式
    const simpleParts = duration.match(/(\d+):(\d+):(\d+)/)
    if (simpleParts) {
      const hours = parseInt(simpleParts[1])
      const minutes = parseInt(simpleParts[2])
      const seconds = parseInt(simpleParts[3])
      return hours * 3600 + minutes * 60 + seconds
    }
    
    return 0
  } catch (error) {
    console.warn('⏰ 时间格式解析失败:', duration)
    return 0
  }
}

// 辅助函数：从变化字符串中提取数字
function extractNumberFromChange(changeText) {
  if (!changeText) return 0
  
  try {
    // 匹配 "+286,809" 或 "-150" 等格式
    const numberMatch = changeText.replace(/,/g, '').match(/[+-]?\d+/)
    return numberMatch ? parseInt(numberMatch[0]) : 0
  } catch (error) {
    console.warn('🔢 数字提取失败:', changeText)
    return 0
  }
}
