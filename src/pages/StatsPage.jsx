import React, { useEffect, useState } from "react";
import axios from "axios";
import { getIdentity } from "../utils/identity";
import { useNavigate } from "react-router-dom";

export default function StatsPage() {
  const [farts, setFarts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [myUsername, setMyUsername] = useState("");
  const [myDeviceId, setMyDeviceId] = useState("");
  const [myCount, setMyCount] = useState(0);

  const navigate = useNavigate();

  // ⭐ When you click a fart → open map centered on that fart
  function goToMapForFart(f) {
    navigate(`/map?lat=${f.lat}&lng=${f.lng}&zoom=15`);
  }

  useEffect(() => {
    const { username, deviceId } = getIdentity();
    setMyUsername(username);
    setMyDeviceId(deviceId);

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
        updateLeaderboard(sorted, deviceId, username);
      } catch (err) {
        console.error("Failed to load farts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFarts();
  }, []);

  function updateLeaderboard(list, deviceId, username) {
    const deviceMap = {};
    list.forEach((f) => {
      if (!f.deviceId) return;
      if (!deviceMap[f.deviceId]) {
        deviceMap[f.deviceId] = { username: f.username, count: 0 };
      }
      deviceMap[f.deviceId].count++;
    });

    if (deviceMap[deviceId]) {
      deviceMap[deviceId].username = username;
    }

    const lb = Object.entries(deviceMap)
      .map(([id, info]) => ({ username: info.username, count: info.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setLeaderboard(lb);
    setMyCount(deviceMap[deviceId]?.count || 0);
  }

  function timeAgo(ts) {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

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
    updateLeaderboard(filteredList, myDeviceId, myUsername);
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
          {/* Your Stats */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-center shadow-sm">
            <p className="text-lg font-semibold text-green-700">
              You are <span className="font-bold">{myUsername}</span>
            </p>
            <p className="text-sm text-neutral-600">
              Total farts ({rangeLabels[timeRange].toLowerCase()}):{" "}
              <span className="text-green-800 font-bold">{myCount}</span>
            </p>
          </div>

          {/* Time Range Buttons */}
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {Object.keys(rangeLabels).map((key) => (
              <button
                key={key}
                onClick={() => filterByRange(key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  timeRange === key
                    ? "bg-amber-400 border-amber-500 text-white shadow"
                    : "bg-white border-neutral-200 text-neutral-600 hover:bg-amber-50"
                }`}
              >
                {rangeLabels[key]}
              </button>
            ))}
          </div>

          {/* Leaderboard */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold text-amber-700 mb-3">
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

          {/* Most Recent Farts */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-md mb-4">
            <h2 className="text-lg font-semibold text-neutral-700 mb-4">
              🕒 Most Recent Farts ({rangeLabels[timeRange]})
            </h2>
            <div className="flex flex-col gap-4">
              {filtered.slice(0, 10).map((f, i) => {
                const isMine = f.deviceId === myDeviceId;

                return (
                  <div
                    key={i}
                    onClick={() => goToMapForFart(f)}
                    className={`cursor-pointer rounded-xl p-4 border transition-all shadow-sm hover:shadow-lg hover:scale-[1.01] flex flex-col sm:flex-row justify-between gap-2 ${
                      isMine
                        ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
                        : "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-neutral-800">
                        {isMine ? `${myUsername} (you)` : f.username}
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
                    </div>

                    <div className="text-xs text-neutral-500 text-right min-w-[130px]">
                      {timeAgo(f.ts)}
                      <br />
                      <span className="text-[11px] block font-medium text-neutral-600">
                        {formatFartDate(f.ts)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
