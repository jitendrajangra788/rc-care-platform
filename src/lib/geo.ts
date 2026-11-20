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
/**
 * Indoor phones in the field are often ±80–250m. Worse than this is "weak"
 * but can still be on site. City-level network fixes are rejected separately.
 */
export const WEAK_GPS_M = 250;
/** Above this, the fix is a cell/IP location, not a usable care-site GPS. */
export const UNUSABLE_GPS_M = 1000;
/** How far a real GPS error may widen the fence. Never the full city-level accuracy. */
export const MAX_ACCURACY_BUFFER_M = 250;
/** Impossible travel threshold */
export const JUMP_DISTANCE_M = 40000;
export const JUMP_WINDOW_MS = 15 * 60 * 1000;

export function gpsQuality(accuracy?: number): "good" | "ok" | "weak" | "unknown" {
  if (accuracy == null || Number.isNaN(accuracy)) return "unknown";
  if (accuracy <= 40) return "good";
  if (accuracy <= WEAK_GPS_M) return "ok";
  return "weak";
}

/** True when the fix is precise enough to prove someone is at the care site. */
export function isUsableGps(accuracy?: number) {
  if (accuracy == null || Number.isNaN(accuracy)) return false;
  return accuracy > 0 && accuracy <= UNUSABLE_GPS_M;
}

/**
 * Care-site fence plus the phone's own error, capped.
 * A ±5 km network fix must not widen the fence to the whole city.
 */
export function effectiveGeofenceM(configured?: number, accuracy?: number) {
  const base = configured && configured > 0 ? configured : DEFAULT_GEOFENCE_M;
  if (!isUsableGps(accuracy) || accuracy == null) return base;
  const buffer = Math.min(accuracy, MAX_ACCURACY_BUFFER_M);
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
