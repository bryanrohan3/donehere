import React, { useState, useEffect } from "react";
import axios from "axios";

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const COORD_THRESHOLD = 0.0005; // about 50m

export default function FartPage() {
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [puff, setPuff] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // --- Helper: check cooldown ---
  function checkCooldown(lat, lng) {
    const last = JSON.parse(localStorage.getItem("lastFart") || "{}");
    if (!last.ts) return false; // no previous fart

    const elapsed = Date.now() - last.ts;
    if (elapsed < COOLDOWN_MS) {
      const dist = Math.sqrt(
        Math.pow(lat - last.lat, 2) + Math.pow(lng - last.lng, 2)
      );
      if (dist < COORD_THRESHOLD) {
        setCooldownRemaining(COOLDOWN_MS - elapsed);
        return true; // still cooling down nearby
      }
    }
    return false;
  }

  // --- Helper: format remaining time ---
  function formatTime(ms) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // --- API call ---
  async function sendFart(lat, lng, accuracy, source = "gps") {
    const payload = {
      lat,
      lng,
      accuracy,
      source,
      ts: new Date().toISOString(),
    };
    await axios.post("/api/farts", payload, {
      headers: {
        "x-api-key": import.meta.env.VITE_API_SECRET,
      },
    });
  }

  // --- Main report function ---
  async function reportFart() {
    setStatus("");
    if (!navigator.geolocation) {
      setStatus("❌ Geolocation not supported by your device.");
      return;
    }

    setSending(true);
    setPuff(true);

    // Try GPS
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;

        if (checkCooldown(lat, lng)) {
          setStatus(
            `🕒 Slow down! You can fart again in ${formatTime(
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
      async (err) => {
        setStatus("⚠️ Location failed. Try again or allow permissions.");
        console.warn(err);
        setSending(false);
        setTimeout(() => setPuff(false), 400);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }

  // --- Countdown updater ---
  useEffect(() => {
    const timer = setInterval(() => {
      const last = JSON.parse(localStorage.getItem("lastFart") || "{}");
      if (last.ts) {
        const elapsed = Date.now() - last.ts;
        if (elapsed < COOLDOWN_MS) {
          setCooldownRemaining(COOLDOWN_MS - elapsed);
        } else {
          setCooldownRemaining(0);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

      {/* Status bubble */}
      {status && (
        <div className="mt-8 bg-white/90 border border-amber-200 text-neutral-700 text-sm py-3 px-5 rounded-2xl shadow-md max-w-xs text-center animate-fade-in">
          {status}
        </div>
      )}

      {/* Cooldown timer */}
      {cooldownRemaining > 0 && (
        <p className="mt-4 text-xs text-neutral-500">
          ⏳ You can fart again in {formatTime(cooldownRemaining)}
        </p>
      )}

      <p className="mt-10 text-xs text-neutral-500 text-center max-w-xs">
        Your approximate coordinates are shared publicly. Please fart
        responsibly 😎
      </p>
    </div>
  );
}
