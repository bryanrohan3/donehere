import React, { useState, useEffect } from "react";
import axios from "axios";
import { getIdentity, setUsername } from "../utils/identity";

const COOLDOWN_MS = 5 * 60 * 1000; // 5 mins
const COORD_THRESHOLD = 0.0005; // ~50m

export default function FartPage() {
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [puff, setPuff] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [username, setUser] = useState("");
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const { username } = getIdentity();
    setUser(username);
  }, []);

  function checkCooldown(lat, lng) {
    const last = JSON.parse(localStorage.getItem("lastFart") || "{}");
    if (!last.ts) return false;
    const elapsed = Date.now() - last.ts;
    if (elapsed < COOLDOWN_MS) {
      const dist = Math.sqrt(
        Math.pow(lat - last.lat, 2) + Math.pow(lng - last.lng, 2)
      );
      if (dist < COORD_THRESHOLD) {
        setCooldownRemaining(COOLDOWN_MS - elapsed);
        return true;
      }
    }
    return false;
  }

  function formatTime(ms) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  async function sendFart(lat, lng, accuracy, source = "gps") {
    const { deviceId, username } = getIdentity();
    const payload = {
      lat,
      lng,
      accuracy,
      source,
      ts: new Date().toISOString(),
      deviceId,
      username,
    };

    await axios.post("/api/farts", payload, {
      headers: { "x-api-key": import.meta.env.VITE_API_SECRET },
    });
  }

  async function reportFart() {
    setStatus("");
    if (!navigator.geolocation) {
      setStatus("❌ Geolocation not supported.");
      return;
    }

    setSending(true);
    setPuff(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;

        if (checkCooldown(lat, lng)) {
          setStatus(
            `🕒 Hold it! You can fart again in ${formatTime(
              cooldownRemaining
            )}.`
          );
          setSending(false);
          setTimeout(() => setPuff(false), 400);
          return;
        }

        try {
          await sendFart(lat, lng, accuracy, "gps");
          localStorage.setItem(
            "lastFart",
            JSON.stringify({ lat, lng, ts: Date.now() })
          );
          if (navigator.vibrate) navigator.vibrate(80);
          setStatus("💨 Your fart has been immortalized on the map!");
        } catch (err) {
          console.error(err);
          setStatus("⚠️ Failed to record fart — try again.");
        } finally {
          setSending(false);
          setTimeout(() => setPuff(false), 400);
        }
      },
      () => {
        setStatus("⚠️ Location failed or denied.");
        setSending(false);
        setTimeout(() => setPuff(false), 400);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const last = JSON.parse(localStorage.getItem("lastFart") || "{}");
      if (last.ts) {
        const elapsed = Date.now() - last.ts;
        setCooldownRemaining(elapsed < COOLDOWN_MS ? COOLDOWN_MS - elapsed : 0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function handleSaveUsername() {
    if (setUsername(newName)) {
      setUser(newName);
      setEditing(false);
      setNewName("");
    } else {
      alert("Invalid name. Must be 3+ characters.");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-amber-100 via-yellow-50 to-green-100 px-6 relative overflow-hidden">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-amber-700 drop-shadow-sm">
          I Farted Here 💨
        </h1>
        <p className="mt-2 text-neutral-600 text-sm">
          Press the poo to leave your mark on the map.
        </p>
      </div>

      <button
        onClick={reportFart}
        disabled={sending || cooldownRemaining > 0}
        className={`relative flex items-center justify-center text-[5rem] md:text-[6rem] rounded-full bg-gradient-to-b from-amber-300 to-amber-200 shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:scale-110 active:scale-95 transition-all duration-200 ${
          sending || cooldownRemaining > 0
            ? "opacity-70 cursor-not-allowed"
            : ""
        }`}
        style={{ width: "180px", height: "180px" }}
      >
        💩
        {puff && (
          <span className="absolute -top-10 text-4xl animate-puff">💨</span>
        )}
      </button>

      {status && (
        <div className="mt-8 bg-white/90 border border-amber-200 text-neutral-700 text-sm py-3 px-5 rounded-2xl shadow-md max-w-xs text-center animate-fade-in">
          {status}
        </div>
      )}

      {cooldownRemaining > 0 && (
        <p className="mt-4 text-xs text-neutral-500">
          ⏳ You can fart again in {formatTime(cooldownRemaining)}
        </p>
      )}

      {/* Username section */}
      <div className="mt-8 text-center">
        {editing ? (
          <div className="flex flex-col items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="border rounded-full px-3 py-1 text-sm"
              placeholder="Enter new fart name..."
            />
            <button
              onClick={handleSaveUsername}
              className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm"
            >
              Save
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-600">
              You are <strong>{username}</strong> 💨
            </p>
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-amber-600 underline mt-1"
            >
              Change name
            </button>
          </>
        )}
      </div>

      <p className="mt-10 text-xs text-neutral-500 text-center max-w-xs">
        Your approximate coordinates are public. Please fart responsibly 😎
      </p>
    </div>
  );
}
