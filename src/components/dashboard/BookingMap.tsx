"use client";

import { useEffect } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

/** Leaflet care-site map. Client-only — import via next/dynamic with ssr:false. */
export default function BookingMap({
  lat,
  lng,
  radiusM,
  className,
}: {
  lat: number;
  lng: number;
  radiusM?: number;
  className?: string;
}) {
  return (
    <div
      className={
        className ??
        "h-56 w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)]"
      }
    >
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full min-h-[14rem] w-full"
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter lat={lat} lng={lng} />
        {typeof radiusM === "number" && radiusM > 0 ? (
          <Circle
            center={[lat, lng]}
            radius={radiusM}
            pathOptions={{
              color: "var(--primary)",
              fillColor: "var(--primary)",
              fillOpacity: 0.12,
              weight: 2,
            }}
          />
        ) : null}
        <CircleMarker
          center={[lat, lng]}
          radius={8}
          pathOptions={{
            color: "var(--primary)",
            fillColor: "var(--primary)",
            fillOpacity: 0.95,
            weight: 2,
          }}
        />
      </MapContainer>
    </div>
  );
}
