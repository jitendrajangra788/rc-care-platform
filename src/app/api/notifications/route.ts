import { NextResponse } from "next/server";
import { requireApiUser, requirePermission } from "@/lib/api-guard";
import { readDb, writeDb } from "@/lib/db";
import { can, isStaffOpsRole, normalizeRole } from "@/lib/permissions";
import type { AppNotification } from "@/lib/types";

export async function GET() {
  const auth = await requirePermission("notifications.read");
  if ("error" in auth) return auth.error;
  const db = await readDb();
  const role = normalizeRole(auth.user.role);
  let notifications = db.notifications || [];
  if (!isStaffOpsRole(role)) {
    notifications = notifications.filter((n) => n.userId === auth.user.id);
  }
  return NextResponse.json({ notifications });
}

export async function POST(req: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!isStaffOpsRole(normalizeRole(auth.user.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.userId || !body?.title) {
    return NextResponse.json({ error: "userId and title required" }, { status: 400 });
  }
  const db = await readDb();
  const row: AppNotification = {
    id: `ntf-${Date.now()}`,
    userId: String(body.userId),
    title: String(body.title).trim(),
    body: body.body ? String(body.body) : undefined,
    href: body.href ? String(body.href) : undefined,
    createdAt: new Date().toISOString(),
  };
  db.notifications = db.notifications || [];
  db.notifications.unshift(row);
  await writeDb(db);
  return NextResponse.json({ notification: row }, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!can(auth.user, "notifications.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const db = await readDb();
  if (body?.markAll) {
    db.notifications = (db.notifications || []).map((n) =>
      n.userId === auth.user.id && !n.readAt
        ? { ...n, readAt: new Date().toISOString() }
        : n,
    );
    await writeDb(db);
    return NextResponse.json({ ok: true });
  }
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const idx = (db.notifications || []).findIndex(
    (n) => n.id === body.id && n.userId === auth.user.id,
  );
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.notifications[idx] = { ...db.notifications[idx], readAt: new Date().toISOString() };
  await writeDb(db);
  return NextResponse.json({ notification: db.notifications[idx] });
}
