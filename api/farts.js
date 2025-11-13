import fetch from "node-fetch";

const API_SECRET = process.env.API_SECRET;
const ADMIN_KEY = process.env.ADMIN_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_FILE_PATH = process.env.GITHUB_FILE_PATH || "farts.json";

const SCALE = 1e5;

// --- Helpers for encoding/decoding ---
function coordToHex(lat, lng) {
  const latInt = Math.round(lat * SCALE);
  const lngInt = Math.round(lng * SCALE);
  return {
    hexLat: latInt.toString(16),
    hexLng: lngInt.toString(16),
  };
}

function hexToCoord(hexLat, hexLng) {
  const latInt = parseInt(hexLat, 16);
  const lngInt = parseInt(hexLng, 16);
  return {
    lat: latInt / SCALE,
    lng: lngInt / SCALE,
  };
}

async function parseBody(req) {
  if (req.body) {
    if (typeof req.body === "string") return JSON.parse(req.body);
    return req.body;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString();
  return JSON.parse(raw || "{}");
}

async function getFileInfo() {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );
  if (!res.ok) throw new Error("Failed to read GitHub farts.json");
  return await res.json();
}

async function updateFile(content, sha, message) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(JSON.stringify(content, null, 2)).toString(
          "base64"
        ),
        sha,
      }),
    }
  );
  if (!res.ok) throw new Error("Failed to update GitHub file");
  return await res.json();
}

export default async function handler(req, res) {
  const key = req.headers["x-api-key"];
  if (!key || key !== API_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    // Load file from GitHub
    const file = await getFileInfo();
    const existing = JSON.parse(
      Buffer.from(file.content, "base64").toString("utf8") || "[]"
    );

    // ✅ GET — fetch all farts
    if (req.method === "GET") {
      const decoded = existing
        .map((item) => {
          if (item.hexLat && item.hexLng) {
            const { lat, lng } = hexToCoord(item.hexLat, item.hexLng);
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
            return {
              lat: Math.round(lat * 10000) / 10000,
              lng: Math.round(lng * 10000) / 10000,
              accuracy: item.accuracy ?? null,
              source: item.source ?? "unknown",
              ts: item.ts ?? null,
            };
          }
          return item;
        })
        .filter(Boolean);

      return res.status(200).json(decoded);
    }

    // ✅ POST — save new fart
    if (req.method === "POST") {
      const newFart = await parseBody(req);
      if (typeof newFart.lat !== "number" || typeof newFart.lng !== "number") {
        return res.status(400).json({ error: "Invalid lat/lng" });
      }

      const { hexLat, hexLng } = coordToHex(newFart.lat, newFart.lng);
      const saved = {
        hexLat,
        hexLng,
        accuracy: newFart.accuracy ?? null,
        source: newFart.source ?? "gps",
        ts: newFart.ts ?? new Date().toISOString(),
      };

      const updated = [...existing, saved];
      await updateFile(
        updated,
        file.sha,
        `💨 New fart at ${new Date().toISOString()}`
      );

      return res.status(200).json({ ok: true });
    }

    // ✅ DELETE — admin only
    if (req.method === "DELETE") {
      const adminHeader = req.headers["x-admin-key"];
      if (!adminHeader || adminHeader !== ADMIN_KEY) {
        return res.status(403).json({ error: "Admin key required" });
      }

      await updateFile([], file.sha, "🧹 Cleared all farts");
      console.log("🧹 All farts cleared by admin");
      return res.status(200).json({ ok: true, message: "All farts cleared" });
    }

    // Default
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("💩 API error:", err);
    res.status(500).json({ error: "Failed to process fart" });
  }
}
