// api/farts.js
import fs from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data", "farts.json");

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const json = fs.readFileSync(dataPath, "utf8");
      const data = JSON.parse(json);
      res.status(200).json(data);
    } catch (e) {
      res.status(500).json({ error: "Failed to load farts" });
    }
  } else if (req.method === "POST") {
    try {
      const bodyChunks = [];
      for await (const chunk of req) bodyChunks.push(chunk);
      const rawBody = Buffer.concat(bodyChunks).toString();
      const newFart = JSON.parse(rawBody);

      const existing = JSON.parse(fs.readFileSync(dataPath, "utf8"));
      existing.push(newFart);
      fs.writeFileSync(dataPath, JSON.stringify(existing, null, 2));

      res.status(200).json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to save fart" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
