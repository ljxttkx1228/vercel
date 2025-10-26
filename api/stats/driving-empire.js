import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  const { username } = req.query;

  try {
    let query = supabase
      .from('driving_empire_records')
      .select('*')
      .order('event_timestamp', { ascending: false });

    if (username) {
      query = query.eq('username', username);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: data,
      total: data.length
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
