import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-guard";
import { readDb, writeDb } from "@/lib/db";
import { patientIdsForUser } from "@/lib/scope";
import type { VitalRecord } from "@/lib/types";
import { parseBody, vitalSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const auth = await requirePermission("clinical.read");
  if ("error" in auth) return auth.error;
  const patientId = new URL(req.url).searchParams.get("patientId");
  const db = await readDb();
  const allowed = patientIdsForUser(db, auth.user);
  let vitals = (db.vitals || []).filter((v) => allowed.has(v.patientId));
  if (patientId) vitals = vitals.filter((v) => v.patientId === patientId);
  return NextResponse.json({ vitals, patients: db.patients || [] });
}

export async function POST(req: Request) {
  const auth = await requirePermission("clinical.write");
  if ("error" in auth) return auth.error;
  const parsed = parseBody(vitalSchema, await req.json().catch(() => null));
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error || "Invalid" }, { status: 400 });
  }
  const db = await readDb();
  const allowed = patientIdsForUser(db, auth.user);
  if (!allowed.has(parsed.data.patientId) && auth.user.role === "nurse") {
    // nurse may only write assigned patients
    if (!allowed.has(parsed.data.patientId)) {
      return NextResponse.json({ error: "Forbidden patient" }, { status: 403 });
    }
  }
  const row: VitalRecord = {
    id: `vit-${Date.now()}`,
    patientId: parsed.data.patientId,
    bookingId: parsed.data.bookingId,
    recordedBy: auth.user.id,
    recordedByName: auth.user.name,
    bp: parsed.data.bp,
    sugar: parsed.data.sugar,
    pulse: parsed.data.pulse,
    temp: parsed.data.temp,
    spo2: parsed.data.spo2,
    notes: parsed.data.notes,
    recordedAt: parsed.data.recordedAt || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  db.vitals = db.vitals || [];
  db.vitals.unshift(row);
  await writeDb(db);
  return NextResponse.json({ vital: row }, { status: 201 });
}
