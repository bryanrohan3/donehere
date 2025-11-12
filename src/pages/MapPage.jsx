import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import L from "leaflet";

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

// --- Helpers for hex encoding ---
const SCALE = 1e5;
function hexToCoord(hexLat, hexLng) {
  const latInt = parseInt(hexLat, 16);
  const lngInt = parseInt(hexLng, 16);
  const lat = latInt / SCALE - 90;
  const lng = lngInt / SCALE - 180;
  return { lat, lng };
}

export default function MapPage() {
  const [farts, setFarts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    axios
      .get("/api/farts", {
        headers: {
          // ✅ Must include API key to access protected API route
          "x-api-key": import.meta.env.VITE_API_SECRET,
        },
      })
      .then((r) => {
        if (!mounted) return;
        let data = r.data || [];

        // Decode hex coordinates if needed
        data = data.map((f) => {
          if (f.hexLat && f.hexLng) {
            const { lat, lng } = hexToCoord(f.hexLat, f.hexLng);
            return { ...f, lat, lng };
          }
          return f;
        });

        console.log("Fetched farts:", data); // 🧩 Debugging output
        setFarts(data);
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

  const center = farts.length ? [farts[0].lat, farts[0].lng] : [20, 0];

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <div className="bg-white p-3 rounded-2xl shadow-md">
        {loading ? (
          <div className="p-10 text-center">Loading map entries…</div>
        ) : (
          <MapContainer
            center={center}
            zoom={farts.length ? 13 : 2}
            style={{ height: "70vh", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
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
                  </div>
                </Popup>
              </CircleMarker>
            ))}
            <FitBounds farts={farts} />
          </MapContainer>
        )}
      </div>
    </div>
  );
}
