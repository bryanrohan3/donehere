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

function ZoomWatcher({ onZoomChange }) {
  useMapEvents({
    zoomend: (e) => onZoomChange(e.target.getZoom(), e.target.getBounds()),
    moveend: (e) => onZoomChange(e.target.getZoom(), e.target.getBounds()),
  });
  return null;
}

const SCALE = 1e5;
function hexToCoord(hexLat, hexLng) {
  const latInt = parseInt(hexLat, 16);
  const lngInt = parseInt(hexLng, 16);
  return { lat: latInt / SCALE, lng: lngInt / SCALE };
}

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

// ⭐ NEW: center map on URL-coordinates if provided
function CenterToURL({ target }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    const { lat, lng, zoom } = target;
    map.setView([lat, lng], zoom, { animate: true });
  }, [target, map]);

  return null;
}

export default function MapPage() {
  const [farts, setFarts] = useState([]);
  const [hotZones, setHotZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [zoom, setZoom] = useState(2);

  const url = new URL(window.location.href);
  const targetLat = url.searchParams.get("lat");
  const targetLng = url.searchParams.get("lng");
  const targetZoom = parseInt(url.searchParams.get("zoom"), 10) || 15;

  const jumpTarget =
    targetLat && targetLng
      ? {
          lat: parseFloat(targetLat),
          lng: parseFloat(targetLng),
          zoom: targetZoom,
        }
      : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adminKey = params.get("admin");
    if (adminKey && adminKey === import.meta.env.VITE_ADMIN_KEY) {
      setIsAdmin(true);
    }
  }, []);

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
              center={[20, 0]}
              zoom={5}
              style={{ height: "70vh", width: "100%", zIndex: 10 }}
              scrollWheelZoom
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* NEW: Jump to clicked fart */}
              <CenterToURL target={jumpTarget} />

              <ZoomWatcher
                onZoomChange={(z, bounds) => {
                  setZoom(z);
                  const visible = farts.filter((f) =>
                    bounds.contains([f.lat, f.lng])
                  );

                  const now = Date.now();
                  const last24h = 24 * 60 * 60 * 1000;

                  const recentVisible = visible.filter(
                    (f) => now - new Date(f.ts).getTime() <= last24h
                  );

                  setHotZones(findHotZones(recentVisible));
                }}
              />

              {farts.map((f, i) => (
                <CircleMarker
                  key={i}
                  center={[f.lat, f.lng]}
                  radius={
                    jumpTarget?.lat === f.lat && jumpTarget?.lng === f.lng
                      ? 12
                      : 6
                  }
                  pathOptions={{
                    color:
                      jumpTarget?.lat === f.lat && jumpTarget?.lng === f.lng
                        ? "#22c55e"
                        : "#facc15",
                    fillColor:
                      jumpTarget?.lat === f.lat && jumpTarget?.lng === f.lng
                        ? "#22c55e"
                        : "#facc15",
                    fillOpacity: jumpTarget ? 0.9 : 0.6,
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div>
                        <strong>Recorded:</strong>{" "}
                        {new Date(f.ts).toLocaleString()}
                      </div>
                      <div>
                        <strong>Accuracy:</strong> {f.accuracy ?? "n/a"}
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
