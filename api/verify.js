// api/checkKey.js
import { json } from '@vercel/node';

const validKeys = ["abc123", "xyz789"]; // 这里存哈希更安全

export default function handler(req, res) {
    const { key } = req.query; // 接收 ?key=xxxx
    if (!key) return res.status(400).json({ success: false, msg: "没有卡密" });

    // 检查卡密是否在列表中
    if (validKeys.includes(key)) {
        res.status(200).json({ success: true });
    } else {
        res.status(200).json({ success: false, msg: "卡密错误" });
    }
}
