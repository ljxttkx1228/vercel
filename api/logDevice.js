import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { deviceId, model, ip, lastOpen } = req.body;
  if (!deviceId) return res.status(400).json({ error: "缺少 deviceId" });

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const file = process.env.GITHUB_FILE;
  const url = `https://api.github.com/repos/${repo}/contents/${file}`;
  const headers = { Authorization: `token ${token}` };

  // 获取 data.json
  const ghRes = await fetch(url, { headers });
  const ghData = await ghRes.json();
  const content = Buffer.from(ghData.content, "base64").toString();
  const db = JSON.parse(content);

  // 只记录设备信息，不修改授权状态
  const idx = db.users.findIndex(u => u.deviceId === deviceId);
  if (idx >= 0) {
    db.users[idx].lastOpen = lastOpen;
    db.users[idx].ip = ip;
    db.users[idx].model = model;
  } else {
    db.users.push({ deviceId, model, ip, lastOpen, expire: null });
  }

  const newContent = Buffer.from(JSON.stringify(db, null, 2)).toString("base64");
  await fetch(url, { method: "PUT", headers, body: JSON.stringify({ message: "log device info", content: newContent, sha: ghData.sha }) });

  res.json({ success: true });
}