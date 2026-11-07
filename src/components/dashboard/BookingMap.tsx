"use client";

import { useEffect } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

function MapClickPicker({
  onPick,
}: {
  onPick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!onPick) return;
      onPick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

/** Leaflet care-site map. Client-only — import via next/dynamic with ssr:false. */
export default function BookingMap({
  lat,
  lng,
  radiusM,
  className,
  onLocationChange,
}: {
  lat: number;
  lng: number;
  radiusM?: number;
  className?: string;
  /** Tap/click map to set care GPS (mobile-friendly). */
  onLocationChange?: (lat: number, lng: number) => void;
}) {
  return (
    <div
      className={
        className ??
        "h-44 w-full touch-pan-y overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] sm:h-56"
      }
    >
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full min-h-[11rem] w-full sm:min-h-[14rem]"
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter lat={lat} lng={lng} />
        <MapClickPicker onPick={onLocationChange} />
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
          eventHandlers={
            onLocationChange
              ? {
                  click: (e) => {
                    e.originalEvent?.stopPropagation?.();
                  },
                }
              : undefined
          }
        />
      </MapContainer>
    </div>
  );
}
