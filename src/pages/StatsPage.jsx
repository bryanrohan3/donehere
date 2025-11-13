import React, { useEffect, useState } from "react";
import axios from "axios";

export default function StatsPage() {
  const [farts, setFarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countryStats, setCountryStats] = useState({});
  const [openSection, setOpenSection] = useState("recent");

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

        // Derive country stats
        await generateCountryStats(sorted);
      } catch (err) {
        console.error("Failed to load farts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFarts();
  }, []);

  async function generateCountryStats(fartList) {
    const cache = {};
    const counts = {};

    for (const f of fartList) {
      const key = `${f.lat.toFixed(1)},${f.lng.toFixed(1)}`;
      if (cache[key]) continue;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${f.lat}&lon=${f.lng}&zoom=3&addressdetails=1`,
          { headers: { "User-Agent": "ifartedhere.app" } }
        );
        const data = await res.json();
        const country = data.address?.country || "Unknown";
        cache[key] = country;
      } catch {
        cache[key] = "Unknown";
      }
    }

    // Count occurrences by country
    for (const key in cache) {
      const country = cache[key];
      counts[country] = (counts[country] || 0) + 1;
    }

    setCountryStats(counts);
  }

  function timeAgo(ts) {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-amber-700 mb-6">Fart Stats 💨</h1>

      {loading ? (
        <p className="text-neutral-500">Loading farts...</p>
      ) : (
        <>
          {/* Total */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            <p className="text-lg font-semibold">
              Total farts recorded:{" "}
              <span className="text-amber-700">{farts.length}</span>
            </p>
          </div>

          {/* Dropdown 1: Recent Farts */}
          <div className="mb-4">
            <button
              onClick={() =>
                setOpenSection(openSection === "recent" ? null : "recent")
              }
              className="w-full flex justify-between items-center bg-white border border-neutral-200 rounded-xl p-4 shadow-sm"
            >
              <span className="font-semibold">🕒 Recent Farts</span>
              <span>{openSection === "recent" ? "▲" : "▼"}</span>
            </button>
            {openSection === "recent" && (
              <div className="p-4 border-l border-r border-b border-neutral-200 bg-neutral-50 rounded-b-xl">
                {farts.slice(0, 10).map((f, i) => (
                  <div
                    key={i}
                    className="bg-white border border-neutral-200 rounded-xl p-3 shadow-sm flex justify-between mb-2"
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
            )}
          </div>

          {/* Dropdown 2: Countries */}
          <div>
            <button
              onClick={() =>
                setOpenSection(openSection === "countries" ? null : "countries")
              }
              className="w-full flex justify-between items-center bg-white border border-neutral-200 rounded-xl p-4 shadow-sm"
            >
              <span className="font-semibold">🌍 Countries Farted In</span>
              <span>{openSection === "countries" ? "▲" : "▼"}</span>
            </button>
            {openSection === "countries" && (
              <div className="p-4 border-l border-r border-b border-neutral-200 bg-neutral-50 rounded-b-xl">
                {Object.entries(countryStats).length === 0 ? (
                  <p className="text-neutral-500 text-sm">
                    Gathering country data...
                  </p>
                ) : (
                  Object.entries(countryStats)
                    .sort((a, b) => b[1] - a[1])
                    .map(([country, count]) => (
                      <div
                        key={country}
                        className="flex justify-between text-sm bg-white border border-neutral-200 rounded-xl p-3 shadow-sm mb-2"
                      >
                        <span>{country}</span>
                        <span className="font-semibold text-amber-700">
                          {count}
                        </span>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
