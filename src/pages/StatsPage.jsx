import React, { useEffect, useState } from "react";
import axios from "axios";

export default function StatsPage() {
  const [farts, setFarts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [myUsername, setMyUsername] = useState("");
  const [myCount, setMyCount] = useState(0);

  useEffect(() => {
    const savedUsername =
      localStorage.getItem("fartUsername") || "Anonymous Farter 💨";
    setMyUsername(savedUsername);

    async function fetchFarts() {
      try {
        const res = await axios.get("/api/farts", {
          headers: {
            "x-api-key": import.meta.env.VITE_API_SECRET,
          },
        });
        const data = res.data || [];

        const sorted = data
          .filter((f) => f.ts)
          .sort((a, b) => new Date(b.ts) - new Date(a.ts));

        setFarts(sorted);
        setFiltered(sorted);
        updateLeaderboard(sorted, savedUsername);
      } catch (err) {
        console.error("Failed to load farts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFarts();
  }, []);

  function updateLeaderboard(list, username) {
    const counts = {};
    list.forEach((f) => {
      const user = f.username || "Anonymous Farter 💨";
      counts[user] = (counts[user] || 0) + 1;
    });

    const lb = Object.entries(counts)
      .map(([username, count]) => ({ username, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setLeaderboard(lb);
    setMyCount(counts[username] || 0);
  }

  function timeAgo(ts) {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function filterByRange(range) {
    const now = Date.now();
    let cutoff = 0;
    if (range === "day") cutoff = now - 24 * 60 * 60 * 1000;
    if (range === "week") cutoff = now - 7 * 24 * 60 * 60 * 1000;
    if (range === "month") cutoff = now - 30 * 24 * 60 * 60 * 1000;
    if (range === "year") cutoff = now - 365 * 24 * 60 * 60 * 1000;

    const filteredList =
      range === "all"
        ? farts
        : farts.filter((f) => new Date(f.ts).getTime() >= cutoff);

    setFiltered(filteredList);
    updateLeaderboard(filteredList, myUsername);
    setTimeRange(range);
  }

  const rangeLabels = {
    day: "Today",
    week: "This Week",
    month: "This Month",
    year: "This Year",
    all: "All Time",
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-amber-700 mb-4">Fart Stats 💨</h1>

      {loading ? (
        <p className="text-neutral-500">Loading farts...</p>
      ) : (
        <>
          {/* --- My Info --- */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-center">
            <p className="text-lg font-semibold text-green-700">
              You are <span className="font-bold">{myUsername}</span>
            </p>
            <p className="text-sm text-neutral-600">
              Total farts ({rangeLabels[timeRange].toLowerCase()}):{" "}
              <span className="text-green-800 font-bold">{myCount}</span>
            </p>
          </div>

          {/* --- Time Filter Buttons --- */}
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {Object.keys(rangeLabels).map((key) => (
              <button
                key={key}
                onClick={() => filterByRange(key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                  timeRange === key
                    ? "bg-amber-400 border-amber-500 text-white"
                    : "bg-white border-neutral-200 text-neutral-600 hover:bg-amber-50"
                }`}
              >
                {rangeLabels[key]}
              </button>
            ))}
          </div>

          {/* --- Leaderboard --- */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <h2 className="text-lg font-semibold text-amber-700 mb-2">
              🏆 Top Farters ({rangeLabels[timeRange]})
            </h2>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-neutral-500">No farts yet!</p>
            ) : (
              <ul className="divide-y divide-amber-100">
                {leaderboard.map((entry, i) => (
                  <li
                    key={i}
                    className="py-2 flex justify-between items-center text-sm"
                  >
                    <span>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "💨"}{" "}
                      {entry.username}
                    </span>
                    <span className="font-bold text-amber-700">
                      {entry.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* --- Recent Farts --- */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm mb-4">
            <h2 className="text-lg font-semibold text-neutral-700 mb-3">
              🕒 Most Recent Farts ({rangeLabels[timeRange]})
            </h2>
            <div className="flex flex-col gap-3">
              {filtered.slice(0, 10).map((f, i) => (
                <div
                  key={i}
                  className="border border-neutral-200 rounded-xl p-4 shadow-sm flex justify-between bg-white/90"
                >
                  <div>
                    <div className="text-sm text-neutral-700">
                      {f.username || "Anonymous Farter 💨"}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {f.source === "gps" ? "📍 GPS" : "🌍 IP"} fart — Lat:{" "}
                      {f.lat.toFixed(4)}, Lng: {f.lng.toFixed(4)}
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
          </div>
        </>
      )}
    </div>
  );
}
