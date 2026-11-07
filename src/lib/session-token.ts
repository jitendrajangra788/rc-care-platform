import { createHmac, timingSafeEqual } from "crypto";

function secret() {
  return process.env.SESSION_SECRET || "roshan-care-dev-session-secret-change-me";
}

export type SessionPayload = { id: string; role?: string; v?: number };

export function signSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify({ ...payload, v: 1 }), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    // Legacy unsigned JSON cookie support
    if (token.startsWith("{") || token.startsWith("%7B")) {
      const raw = token.startsWith("%") ? decodeURIComponent(token) : token;
      const parsed = JSON.parse(raw) as SessionPayload;
      if (parsed?.id) return parsed;
      return null;
    }
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = createHmac("sha256", secret()).update(body).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}
