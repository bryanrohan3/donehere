import React from "react";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-amber-700 mb-4">About</h1>

      <p className="text-neutral-700 mb-4 leading-relaxed">
        <strong>I Farted Here</strong> is a simple location-based app where
        users can drop a “fart” at their current position and view farts placed
        by others around the world. Each fart includes location data, a
        timestamp, and your chosen username.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-amber-600">
        Features
      </h2>
      <ul className="list-disc pl-6 text-neutral-700 space-y-2">
        <li>
          <strong>Global Map:</strong> Displays all recorded farts across the
          world.
        </li>
        <li>
          <strong>Fart Cooldown:</strong> Limits how often you can place a fart
          in the same location to prevent spam.
        </li>
        <li>
          <strong>Device Identity:</strong> Each device has its own unique ID so
          your farts stay linked to you without needing an account.
        </li>
        <li>
          <strong>Username System:</strong> Choose and update your username at
          any time — it appears beside your farts on the map and leaderboard.
        </li>
        <li>
          <strong>Leaderboard:</strong> Tracks users with the most farts
          overall.
        </li>
        <li>
          <strong>Hot Zones:</strong> Highlights areas with recent fart activity
          over the past 24 hours.
        </li>
        <li>
          <strong>Stats Page:</strong> Shows total farts, username rankings, and
          recent activity summaries.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-amber-600">
        Privacy
      </h2>
      <p className="text-neutral-700 mb-4 leading-relaxed">
        No personal information is collected or stored. Your device ID and
        username exist only in your local browser storage. Clearing your browser
        data resets your identity and history.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2 text-amber-600">Data</h2>
      <p className="text-neutral-700 leading-relaxed">
        Each fart is stored as a simple record containing its coordinates,
        timestamp, and username. All data is public and updated in real time.
      </p>
    </div>
  );
}
