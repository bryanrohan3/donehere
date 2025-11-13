import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import L from "leaflet";

// --- Fit bounds to all farts (fallback) ---
function FitBounds({ farts }) {
  const map = useMap();
  useEffect(() => {
    if (farts.length) {
      const bounds = L.latLngBounds(farts.map((f) => [f.lat, f.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [farts, map]);
  return null;
}

// --- Zoom + movement watcher ---
function ZoomWatcher({ onZoomChange }) {
  useMapEvents({
    zoomend: (e) => onZoomChange(e.target.getZoom(), e.target.getBounds()),
    moveend: (e) => onZoomChange(e.target.getZoom(), e.target.getBounds()),
  });
  return null;
}

// --- Helper: convert hex coordinates ---
const SCALE = 1e5;
function hexToCoord(hexLat, hexLng) {
  const latInt = parseInt(hexLat, 16);
  const lngInt = parseInt(hexLng, 16);
  return { lat: latInt / SCALE, lng: lngInt / SCALE };
}

// --- Helper: cluster nearby farts ---
function findHotZones(farts, threshold = 0.01, minClusterSize = 3) {
  const clusters = [];
  const visited = new Set();

  for (let i = 0; i < farts.length; i++) {
    if (visited.has(i)) continue;
    const cluster = [farts[i]];
    visited.add(i);

    for (let j = i + 1; j < farts.length; j++) {
      if (visited.has(j)) continue;
      const dx = farts[i].lat - farts[j].lat;
      const dy = farts[i].lng - farts[j].lng;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < threshold) {
        cluster.push(farts[j]);
        visited.add(j);
      }
    }

    if (cluster.length >= minClusterSize) {
      const avgLat = cluster.reduce((s, f) => s + f.lat, 0) / cluster.length;
      const avgLng = cluster.reduce((s, f) => s + f.lng, 0) / cluster.length;
      clusters.push({ lat: avgLat, lng: avgLng, count: cluster.length });
    }
  }

  return clusters;
}

// --- Center map on current location ---
function CenterOnUser({ setHasCentered }) {
  const map = useMap();
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 13); // 👈 zoom ~20 km radius
          setHasCentered(true);
        },
        () => setHasCentered(false),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [map, setHasCentered]);
  return null;
}

export default function MapPage() {
  const [farts, setFarts] = useState([]);
  const [hotZones, setHotZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [zoom, setZoom] = useState(2);
  const [hasCentered, setHasCentered] = useState(false);

  // Admin check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adminKey = params.get("admin");
    if (adminKey && adminKey === import.meta.env.VITE_ADMIN_KEY) {
      setIsAdmin(true);
    }
  }, []);

  // Load fart data
  useEffect(() => {
    let mounted = true;
    axios
      .get("/api/farts", {
        headers: { "x-api-key": import.meta.env.VITE_API_SECRET },
      })
      .then((r) => {
        if (!mounted) return;
        const now = Date.now();
        const last24h = 24 * 60 * 60 * 1000;

        let data = (r.data || []).map((f) => {
          if (f.hexLat && f.hexLng) {
            const { lat, lng } = hexToCoord(f.hexLat, f.hexLng);
            return { ...f, lat, lng };
          }
          return f;
        });

        setFarts(data);

        const recent = data.filter(
          (f) => now - new Date(f.ts).getTime() <= last24h
        );
        setHotZones(findHotZones(recent));
        setLoading(false);
      })
      .catch((e) => {
        console.error("Failed to fetch farts:", e);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Admin: clear all
  async function resetFarts() {
    if (!confirm("Are you sure you want to delete all farts? 💨")) return;
    try {
      const res = await fetch("/api/farts", {
        method: "DELETE",
        headers: {
          "x-api-key": import.meta.env.VITE_API_SECRET,
          "x-admin-key": import.meta.env.VITE_ADMIN_KEY,
        },
      });
      if (res.ok) {
        alert("🧹 All farts cleared!");
        setFarts([]);
        setHotZones([]);
      } else {
        alert("❌ Failed to clear farts.");
      }
    } catch (err) {
      console.error(err);
      alert("Error while clearing farts.");
    }
  }

  const center = farts.length ? [farts[0].lat, farts[0].lng] : [20, 0];

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <div className="bg-white p-3 rounded-2xl shadow-md">
        {loading ? (
          <div className="p-10 text-center">Loading map entries…</div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold">💨 Global Fart Map</h2>
              <span className="text-gray-600">
                Total farts: <strong>{farts.length}</strong>
              </span>
            </div>

            <MapContainer
              className="z-0"
              center={center}
              zoom={2}
              style={{ height: "70vh", width: "100%" }}
              scrollWheelZoom
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Try to center on user; fallback to FitBounds if not */}
              {!hasCentered && <FitBounds farts={farts} />}
              <CenterOnUser setHasCentered={setHasCentered} />

              <ZoomWatcher
                onZoomChange={(z, bounds) => {
                  setZoom(z);
                  const visibleFarts = farts.filter((f) =>
                    bounds.contains([f.lat, f.lng])
                  );
                  const now = Date.now();
                  const last24h = 24 * 60 * 60 * 1000;
                  const recentVisible = visibleFarts.filter(
                    (f) => now - new Date(f.ts).getTime() <= last24h
                  );
                  setHotZones(findHotZones(recentVisible));
                }}
              />

              {/* 💩 Individual Farts */}
              {farts.map((f, i) => (
                <CircleMarker
                  key={i}
                  center={[f.lat, f.lng]}
                  radius={6}
                  pathOptions={{
                    color: "#facc15",
                    fillColor: "#facc15",
                    fillOpacity: 0.6,
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div>
                        <strong>Recorded:</strong>{" "}
                        {new Date(f.ts).toLocaleString()}
                      </div>
                      <div>
                        <strong>Accuracy (m):</strong> {f.accuracy ?? "n/a"}
                      </div>
                      <div>
                        <strong>Source:</strong> {f.source ?? "unknown"}
                      </div>
                      <div>
                        <strong>Farter:</strong> {f.username ?? "Anonymous"} 💨
                      </div>
                      {f.description && (
                        <div className="mt-1 italic text-neutral-600">
                          “{f.description}”
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* 🔥 Active Hot Zones */}
              {hotZones.map((zone, i) => (
                <CircleMarker
                  key={`zone-${i}`}
                  center={[zone.lat, zone.lng]}
                  radius={Math.max(5, zone.count * 2 * (zoom / 6))}
                  pathOptions={{
                    color: "#dc2626",
                    fillColor: "#f87171",
                    fillOpacity: 0.3,
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div className="text-sm font-semibold text-red-700">
                      🔥 Active Fart Zone (last 24h)
                      <br />
                      <span className="text-xs text-neutral-600">
                        {zone.count} recent farts nearby
                      </span>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>

            {isAdmin && (
              <div className="mt-4 text-center">
                <button
                  onClick={resetFarts}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full transition"
                >
                  🧹 Clear All Farts (Admin)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
