// /frontend/api/farts.js
import fs from "fs";
import path from "path";

const tempPath = path.join("/tmp", "farts.json");

// Helper to safely parse body in Vercel serverless
async function parseBody(req) {
  if (req.body) {
    // Some environments (like Vercel) give a string body directly
    if (typeof req.body === "string") return JSON.parse(req.body);
    // Or already-parsed JSON
    return req.body;
  }

  // Local Node dev (body stream)
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString();
  return JSON.parse(raw || "{}");
}

export default async function handler(req, res) {
  try {
    if (!fs.existsSync(tempPath)) {
      fs.writeFileSync(tempPath, "[]", "utf8");
    }

    if (req.method === "GET") {
      const data = JSON.parse(fs.readFileSync(tempPath, "utf8"));
      res.status(200).json(data);
    } else if (req.method === "POST") {
      const newFart = await parseBody(req);
      const existing = JSON.parse(fs.readFileSync(tempPath, "utf8"));
      existing.push(newFart);
      fs.writeFileSync(tempPath, JSON.stringify(existing, null, 2));
      res.status(200).json({ ok: true });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    console.error("💩 API error:", err);
    res.status(500).json({ error: "Failed to process fart" });
  }
}
