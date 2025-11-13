import React, { useEffect, useState } from "react";
import axios from "axios";

export default function StatsPage() {
  const [farts, setFarts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFarts() {
      try {
        const res = await axios.get("/api/farts", {
          headers: {
            "x-api-key": import.meta.env.VITE_API_SECRET,
          },
        });
        const data = res.data || [];
        // Sort by timestamp descending
        const sorted = data
          .filter((f) => f.ts)
          .sort((a, b) => new Date(b.ts) - new Date(a.ts));
        setFarts(sorted);
      } catch (err) {
        console.error("Failed to load farts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFarts();
  }, []);

  function timeAgo(ts) {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-amber-700 mb-4">Fart Stats 💨</h1>

      {loading ? (
        <p className="text-neutral-500">Loading farts...</p>
      ) : (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <p className="text-lg font-semibold">
              Total farts recorded:{" "}
              <span className="text-amber-700">{farts.length}</span>
            </p>
            <p className="text-sm text-neutral-500">
              Showing {Math.min(farts.length, 10)} most recent farts
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {farts.slice(0, 10).map((f, i) => (
              <div
                key={i}
                className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex justify-between"
              >
                <div>
                  <div className="text-sm text-neutral-700">
                    {f.source === "gps" ? "📍 GPS" : "🌍 IP"} fart
                  </div>
                  <div className="text-xs text-neutral-500">
                    Lat: {f.lat.toFixed(4)}, Lng: {f.lng.toFixed(4)}
                  </div>
                </div>
                <div className="text-xs text-neutral-500 text-right">
                  {timeAgo(f.ts)}
                  <br />
                  <span className="text-[10px]">
                    {new Date(f.ts).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
