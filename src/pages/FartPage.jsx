import React, { useState } from "react";
import axios from "axios";

export default function FartPage() {
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [puff, setPuff] = useState(false);

  async function sendFart(lat, lng, accuracy) {
    const payload = {
      lat,
      lng,
      accuracy,
      ts: new Date().toISOString(),
    };
    await axios.post("/api/farts", payload);
  }

  async function reportFart() {
    setStatus("");
    if (!navigator.geolocation) {
      setStatus("❌ Geolocation not supported by your device.");
      return;
    }

    setSending(true);
    setPuff(true);

    // First attempt
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await sendFart(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.accuracy
          );
          if (navigator.vibrate) navigator.vibrate(80);
          setStatus("💨 Your fart has been immortalized on the map!");
        } catch (e) {
          console.error(e);
          setStatus("⚠️ Failed to record fart — try again.");
        } finally {
          setSending(false);
          setTimeout(() => setPuff(false), 500);
        }
      },
      (err) => {
        console.warn("First geolocation attempt failed:", err);

        if (err.code === 2) {
          // Retry once with relaxed accuracy
          setStatus("📍 Retrying with relaxed GPS settings...");
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                await sendFart(
                  position.coords.latitude,
                  position.coords.longitude,
                  position.coords.accuracy
                );
                setStatus("✅ Got your location on retry! 💨");
              } catch (e) {
                console.error(e);
                setStatus("⚠️ Failed to record fart — try again.");
              } finally {
                setSending(false);
                setTimeout(() => setPuff(false), 500);
              }
            },
            (finalErr) => {
              console.error("Retry failed:", finalErr);
              setStatus(
                "📍 Still unavailable — try again outdoors or with GPS on."
              );
              setSending(false);
              setTimeout(() => setPuff(false), 500);
            },
            { enableHighAccuracy: false, timeout: 20000 }
          );
        } else if (err.code === 1) {
          setStatus(
            "🚫 Location permission denied. Please allow access and retry."
          );
          setSending(false);
          setTimeout(() => setPuff(false), 500);
        } else if (err.code === 3) {
          setStatus("⏳ Timed out while fetching location. Please try again.");
          setSending(false);
          setTimeout(() => setPuff(false), 500);
        } else {
          setStatus("⚠️ Unknown location error occurred.");
          setSending(false);
          setTimeout(() => setPuff(false), 500);
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
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

      {/* Main fart button */}
      <button
        onClick={reportFart}
        disabled={sending}
        className={`relative flex items-center justify-center text-[5rem] md:text-[6rem] rounded-full bg-gradient-to-b from-amber-300 to-amber-200 shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:scale-110 active:scale-95 transition-all duration-200 ${
          sending ? "opacity-70" : ""
        }`}
        style={{
          width: "180px",
          height: "180px",
        }}
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

      <p className="mt-10 text-xs text-neutral-500 text-center max-w-xs">
        Your approximate coordinates are shared publicly. Please fart
        responsibly 😎
      </p>
    </div>
  );
}
