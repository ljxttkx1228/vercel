import fetch from "node-fetch";

export default async function handler(req, res) {
  // 👇 如果是 GET 请求，直接返回提示信息
  if (req.method === "GET") {
    return res.status(200).json({ message: "API 正常工作" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持 POST 请求" });
  }

  const { deviceId, model, days } = req.body;
  if (!deviceId || !days) {
    return res.status(400).json({ error: "缺少参数" });
  }

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const file = process.env.GITHUB_FILE;
  const url = `https://api.github.com/repos/${repo}/contents/${file}`;
  const headers = { Authorization: `token ${token}` };

  const ghRes = await fetch(url, { headers });
  const ghData = await ghRes.json();
  const content = Buffer.from(ghData.content, "base64").toString();
  const db = JSON.parse(content);

  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + parseInt(days));
  const user = {
    deviceId,
    model: model || "未知设备",
    expire: expireDate.toISOString(),
    lastOpen: null,
    ip: null
  };

  const idx = db.users.findIndex(u => u.deviceId === deviceId);
  if (idx >= 0) {
    db.users[idx] = user;
  } else {
    db.users.push(user);
  }

  const newContent = Buffer.from(JSON.stringify(db, null, 2)).toString("base64");
  await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: "add auth",
      content: newContent,
      sha: ghData.sha
    })
  });

  res.json({ success: true, user });
}
