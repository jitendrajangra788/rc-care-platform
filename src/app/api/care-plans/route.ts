import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-guard";
import { pushAudit } from "@/lib/audit";
import { readDb, writeDb } from "@/lib/db";
import { patientIdsForUser } from "@/lib/scope";
import type { CarePlan } from "@/lib/types";
import { carePlanSchema, parseBody } from "@/lib/validation";

export async function GET() {
  const auth = await requirePermission("clinical.read");
  if ("error" in auth) return auth.error;
  const db = await readDb();
  const allowed = patientIdsForUser(db, auth.user);
  const carePlans = (db.carePlans || []).filter((p) => allowed.has(p.patientId));
  return NextResponse.json({ carePlans, patients: db.patients || [] });
}

export async function POST(req: Request) {
  const auth = await requirePermission("clinical.write");
  if ("error" in auth) return auth.error;
  const parsed = parseBody(carePlanSchema, await req.json().catch(() => null));
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error || "Invalid" }, { status: 400 });
  }
  const db = await readDb();
  const row: CarePlan = {
    id: `cp-${Date.now()}`,
    patientId: parsed.data.patientId,
    bookingId: parsed.data.bookingId,
    title: parsed.data.title.trim(),
    goals: parsed.data.goals?.trim(),
    tasks: parsed.data.tasks || [],
    status: parsed.data.status || "active",
    createdBy: auth.user.id,
    createdAt: new Date().toISOString(),
  };
  db.carePlans = db.carePlans || [];
  db.carePlans.unshift(row);
  pushAudit(db, {
    action: "careplan.create",
    entity: "carePlan",
    detail: row.title,
    actorId: auth.user.id,
    actorName: auth.user.name,
  });
  await writeDb(db);
  return NextResponse.json({ carePlan: row }, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = await requirePermission("clinical.write");
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const db = await readDb();
  const idx = (db.carePlans || []).findIndex((p) => p.id === body.id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const cur = db.carePlans[idx];
  db.carePlans[idx] = {
    ...cur,
    title: body.title?.trim() || cur.title,
    goals: body.goals !== undefined ? body.goals : cur.goals,
    tasks: Array.isArray(body.tasks) ? body.tasks : cur.tasks,
    status: body.status || cur.status,
    bookingId: body.bookingId !== undefined ? body.bookingId : cur.bookingId,
    updatedAt: new Date().toISOString(),
  };
  await writeDb(db);
  return NextResponse.json({ carePlan: db.carePlans[idx] });
}
