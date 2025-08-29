export default function handler(req, res) {
  const { key } = req.query;

  if (!key) {
    return res.status(200).json({ success: false, msg: "没有提供卡密" });
  }

  // 🔐 这里存放有效的卡密（演示用明文，实际推荐存哈希）
  const validKeys = ["abc123", "ljx666", "testkey"];

  if (validKeys.includes(key)) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(200).json({ success: false, msg: "卡密错误" });
  }
}
