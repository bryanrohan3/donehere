import React, { useEffect, useState } from "react";
import axios from "axios";
import { getIdentity } from "../utils/identity";

export default function ProfilePage() {
  const [farts, setFarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myUsername, setMyUsername] = useState("");
  const [myDeviceId, setMyDeviceId] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    const { username, deviceId } = getIdentity();
    setMyUsername(username);
    setMyDeviceId(deviceId);

    async function fetchFarts() {
      try {
        const res = await axios.get("/api/farts", {
          headers: { "x-api-key": import.meta.env.VITE_API_SECRET },
        });
        const data = res.data || [];
        const mine = data
          .filter((f) => f.deviceId === deviceId)
          .sort((a, b) => new Date(b.ts) - new Date(a.ts));
        setFarts(mine);
        calculateXP(mine);
      } catch (err) {
        console.error("Failed to load farts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFarts();
  }, []);

  function calculateXP(mine) {
    let xpTotal = 0;
    const achievementsList = [];
    const uniqueCountries = new Set();

    // fake country from coords (just for concept)
    mine.forEach((f, i) => {
      xpTotal += 10; // per fart
      if (i === 0) xpTotal += 50; // first fart bonus
      const latBand = Math.floor(f.lat);
      const lngBand = Math.floor(f.lng);
      const countryKey = `${latBand}-${lngBand}`;
      if (!uniqueCountries.has(countryKey)) {
        uniqueCountries.add(countryKey);
        xpTotal += 100;
        achievementsList.push(`💨 New region reached (${latBand},${lngBand})`);
      }
    });

    // milestones
    if (mine.length >= 10) achievementsList.push("🔥 10 Farts Club!");
    if (mine.length >= 50) achievementsList.push("💀 Legendary Farters Guild");
    if (mine.length >= 100)
      achievementsList.push("🌎 Farted Around the World!");

    const levelNum = Math.floor(xpTotal / 200) + 1;
    setXp(xpTotal);
    setLevel(levelNum);
    setAchievements(achievementsList);
  }

  function filterByRange(range) {
    setTimeRange(range);
  }

  function filteredFarts() {
    if (timeRange === "all") return farts;
    const now = Date.now();
    const ms = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    }[timeRange];
    return farts.filter((f) => new Date(f.ts).getTime() >= now - ms);
  }

  function timeAgo(ts) {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function formatDate(ts) {
    const d = new Date(ts);
    const day = d.getDate();
    const month = d.toLocaleString("default", { month: "long" });
    const year = String(d.getFullYear()).slice(-2);
    const hour = d.getHours() % 12 || 12;
    const min = String(d.getMinutes()).padStart(2, "0");
    const ampm = d.getHours() >= 12 ? "PM" : "AM";
    const suffix = ["th", "st", "nd", "rd"][
      day % 10 > 3 || Math.floor(day / 10) === 1 ? 0 : day % 10
    ];
    return `${day}${suffix} ${month} ${year}' @ ${hour}:${min}${ampm}`;
  }

  const rangeLabels = {
    day: "Today",
    week: "This Week",
    month: "This Month",
    year: "This Year",
    all: "All Time",
  };

  const progress = ((xp % 200) / 200) * 100;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-amber-700 mb-4">My Profile 💨</h1>

      {loading ? (
        <p className="text-neutral-500">Loading profile...</p>
      ) : (
        <>
          {/* XP / Level */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-green-700">
              {myUsername}
            </h2>
            <p className="text-sm text-neutral-600 mb-2">
              Level {level} — {xp} XP
            </p>
            <div className="w-full bg-neutral-200 rounded-full h-3">
              <div
                className="bg-amber-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 shadow-sm">
              <h3 className="text-lg font-semibold text-amber-700 mb-2">
                🏆 Achievements
              </h3>
              <ul className="list-disc ml-5 text-sm text-neutral-700">
                {achievements.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Filter Buttons */}
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

          {/* Fart History */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm mb-4">
            <h2 className="text-lg font-semibold text-neutral-700 mb-3">
              💨 My Fart Log ({rangeLabels[timeRange]})
            </h2>
            <div className="flex flex-col gap-3">
              {filteredFarts().length === 0 ? (
                <p className="text-sm text-neutral-500">No farts yet!</p>
              ) : (
                filteredFarts().map((f, i) => (
                  <div
                    key={i}
                    className="border border-neutral-200 rounded-xl p-4 shadow-sm flex justify-between bg-white/90 hover:bg-amber-50/40 transition-all"
                  >
                    <div>
                      <div className="text-sm text-neutral-700">
                        {f.source === "gps" ? "📍 GPS" : "🌍 IP"} fart
                      </div>
                      <div className="text-xs text-neutral-500">
                        Lat: {f.lat.toFixed(4)}, Lng: {f.lng.toFixed(4)}
                      </div>
                      {f.description && (
                        <div className="text-xs italic text-neutral-600 mt-1">
                          “{f.description}”
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 text-right">
                      {timeAgo(f.ts)}
                      <br />
                      <span className="text-[10px]">{formatDate(f.ts)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
