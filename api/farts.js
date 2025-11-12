import fs from "fs";
import path from "path";

const tempPath = path.join("/tmp", "farts.json");

export default async function handler(req, res) {
  try {
    if (!fs.existsSync(tempPath)) fs.writeFileSync(tempPath, "[]", "utf8");

    if (req.method === "GET") {
      const data = JSON.parse(fs.readFileSync(tempPath, "utf8"));
      res.status(200).json(data);
    } else if (req.method === "POST") {
      const body = await new Response(req.body).json();
      const data = JSON.parse(fs.readFileSync(tempPath, "utf8"));
      data.push(body);
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
      res.status(200).json({ ok: true });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
