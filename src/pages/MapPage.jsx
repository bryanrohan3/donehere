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

export default function MapPage() {
  const [farts, setFarts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    axios
      .get("/api/farts")
      .then((r) => {
        if (mounted) {
          setFarts(r.data || []);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error(e);
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
