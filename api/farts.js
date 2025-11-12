// api/farts.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const filePath = path.join(process.cwd(), "data", "farts.json");

  if (req.method === "GET") {
    try {
      const json = fs.readFileSync(filePath, "utf8");
      res.status(200).json(JSON.parse(json));
    } catch (err) {
      console.error("GET /api/farts error:", err);
      res.status(500).json({ error: "Failed to load farts" });
    }
  } else if (req.method === "POST") {
    try {
      const body = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => resolve(JSON.parse(data)));
        req.on("error", reject);
      });

      const farts = JSON.parse(fs.readFileSync(filePath, "utf8"));
      farts.push(body);
      fs.writeFileSync(filePath, JSON.stringify(farts, null, 2));

      res.status(200).json({ ok: true });
    } catch (err) {
      console.error("POST /api/farts error:", err);
      res.status(500).json({ error: "Failed to save fart" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
