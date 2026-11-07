/** Haversine distance in meters */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Old Roshan_HCMS used a fixed 500m care-site radius */
export const DEFAULT_GEOFENCE_M = 500;
/** Reject when horizontal accuracy worse than this (meters), unless demo mode */
export const WEAK_GPS_M = 120;
/** Impossible travel threshold */
export const JUMP_DISTANCE_M = 40000;
export const JUMP_WINDOW_MS = 15 * 60 * 1000;

export function gpsQuality(accuracy?: number): "good" | "ok" | "weak" | "unknown" {
  if (accuracy == null || Number.isNaN(accuracy)) return "unknown";
  if (accuracy <= 40) return "good";
  if (accuracy <= WEAK_GPS_M) return "ok";
  return "weak";
}

/** Smart geofence: configured radius + small accuracy buffer (capped). */
export function effectiveGeofenceM(configured?: number, accuracy?: number) {
  const base = configured || DEFAULT_GEOFENCE_M;
  if (accuracy == null) return base;
  const buffer = Math.min(Math.max(accuracy * 0.75, 0), 80);
  return Math.round(base + buffer);
}

export function isImpossibleJump(
  prev: { lat: number; lng: number; createdAt: string } | undefined,
  nextLat: number,
  nextLng: number,
  nextTime = Date.now(),
) {
  if (!prev) return false;
  const prevTime = new Date(prev.createdAt).getTime();
  if (nextTime - prevTime > JUMP_WINDOW_MS) return false;
  const dist = distanceMeters(prev.lat, prev.lng, nextLat, nextLng);
  return dist > JUMP_DISTANCE_M;
}
