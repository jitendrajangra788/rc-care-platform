import { NextResponse } from "next/server";
import { pushActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/api-guard";
import { pushAudit } from "@/lib/audit";
import { readDb, writeDb } from "@/lib/db";
import { patientIdsForUser } from "@/lib/scope";
import type { Patient } from "@/lib/types";
import { parseBody, patientSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requirePermission("patients.read");
  if ("error" in auth) return auth.error;
  const db = await readDb();
  const allowed = patientIdsForUser(db, auth.user);
  const patients = (db.patients || []).filter((p) => allowed.has(p.id));
  return NextResponse.json({ patients });
}

export async function POST(req: Request) {
  const auth = await requirePermission("patients.write");
  if ("error" in auth) return auth.error;
  const parsed = parseBody(patientSchema, await req.json().catch(() => null));
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error || "Invalid" }, { status: 400 });
  }
  const db = await readDb();
  const row: Patient = {
    id: `pat-${Date.now()}`,
    name: parsed.data.name.trim(),
    phone: parsed.data.phone.trim(),
    age: parsed.data.age,
    gender: parsed.data.gender,
    address: parsed.data.address?.trim(),
    area: parsed.data.area?.trim(),
    notes: parsed.data.notes?.trim(),
    familyUserIds: parsed.data.familyUserIds || [],
    status: parsed.data.status || "active",
    createdAt: new Date().toISOString(),
  };
  db.patients = db.patients || [];
  db.patients.unshift(row);
  pushAudit(db, {
    action: "patient.create",
    entity: "patient",
    detail: `${row.id} · ${row.name}`,
    actorId: auth.user.id,
    actorName: auth.user.name,
  });
  pushActivity(db, {
    kind: "patient",
    title: `Patient added · ${row.name}`,
    href: "/dashboard/admin/patients",
    actorId: auth.user.id,
    actorName: auth.user.name,
  });
  await writeDb(db);
  return NextResponse.json({ patient: row }, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = await requirePermission("patients.write");
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const db = await readDb();
  const idx = (db.patients || []).findIndex((p) => p.id === body.id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const cur = db.patients[idx];
  db.patients[idx] = {
    ...cur,
    name: body.name?.trim() || cur.name,
    phone: body.phone?.trim() || cur.phone,
    age: typeof body.age === "number" ? body.age : cur.age,
    gender: body.gender || cur.gender,
    address: body.address !== undefined ? body.address : cur.address,
    area: body.area !== undefined ? body.area : cur.area,
    notes: body.notes !== undefined ? body.notes : cur.notes,
    familyUserIds: Array.isArray(body.familyUserIds) ? body.familyUserIds : cur.familyUserIds,
    status: body.status || cur.status,
    userId: body.userId !== undefined ? body.userId || undefined : cur.userId,
  };
  pushAudit(db, {
    action: "patient.update",
    entity: "patient",
    detail: body.id,
    actorId: auth.user.id,
    actorName: auth.user.name,
  });
  await writeDb(db);
  return NextResponse.json({ patient: db.patients[idx] });
}
