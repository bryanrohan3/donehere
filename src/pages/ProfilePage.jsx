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

  // ⭐ STREAK SYSTEM STATE
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

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
        calculateStreaks(mine); // ⭐ NEW
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

    mine.forEach((f, i) => {
      xpTotal += 10;
      if (i === 0) xpTotal += 50;

      const latBand = Math.floor(f.lat);
      const lngBand = Math.floor(f.lng);
      const countryKey = `${latBand}-${lngBand}`;
      if (!uniqueCountries.has(countryKey)) {
        uniqueCountries.add(countryKey);
        xpTotal += 100;
        achievementsList.push(`💨 New region reached (${latBand},${lngBand})`);
      }
    });

    if (mine.length >= 10) achievementsList.push("🔥 10 Farts Club!");
    if (mine.length >= 50) achievementsList.push("💀 Legendary Farters Guild");
    if (mine.length >= 100)
      achievementsList.push("🌎 Farted Around the World!");

    const levelNum = Math.floor(xpTotal / 200) + 1;
    setXp(xpTotal);
    setLevel(levelNum);
    setAchievements(achievementsList);
  }

  // ⭐ NEW: STREAK CALCULATION
  function calculateStreaks(mine) {
    if (mine.length === 0) {
      setCurrentStreak(0);
      setLongestStreak(0);
      return;
    }

    const days = mine.map((f) => new Date(f.ts).setHours(0, 0, 0, 0));

    const uniqueDays = [...new Set(days)].sort((a, b) => b - a);

    let streak = 1;
    let best = 1;

    for (let i = 0; i < uniqueDays.length - 1; i++) {
      const today = uniqueDays[i];
      const next = uniqueDays[i + 1];

      const diff = (today - next) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        streak++;
        best = Math.max(best, streak);
      } else {
        break; // streak broken
      }
    }

    // Check if they farted today
    const todayMidnight = new Date().setHours(0, 0, 0, 0);
    if (uniqueDays[0] !== todayMidnight) {
      streak = 0; // streak expired
    }

    setCurrentStreak(streak);
    setLongestStreak(best);
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
      <h1 className="text-3xl font-extrabold text-amber-700 mb-6 text-center">
        💨 My Profile
      </h1>

      {loading ? (
        <p className="text-center text-neutral-500 animate-pulse">
          Loading your legendary stats...
        </p>
      ) : (
        <>
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-amber-100 to-green-100 rounded-3xl p-6 mb-8 shadow-md border border-amber-200 text-center">
            <div className="text-4xl mb-2">👤</div>
            <h2 className="text-xl font-bold text-neutral-800">{myUsername}</h2>
            <p className="text-sm text-neutral-600 mt-1">
              Level {level} — {xp} XP
            </p>

            {/* Progress bar */}
            <div className="w-full bg-neutral-200 rounded-full h-3 mt-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 to-emerald-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* ⭐ NEW: STREAK BLOCK */}
          <div className="bg-white border border-green-200 rounded-2xl p-5 mb-8 shadow-sm">
            <h3 className="text-lg font-semibold text-green-700 mb-2 flex items-center gap-1">
              🔥 Daily Fart Streak
            </h3>

            <p className="text-neutral-700 text-sm">
              Current streak:{" "}
              <span className="font-bold text-green-700">{currentStreak}</span>{" "}
              day{currentStreak !== 1 ? "s" : ""}
            </p>

            <p className="text-neutral-700 text-sm mt-1">
              Longest streak:{" "}
              <span className="font-bold text-green-700">{longestStreak}</span>{" "}
              day{longestStreak !== 1 ? "s" : ""}
            </p>

            {currentStreak === 0 && (
              <p className="text-xs text-neutral-500 mt-2 italic">
                No fart yet today — don’t break the chain! 💨
              </p>
            )}

            {currentStreak > 0 && (
              <p className="text-xs text-neutral-500 mt-2 italic">
                Keep going! Every day strengthens your legacy.
              </p>
            )}
          </div>

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="bg-white border border-amber-200 rounded-2xl p-5 mb-8 shadow-sm">
              <h3 className="text-lg font-semibold text-amber-700 mb-3 flex items-center gap-1">
                🏆 Achievements
              </h3>
              <div className="flex flex-wrap gap-2">
                {achievements.map((a, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-sm rounded-full bg-amber-100 text-amber-800 border border-amber-200"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex justify-center flex-wrap gap-2 mb-8">
            {Object.keys(rangeLabels).map((key) => (
              <button
                key={key}
                onClick={() => setTimeRange(key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                  timeRange === key
                    ? "bg-amber-500 border-amber-600 text-white shadow"
                    : "bg-white border-neutral-200 text-neutral-600 hover:bg-amber-50"
                }`}
              >
                {rangeLabels[key]}
              </button>
            ))}
          </div>

          {/* Fart History */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-md">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">
              💨 Fart Log ({rangeLabels[timeRange]})
            </h2>
            {filteredFarts().length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-6">
                No farts yet — get out there and make history!
              </p>
            ) : (
              <div className="grid gap-3">
                {filteredFarts().map((f, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 hover:bg-amber-50/60 transition-all flex justify-between items-start"
                  >
                    <div>
                      <div className="text-sm font-medium text-neutral-800">
                        {f.source === "gps" ? "📍 GPS fart" : "🌍 IP fart"}
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
                    <div className="text-right text-xs text-neutral-500">
                      {timeAgo(f.ts)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
