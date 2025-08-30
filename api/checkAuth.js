import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { deviceId, model, ip, lastOpen } = req.body;

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const file = process.env.GITHUB_FILE;
  const url = `https://api.github.com/repos/${repo}/contents/${file}`;
  const headers = { Authorization: `token ${token}` };

  const ghRes = await fetch(url, { headers });
  const ghData = await ghRes.json();
  const content = Buffer.from(ghData.content, "base64").toString();
  const db = JSON.parse(content);

  const user = db.users.find(u => u.deviceId === deviceId);
  let authorized = false;
  if (user && new Date(user.expire) > new Date()) {
    authorized = true;
    user.lastOpen = lastOpen;
    user.ip = ip;
    user.model = model;
  }

  const newContent = Buffer.from(JSON.stringify(db, null, 2)).toString("base64");
  await fetch(url, { method: "PUT", headers, body: JSON.stringify({ message: "update data.json", content: newContent, sha: ghData.sha }) });

  res.json({ authorized, user });
}