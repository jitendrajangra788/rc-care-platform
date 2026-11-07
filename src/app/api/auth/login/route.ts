import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/roles";
import { pushAudit } from "@/lib/audit";
import { readDb, writeDb } from "@/lib/db";
import { hashPassword, isHashedPassword, verifyPassword } from "@/lib/password";
import { normalizeRole } from "@/lib/permissions";
import { signSession } from "@/lib/session-token";

const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string) {
  const now = Date.now();
  const row = attempts.get(key);
  if (!row || row.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
    return true;
  }
  row.count += 1;
  return row.count <= 60;
}

export async function POST(req: Request) {
  const json = (await req.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  const email = String(json?.email || "")
    .trim()
    .toLowerCase();
  const password = String(json?.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") || "local";
  const rateKey = `${ip}:${email}`;
  if (!rateLimit(rateKey)) {
    return NextResponse.json({ error: "Too many attempts. Try later." }, { status: 429 });
  }

  const db = await readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email);
  if (!user || user.active === false || !verifyPassword(password, user.password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  attempts.delete(rateKey);

  const role = normalizeRole(user.role);
  const idx = db.users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    const next = { ...db.users[idx], active: true as const };
    if (!isHashedPassword(next.password)) {
      next.password = hashPassword(password);
    }
    db.users[idx] = next;
  }

  pushAudit(db, {
    action: "auth.login",
    entity: "user",
    detail: `${user.email} · ${role}`,
    actorId: user.id,
    actorName: user.name,
  });

  // Persist in background so the login response stays snappy
  void writeDb(db).catch(() => {});

  const res = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      phone: user.phone,
      active: true,
    },
    redirectTo: dashboardPathForRole(role),
  });

  res.cookies.set(SESSION_COOKIE, signSession({ id: user.id, role }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
