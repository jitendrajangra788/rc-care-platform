"use client";

import { useMemo, useState } from "react";
import type { Attendance, Booking } from "@/lib/types";
import { cn } from "@/lib/utils";

type TrailBooking = Pick<
  Booking,
  "id" | "patientName" | "lat" | "lng" | "geofenceRadiusM" | "address"
>;

export function GpsTrailMap({
  attendance,
  bookings,
  staffNameById,
}: {
  attendance: Attendance[];
  bookings: TrailBooking[];
  staffNameById: Record<string, string>;
}) {
  const bookingIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of attendance) ids.add(a.bookingId);
    for (const b of bookings) {
      if (typeof b.lat === "number" && typeof b.lng === "number") ids.add(b.id);
    }
    return [...ids];
  }, [attendance, bookings]);

  const [bookingId, setBookingId] = useState(bookingIds[0] || "");
  const booking = bookings.find((b) => b.id === bookingId);
  const points = useMemo(
    () =>
      attendance
        .filter((a) => a.bookingId === bookingId)
        .slice()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [attendance, bookingId],
  );

  if (!bookingIds.length) {
    return (
      <div className="rounded-2xl bg-paper-2 px-4 py-10 text-center text-sm text-ink-soft">
        GPS trail unlocks after staff mark attendance.
      </div>
    );
  }

  const siteLat = booking?.lat;
  const siteLng = booking?.lng;
  const radius = booking?.geofenceRadiusM || 250;

  const coords: { lat: number; lng: number; kind: "site" | "checkin"; label: string }[] = [];
  if (typeof siteLat === "number" && typeof siteLng === "number") {
    coords.push({ lat: siteLat, lng: siteLng, kind: "site", label: "Care site" });
  }
  for (const p of points) {
    coords.push({
      lat: p.lat,
      lng: p.lng,
      kind: "checkin",
      label: `${p.type} · ${new Date(p.createdAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    });
  }

  const lats = coords.map((c) => c.lat);
  const lngs = coords.map((c) => c.lng);
  const pad = 0.0015;
  const minLat = Math.min(...lats) - pad;
  const maxLat = Math.max(...lats) + pad;
  const minLng = Math.min(...lngs) - pad;
  const maxLng = Math.max(...lngs) + pad;
  const w = 640;
  const h = 360;

  function project(lat: number, lng: number) {
    const x = ((lng - minLng) / (maxLng - minLng || 1)) * (w - 40) + 20;
    const y = (1 - (lat - minLat) / (maxLat - minLat || 1)) * (h - 40) + 20;
    return { x, y };
  }

  const siteProj =
    typeof siteLat === "number" && typeof siteLng === "number"
      ? project(siteLat, siteLng)
      : null;

  // Approximate meters → SVG radius using mid-latitude scale
  const midLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos(midLat);
  const pxPerMLat = (h - 40) / ((maxLat - minLat) * metersPerDegLat || 1);
  const pxPerMLng = (w - 40) / ((maxLng - minLng) * metersPerDegLng || 1);
  const fenceRx = radius * pxPerMLng;
  const fenceRy = radius * pxPerMLat;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {bookingIds.map((id) => {
          const b = bookings.find((x) => x.id === id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => setBookingId(id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                bookingId === id ? "bg-ink text-white" : "bg-paper-2 text-ink-soft hover:bg-white",
              )}
            >
              {b?.patientName || id}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[#0b1c2a]">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="GPS trail">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1a3348" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={w} height={h} fill="#0b1c2a" />
          <rect width={w} height={h} fill="url(#grid)" />

          {siteProj ? (
            <ellipse
              cx={siteProj.x}
              cy={siteProj.y}
              rx={Math.max(fenceRx, 18)}
              ry={Math.max(fenceRy, 18)}
              fill="rgba(46, 184, 148, 0.12)"
              stroke="rgba(46, 184, 148, 0.55)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          ) : null}

          {points.length > 1 ? (
            <polyline
              fill="none"
              stroke="#5ba4d9"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={points.map((p) => {
                const { x, y } = project(p.lat, p.lng);
                return `${x},${y}`;
              }).join(" ")}
            />
          ) : null}

          {siteProj ? (
            <g>
              <circle cx={siteProj.x} cy={siteProj.y} r="8" fill="#2eb894" />
              <circle cx={siteProj.x} cy={siteProj.y} r="3.5" fill="#0b1c2a" />
            </g>
          ) : null}

          {points.map((p, i) => {
            const { x, y } = project(p.lat, p.lng);
            const evening = p.type === "evening" || p.type === "checkout";
            return (
              <g key={p.id}>
                <circle
                  cx={x}
                  cy={y}
                  r="7"
                  fill={evening ? "#f0b429" : "#5ba4d9"}
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <text
                  x={x + 10}
                  y={y + 4}
                  fill="#c9d7e3"
                  fontSize="11"
                  fontFamily="ui-sans-serif, system-ui"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <p className="text-xs text-ink-soft">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-mint align-middle" /> Care site
          · dashed ring = geofence (~{radius}m)
        </p>
        <p className="text-xs text-ink-soft">
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-sea align-middle" /> Morning
          · <span className="ml-1 inline-block h-2.5 w-2.5 rounded-full bg-[#f0b429] align-middle" />{" "}
          Evening
        </p>
      </div>

      {points.length === 0 ? (
        <p className="text-sm text-ink-soft">No check-ins for this booking yet.</p>
      ) : (
        <ul className="space-y-2">
          {points.map((p, i) => (
            <li
              key={p.id}
              className="flex items-start justify-between gap-2 rounded-xl bg-paper-2 px-3 py-2.5 text-sm"
            >
              <div>
                <p className="font-medium capitalize">
                  #{i + 1} · {p.type === "present" ? "morning" : p.type === "checkout" ? "evening" : p.type}
                  {p.gpsQuality ? ` · GPS ${p.gpsQuality}` : ""}
                </p>
                <p className="text-xs text-ink-soft">
                  {staffNameById[p.staffId] || p.staffId} · {p.lat.toFixed(5)}, {p.lng.toFixed(5)} ·{" "}
                  {Math.round(p.distanceMeters)}m from site
                </p>
              </div>
              <p className="shrink-0 text-xs text-ink-soft">
                {new Date(p.createdAt).toLocaleString("en-IN")}
              </p>
            </li>
          ))}
        </ul>
      )}

      {booking?.address ? (
        <p className="text-xs text-ink-soft">{booking.address}</p>
      ) : null}
    </div>
  );
}
