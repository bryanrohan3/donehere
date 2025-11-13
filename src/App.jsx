import React from "react";
import { Routes, Route } from "react-router-dom";
import FartPage from "./pages/FartPage";
import MapPage from "./pages/MapPage";
import HamburgerNav from "./components/HamburgerNav";
import StatsPage from "./pages/StatsPage";
import AboutPage from "./pages/AboutPage";
import ProfilePage from "./pages/ProfilePage"; // ✅ updated import

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <HamburgerNav />
      <main className="p-4">
        <Routes>
          <Route path="/" element={<FartPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/profile" element={<ProfilePage />} />{" "}
        </Routes>
      </main>
    </div>
  );
}
