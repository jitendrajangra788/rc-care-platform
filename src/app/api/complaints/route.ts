import { NextResponse } from "next/server";
import { pushActivity } from "@/lib/activity";
import { requireApiUser, requirePermission } from "@/lib/api-guard";
import { pushAudit } from "@/lib/audit";
import { readDb, writeDb } from "@/lib/db";
import { can, isStaffOpsRole, normalizeRole } from "@/lib/permissions";
import type { Complaint } from "@/lib/types";
import { complaintSchema, parseBody } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!can(auth.user, "complaints.read") && !can(auth.user, "complaints.write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = await readDb();
  const role = normalizeRole(auth.user.role);
  let complaints = db.complaints || [];
  if (!isStaffOpsRole(role)) {
    complaints = complaints.filter((c) => c.raisedByUserId === auth.user.id);
  }
  return NextResponse.json({ complaints });
}

export async function POST(req: Request) {
  const auth = await requirePermission("complaints.write");
  if ("error" in auth) return auth.error;
  const parsed = parseBody(complaintSchema, await req.json().catch(() => null));
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error || "Invalid" }, { status: 400 });
  }
  const db = await readDb();
  const row: Complaint = {
    id: `cmp-${Date.now()}`,
    subject: parsed.data.subject.trim(),
    message: parsed.data.message.trim(),
    status: "open",
    bookingId: parsed.data.bookingId,
    patientId: parsed.data.patientId,
    raisedByUserId: auth.user.id,
    raisedByName: auth.user.name,
    raisedByRole: normalizeRole(auth.user.role),
    createdAt: new Date().toISOString(),
  };
  db.complaints = db.complaints || [];
  db.complaints.unshift(row);
  pushActivity(db, {
    kind: "complaint",
    title: `Complaint · ${row.subject}`,
    href: "/dashboard/admin/complaints",
    actorId: auth.user.id,
    actorName: auth.user.name,
  });
  await writeDb(db);
  return NextResponse.json({ complaint: row }, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = await requirePermission(["complaints.read", "complaints.write"]);
  if ("error" in auth) return auth.error;
  if (!isStaffOpsRole(normalizeRole(auth.user.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const db = await readDb();
  const idx = (db.complaints || []).findIndex((c) => c.id === body.id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.complaints[idx] = {
    ...db.complaints[idx],
    status: body.status || db.complaints[idx].status,
    response: body.response !== undefined ? body.response : db.complaints[idx].response,
    updatedAt: new Date().toISOString(),
  };
  pushAudit(db, {
    action: "complaint.update",
    entity: "complaint",
    detail: `${body.id} · ${db.complaints[idx].status}`,
    actorId: auth.user.id,
    actorName: auth.user.name,
  });
  await writeDb(db);
  return NextResponse.json({ complaint: db.complaints[idx] });
}
