import React, { useState, useEffect } from "react";
import axios from "axios";

export default function FartPage() {
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [puff, setPuff] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const COOLDOWN_MINUTES = 5;

  // 🔢 Haversine distance in meters
  function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // 🕓 Check cooldown validity
  function canFartHere(lat, lng) {
    const last = JSON.parse(localStorage.getItem("lastFart") || "{}");
    if (!last.time || !last.lat || !last.lng) return true;

    const elapsed = (Date.now() - last.time) / 1000 / 60;
    const distance = getDistanceFromLatLonInM(lat, lng, last.lat, last.lng);

    if (elapsed < COOLDOWN_MINUTES && distance < 100) {
      const minsLeft = (COOLDOWN_MINUTES - elapsed).toFixed(1);
      setStatus(`😤 Too soon! Wait ${minsLeft} min before farting nearby.`);
      return false;
    }
    return true;
  }

  // 🔄 Start countdown display
  useEffect(() => {
    const last = JSON.parse(localStorage.getItem("lastFart") || "{}");
    if (last.time) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - last.time) / 1000 / 60;
        const left = Math.max(0, COOLDOWN_MINUTES - elapsed);
        setCooldown(left > 0 ? Math.ceil(left * 60) : 0); // seconds
      }, 1000);
      return () => clearInterval(interval);
    }
  }, []);

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

  async function reportFart() {
    setStatus("");

    if (!navigator.geolocation) {
      setStatus("❌ Geolocation not supported by your device.");
      return;
    }

    setSending(true);
    setPuff(true);

    const fallbackLocation = async () => {
      try {
        setStatus("🌍 Using approximate IP location...");
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();

        if (data && data.latitude && data.longitude) {
          if (!canFartHere(data.latitude, data.longitude)) {
            setSending(false);
            setPuff(false);
            return;
          }
          await sendFart(data.latitude, data.longitude, 10000, "ip");
          localStorage.setItem(
            "lastFart",
            JSON.stringify({
              lat: data.latitude,
              lng: data.longitude,
              time: Date.now(),
            })
          );
          setStatus("💨 Fart added using IP-based location!");
        } else throw new Error("Invalid IP geolocation response");
      } catch (err) {
        console.error("Fallback failed:", err);
        setStatus("⚠️ Couldn’t determine location even via fallback.");
      } finally {
        setSending(false);
        setTimeout(() => setPuff(false), 500);
      }
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (!canFartHere(latitude, longitude)) {
          setSending(false);
          setPuff(false);
          return;
        }

        try {
          await sendFart(latitude, longitude, accuracy, "gps");
          localStorage.setItem(
            "lastFart",
            JSON.stringify({ lat: latitude, lng: longitude, time: Date.now() })
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
      async (err) => {
        console.warn("Geolocation failed:", err);
        if (err.code === 2) await fallbackLocation();
        else if (err.code === 1) setStatus("🚫 Location permission denied.");
        else setStatus("⚠️ Location error — please retry.");
        setSending(false);
        setTimeout(() => setPuff(false), 500);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }

  const seconds = cooldown % 60;
  const minutes = Math.floor(cooldown / 60);

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
        disabled={sending || cooldown > 0}
        className={`relative flex items-center justify-center text-[5rem] md:text-[6rem] rounded-full bg-gradient-to-b from-amber-300 to-amber-200 shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:scale-110 active:scale-95 transition-all duration-200 ${
          sending || cooldown > 0 ? "opacity-70 cursor-not-allowed" : ""
        }`}
        style={{
          width: "180px",
          height: "180px",
        }}
      >
        {cooldown > 0 ? (
          <span className="text-2xl text-neutral-700">
            ⏳ {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        ) : (
          "💩"
        )}
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
