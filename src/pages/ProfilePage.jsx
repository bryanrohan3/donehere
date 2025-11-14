// Updated ProfilePage.jsx with interactive layout improvements
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

  // Streaks
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // UI tabs
  const [activeTab, setActiveTab] = useState("overview");

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
        calculateStreaks(mine);
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
      } else break;
    }

    const todayMidnight = new Date().setHours(0, 0, 0, 0);
    if (uniqueDays[0] !== todayMidnight) streak = 0;

    setCurrentStreak(streak);
    setLongestStreak(best);
  }

  function filteredFarts() {
    if (timeRange === "all") return farts;

    const now = Date.now();
    const ms = {
      day: 86400000,
      week: 604800000,
      month: 2592000000,
      year: 31536000000,
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

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "streaks", label: "Streaks" },
    { id: "achievements", label: "Achievements" },
    { id: "history", label: "Fart History" },
  ];

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
          {/* Tabs */}
          <div className="flex justify-center gap-3 mb-6">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all shadow-sm ${
                  activeTab === t.id
                    ? "bg-amber-500 text-white border-amber-600"
                    : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="bg-white rounded-3xl p-6 shadow-md border mb-6">
              <div className="text-4xl mb-2 text-center">👤</div>
              <h2 className="text-xl font-bold text-center">{myUsername}</h2>
              <p className="text-center text-neutral-600 mb-4">
                Level {level} — {xp} XP
              </p>

              <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-green-400 h-3 transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* STREAKS TAB */}
          {activeTab === "streaks" && (
            <div className="bg-white border rounded-3xl p-6 shadow-md mb-6">
              <h3 className="text-lg font-semibold text-green-700 mb-2">
                🔥 Daily Fart Streak
              </h3>
              <p>
                Current streak: <strong>{currentStreak}</strong> day(s)
              </p>
              <p>
                Longest streak: <strong>{longestStreak}</strong> day(s)
              </p>
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab === "achievements" && (
            <div className="bg-white border rounded-3xl p-6 shadow-md mb-6">
              <h3 className="text-lg font-semibold text-amber-700 mb-3">
                🏆 Achievements
              </h3>
              {achievements.length === 0 ? (
                <p className="text-neutral-500 text-sm">No achievements yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {achievements.map((a, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-sm rounded-full bg-amber-100 text-amber-800 border"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <>
              <div className="flex justify-center gap-2 mb-4">
                {Object.keys(rangeLabels).map((key) => (
                  <button
                    key={key}
                    onClick={() => setTimeRange(key)}
                    className={`px-3 py-1 rounded-full border text-sm ${
                      timeRange === key
                        ? "bg-amber-500 text-white border-amber-600"
                        : "bg-white text-neutral-600 border-neutral-300"
                    }`}
                  >
                    {rangeLabels[key]}
                  </button>
                ))}
              </div>

              <div className="bg-white border rounded-3xl p-6 shadow-md">
                <h2 className="text-lg font-semibold mb-4">
                  💨 Fart Log ({rangeLabels[timeRange]})
                </h2>
                {filteredFarts().length === 0 ? (
                  <p className="text-neutral-500 text-sm text-center">
                    No farts recorded.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {filteredFarts().map((f, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl border bg-neutral-50 hover:bg-amber-50 transition flex justify-between"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {f.source === "gps" ? "📍 GPS fart" : "🌍 IP fart"}
                          </p>
                          <p className="text-xs text-neutral-500">
                            Lat: {f.lat.toFixed(4)}, Lng: {f.lng.toFixed(4)}
                          </p>
                          {f.description && (
                            <p className="italic text-xs mt-1">
                              “{f.description}”
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500">
                          {timeAgo(f.ts)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
