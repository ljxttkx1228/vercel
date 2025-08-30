import fetch from "node-fetch";

export default async function handler(req, res) {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const file = process.env.GITHUB_FILE;
  const url = `https://api.github.com/repos/${repo}/contents/${file}`;
  const headers = { Authorization: `token ${token}` };

  const ghRes = await fetch(url, { headers });
  const ghData = await ghRes.json();
  const content = Buffer.from(ghData.content, "base64").toString();
  const db = JSON.parse(content);

  res.json(db.users);
}