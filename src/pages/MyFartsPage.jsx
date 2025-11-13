import React, { useEffect, useState } from "react";
import axios from "axios";
import { getIdentity } from "../utils/identity";

export default function MyFartsPage() {
  const [myFarts, setMyFarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const { deviceId, username } = getIdentity();
    setUsername(username);

    async function fetchMyFarts() {
      try {
        const res = await axios.get("/api/farts", {
          headers: { "x-api-key": import.meta.env.VITE_API_SECRET },
        });

        const all = res.data || [];
        const mine = all
          .filter((f) => f.deviceId === deviceId)
          .sort((a, b) => new Date(b.ts) - new Date(a.ts));

        setMyFarts(mine);
      } catch (err) {
        console.error("Failed to load your farts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMyFarts();
  }, []);

  // Format date (same fun format as StatsPage)
  function formatFartDate(ts) {
    const date = new Date(ts);
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear().toString().slice(2);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";

    return `${day}${suffix} ${month} ${year}' @ ${hours}:${minutes}${ampm}`;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-amber-700 mb-4">My Farts 💨</h1>

      {loading ? (
        <p className="text-neutral-500">Loading your farts...</p>
      ) : myFarts.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
          <p className="text-yellow-700 font-medium">
            You haven’t farted yet! 😳
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {myFarts.map((f, i) => (
            <div
              key={i}
              className="rounded-xl p-4 border bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="text-sm font-semibold text-neutral-800">
                {username}
              </div>
              <div className="text-xs text-neutral-600 mt-0.5">
                {f.source === "gps" ? "📍 GPS" : "🌍 IP"} fart —{" "}
                <span className="font-mono">
                  Lat: {f.lat.toFixed(4)}, Lng: {f.lng.toFixed(4)}
                </span>
              </div>
              {f.description && (
                <div className="text-sm italic text-neutral-700 mt-2 leading-snug">
                  “{f.description}”
                </div>
              )}
              <div className="text-xs text-neutral-500 text-right mt-2">
                {formatFartDate(f.ts)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
