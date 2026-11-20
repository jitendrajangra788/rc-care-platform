const buckets = new Map<string, { count: number; resetAt: number }>();

/** In-memory window. Matches the login limiter: fine for this JSON-file server. */
export function allowPublicSubmit(key: string, limit = 8, windowMs = 15 * 60_000) {
  const now = Date.now();
  const row = buckets.get(key);
  if (!row || row.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  row.count += 1;
  return row.count <= limit;
}

export function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "local";
  return req.headers.get("x-real-ip") || "local";
}
