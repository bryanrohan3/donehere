import React from "react";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-amber-700 mb-4">About 💨</h1>
      <p className="text-neutral-700 mb-4 leading-relaxed">
        <strong>I Farted Here</strong> is the world's most sophisticated
        geolocation-based flatulence tracker. No logins, no data mining — just
        you, your device, and your farts. 🌎💨
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-amber-600">
        🗺️ Features
      </h2>
      <ul className="list-disc pl-6 text-neutral-700 space-y-2">
        <li>
          <strong>Global Fart Map:</strong> See all recorded farts around the
          world in real-time.
        </li>
        <li>
          <strong>Fart Cooldown:</strong> Prevents spamming — you can only fart
          once every few minutes per location.
        </li>
        <li>
          <strong>Device-Based Identity:</strong> Each device gets a unique fart
          identity, so your farts are always *yours* (without needing an
          account).
        </li>
        <li>
          <strong>Username Customization:</strong> Choose your farting alias
          (like “WildGoose24” or “TootLord420”).
        </li>
        <li>
          <strong>Fart Leaderboard:</strong> Compete to become the top farter
          globally or locally.
        </li>
        <li>
          <strong>Hot Zones:</strong> View areas with recent fart activity in
          the last 24 hours — a true methane hotspot.
        </li>
        <li>
          <strong>Stats Page:</strong> Track total farts, your username’s
          history, and other fun analytics.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-amber-600">
        🔒 Privacy
      </h2>
      <p className="text-neutral-700 mb-4 leading-relaxed">
        We don’t collect personal info. Your “device identity” is just a random
        local code stored in your browser. No cookies, no trackers — only farts.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-amber-600">
        💡 Fun Facts
      </h2>
      <ul className="list-disc pl-6 text-neutral-700 space-y-2">
        <li>
          Each fart is timestamped and geo-tagged, then stored on GitHub — a
          truly decentralized gas record.
        </li>
        <li>
          Your username and streak are stored locally, so clearing your browser
          data also clears your fart identity (RIP your legacy).
        </li>
      </ul>
    </div>
  );
}
