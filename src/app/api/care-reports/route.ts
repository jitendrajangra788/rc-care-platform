import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-guard";
import { readDb, saveDataUrlImage, writeDb } from "@/lib/db";
import { patientIdsForUser } from "@/lib/scope";
import type { CareReport } from "@/lib/types";
import { z } from "zod";
import { parseBody } from "@/lib/validation";
import { pushActivity } from "@/lib/activity";

const schema = z.object({
  patientId: z.string().min(1),
  bookingId: z.string().optional(),
  dutyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  summary: z.string().min(3).max(4000),
  vitalsNote: z.string().max(1000).optional(),
  medsNote: z.string().max(1000).optional(),
  reportType: z.enum(["daily", "complete"]).optional(),
  conditionNote: z.string().max(2000).optional(),
  tasksDone: z.string().max(2000).optional(),
  familyUpdate: z.string().max(2000).optional(),
  attachmentName: z.string().max(200).optional(),
  fileDataUrl: z.string().optional(),
});

export async function GET() {
  const auth = await requirePermission("clinical.read");
  if ("error" in auth) return auth.error;
  const db = await readDb();
  const allowed = patientIdsForUser(db, auth.user);
  const careReports = (db.careReports || []).filter((r) => allowed.has(r.patientId));
  return NextResponse.json({ careReports, patients: db.patients || [] });
}

export async function POST(req: Request) {
  const auth = await requirePermission("clinical.write");
  if ("error" in auth) return auth.error;
  const parsed = parseBody(schema, await req.json().catch(() => null));
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error || "Invalid" }, { status: 400 });
  }
  const db = await readDb();
  const allowed = patientIdsForUser(db, auth.user);
  if (!allowed.has(parsed.data.patientId)) {
    return NextResponse.json({ error: "Forbidden patient" }, { status: 403 });
  }

  const reportType = parsed.data.reportType || "daily";
  if (reportType === "complete" && !parsed.data.summary.trim()) {
    return NextResponse.json({ error: "Complete report summary required" }, { status: 400 });
  }

  let attachmentUrl: string | undefined;
  let attachmentName: string | undefined;
  if (parsed.data.fileDataUrl) {
    try {
      attachmentUrl = await saveDataUrlImage(
        parsed.data.fileDataUrl,
        "reports",
        `cr-${parsed.data.patientId}`,
      );
      attachmentName = parsed.data.attachmentName?.trim() || "Care report file";
    } catch {
      return NextResponse.json(
        { error: "Invalid attachment — use image or PDF" },
        { status: 400 },
      );
    }
  }

  const patient = (db.patients || []).find((p) => p.id === parsed.data!.patientId);
  const row: CareReport = {
    id: `cr-${Date.now()}`,
    patientId: parsed.data.patientId,
    bookingId: parsed.data.bookingId,
    dutyDate: parsed.data.dutyDate,
    summary: parsed.data.summary.trim(),
    vitalsNote: parsed.data.vitalsNote?.trim(),
    medsNote: parsed.data.medsNote?.trim(),
    reportType,
    conditionNote: parsed.data.conditionNote?.trim(),
    tasksDone: parsed.data.tasksDone?.trim(),
    familyUpdate: parsed.data.familyUpdate?.trim(),
    attachmentUrl,
    attachmentName,
    createdBy: auth.user.id,
    createdByName: auth.user.name,
    createdAt: new Date().toISOString(),
  };
  db.careReports = db.careReports || [];
  db.careReports.unshift(row);

  pushActivity(db, {
    kind: "note",
    title:
      reportType === "complete"
        ? `Complete care report · ${patient?.name || parsed.data.patientId}`
        : `Daily care report · ${patient?.name || parsed.data.patientId}`,
    detail: row.summary.slice(0, 120),
    href: `/dashboard/nurse/patients/${parsed.data.patientId}`,
    actorId: auth.user.id,
    actorName: auth.user.name,
  });

  await writeDb(db);
  return NextResponse.json({ careReport: row }, { status: 201 });
}

const doctorCheckSchema = z.object({
  id: z.string().min(1),
  doctorName: z.string().min(2).max(120),
  doctorRemarks: z.string().max(2000).optional(),
  doctorChecked: z.boolean().optional(),
});

/** Mark a care report as checked/reviewed by a doctor. */
export async function PATCH(req: Request) {
  const auth = await requirePermission("clinical.write");
  if ("error" in auth) return auth.error;
  const parsed = parseBody(doctorCheckSchema, await req.json().catch(() => null));
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error || "Invalid" }, { status: 400 });
  }
  const db = await readDb();
  const allowed = patientIdsForUser(db, auth.user);
  const idx = (db.careReports || []).findIndex((r) => r.id === parsed.data!.id);
  if (idx < 0) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  const existing = db.careReports[idx];
  if (!allowed.has(existing.patientId)) {
    return NextResponse.json({ error: "Forbidden patient" }, { status: 403 });
  }

  const checked = parsed.data.doctorChecked !== false;
  const next: CareReport = {
    ...existing,
    doctorChecked: checked,
    doctorName: parsed.data.doctorName.trim(),
    doctorRemarks: parsed.data.doctorRemarks?.trim() || undefined,
    doctorCheckedAt: checked ? new Date().toISOString() : undefined,
    doctorCheckedBy: checked ? auth.user.id : undefined,
    doctorCheckedByName: checked ? auth.user.name : undefined,
  };
  db.careReports[idx] = next;

  const patient = (db.patients || []).find((p) => p.id === existing.patientId);
  pushActivity(db, {
    kind: "note",
    title: checked
      ? `Doctor checked report · ${patient?.name || existing.patientId}`
      : `Doctor check cleared · ${patient?.name || existing.patientId}`,
    detail: `${parsed.data.doctorName.trim()}${parsed.data.doctorRemarks ? ` — ${parsed.data.doctorRemarks.slice(0, 80)}` : ""}`,
    href: `/dashboard/nurse/patients/${existing.patientId}`,
    actorId: auth.user.id,
    actorName: auth.user.name,
  });

  await writeDb(db);
  return NextResponse.json({ careReport: next });
}
