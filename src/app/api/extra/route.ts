import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pushActivity } from "@/lib/activity";
import { pushAudit } from "@/lib/audit";
import { saveDataUrlImage, readDb, writeDb } from "@/lib/db";
import { refreshAllPerformance } from "@/lib/performance";
import type {
  CallLog,
  DoctorNote,
  LeaveRequest,
  MedSchedule,
  SalaryAdvance,
  SosAlert,
  StaffDocument,
} from "@/lib/types";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const resource = new URL(req.url).searchParams.get("resource");
  const db = await readDb();
  refreshAllPerformance(db);

  if (resource === "leaves") {
    if (session.role === "admin") return NextResponse.json({ leaves: db.leaves });
    const staff = db.staff.find((s) => s.userId === session.id);
    return NextResponse.json({
      leaves: db.leaves.filter((l) => l.staffId === staff?.id),
    });
  }
  if (resource === "documents") {
    if (session.role === "admin") return NextResponse.json({ documents: db.documents });
    const staff = db.staff.find((s) => s.userId === session.id);
    return NextResponse.json({
      documents: db.documents.filter((d) => d.staffId === staff?.id),
    });
  }
  if (resource === "sos") {
    if (session.role === "admin" || session.role === "nurse") {
      return NextResponse.json({ sosAlerts: db.sosAlerts });
    }
    return NextResponse.json({
      sosAlerts: db.sosAlerts.filter((s) => s.raisedByUserId === session.id),
    });
  }
  if (resource === "med-schedule") {
    if (session.role === "admin" || session.role === "nurse") {
      return NextResponse.json({ medSchedules: db.medSchedules });
    }
    const ids = new Set(db.bookings.filter((b) => b.familyUserId === session.id).map((b) => b.id));
    return NextResponse.json({
      medSchedules: db.medSchedules.filter((m) => ids.has(m.bookingId)),
    });
  }
  if (resource === "advances") {
    if (session.role !== "admin" && session.role !== "nurse") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (session.role === "admin") return NextResponse.json({ advances: db.advances });
    const staff = db.staff.find((s) => s.userId === session.id);
    return NextResponse.json({
      advances: db.advances.filter((a) => a.staffId === staff?.id),
    });
  }
  if (resource === "doctor-notes") {
    if (session.role === "admin" || session.role === "nurse") {
      return NextResponse.json({ doctorNotes: db.doctorNotes });
    }
    const ids = new Set(db.bookings.filter((b) => b.familyUserId === session.id).map((b) => b.id));
    return NextResponse.json({
      doctorNotes: db.doctorNotes.filter((n) => ids.has(n.bookingId)),
    });
  }
  if (resource === "call-logs") {
    if (session.role === "family") {
      const ids = new Set(db.bookings.filter((b) => b.familyUserId === session.id).map((b) => b.id));
      return NextResponse.json({ callLogs: db.callLogs.filter((c) => ids.has(c.bookingId)) });
    }
    return NextResponse.json({ callLogs: db.callLogs });
  }
  if (resource === "audit") {
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ auditLogs: db.auditLogs });
  }
  if (resource === "roster") {
    return NextResponse.json({
      bookings: db.bookings.filter((b) => b.status === "active" || b.status === "assigned"),
      staff: db.staff,
      attendance: db.attendance.slice(0, 100),
    });
  }
  if (resource === "margin") {
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rows = db.bookings.map((b) => {
      const staffPay = b.staffPayPerShift ?? db.staff.find((s) => s.id === b.assignedStaffId)?.salaryPerShift ?? 0;
      return {
        bookingId: b.id,
        patientName: b.patientName,
        packageAmount: b.amount,
        staffPayPerShift: staffPay,
        margin: b.amount - staffPay,
      };
    });
    return NextResponse.json({ rows, staff: db.staff });
  }

  return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const resource = body.resource as string;
  const db = await readDb();

  if (resource === "leave") {
    if (session.role !== "nurse") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const staff = db.staff.find((s) => s.userId === session.id);
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    if (!body.fromDate || !body.toDate || !body.reason) {
      return NextResponse.json({ error: "fromDate, toDate, reason required" }, { status: 400 });
    }
    const leave: LeaveRequest = {
      id: `lv-${Date.now()}`,
      staffId: staff.id,
      staffName: staff.name,
      fromDate: body.fromDate,
      toDate: body.toDate,
      reason: String(body.reason).trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    db.leaves.unshift(leave);
    pushActivity(db, {
      kind: "leave",
      title: `Leave request · ${staff.name}`,
      detail: `${leave.fromDate} → ${leave.toDate}`,
      href: "/dashboard/admin/ops",
      actorId: session.id,
      actorName: session.name,
    });
    pushAudit(db, {
      action: "leave.create",
      entity: leave.id,
      detail: leave.reason,
      actorId: session.id,
      actorName: session.name,
    });
    await writeDb(db);
    return NextResponse.json({ leave }, { status: 201 });
  }

  if (resource === "document") {
    if (session.role !== "nurse" && session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const staffId =
      session.role === "admin" ? body.staffId : db.staff.find((s) => s.userId === session.id)?.id;
    if (!staffId || !body.title || !body.fileDataUrl) {
      return NextResponse.json({ error: "staffId, title, file required" }, { status: 400 });
    }
    const fileUrl = await saveDataUrlImage(body.fileDataUrl, "documents", staffId);
    const doc: StaffDocument = {
      id: `doc-${Date.now()}`,
      staffId,
      title: String(body.title).trim(),
      kind: body.kind || "other",
      fileUrl,
      expiryDate: body.expiryDate || undefined,
      createdAt: new Date().toISOString(),
    };
    db.documents.unshift(doc);
    pushAudit(db, {
      action: "document.upload",
      entity: doc.id,
      detail: doc.title,
      actorId: session.id,
      actorName: session.name,
    });
    await writeDb(db);
    return NextResponse.json({ document: doc }, { status: 201 });
  }

  if (resource === "sos") {
    if (!body.bookingId || !body.message) {
      return NextResponse.json({ error: "bookingId and message required" }, { status: 400 });
    }
    const booking = db.bookings.find((b) => b.id === body.bookingId);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (session.role === "family" && booking.familyUserId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const sos: SosAlert = {
      id: `sos-${Date.now()}`,
      bookingId: booking.id,
      patientName: booking.patientName,
      raisedByUserId: session.id,
      raisedByName: session.name,
      raisedByRole: session.role,
      message: String(body.message).trim(),
      status: "open",
      createdAt: new Date().toISOString(),
    };
    db.sosAlerts.unshift(sos);
    pushActivity(db, {
      kind: "sos",
      title: `SOS · ${booking.patientName}`,
      detail: sos.message,
      href: "/dashboard/admin/ops",
      actorId: session.id,
      actorName: session.name,
    });
    pushAudit(db, {
      action: "sos.create",
      entity: sos.id,
      detail: sos.message,
      actorId: session.id,
      actorName: session.name,
    });
    await writeDb(db);
    return NextResponse.json({ sos }, { status: 201 });
  }

  if (resource === "med-schedule") {
    if (session.role !== "admin" && session.role !== "nurse") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!body.bookingId || !body.medicineName || !body.dose || !body.times?.length) {
      return NextResponse.json({ error: "Missing schedule fields" }, { status: 400 });
    }
    const booking = db.bookings.find((b) => b.id === body.bookingId);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    const row: MedSchedule = {
      id: `ms-${Date.now()}`,
      bookingId: booking.id,
      patientName: booking.patientName,
      medicineName: String(body.medicineName).trim(),
      type: body.type || "tablet",
      dose: String(body.dose).trim(),
      times: body.times,
      notes: body.notes,
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.medSchedules.unshift(row);
    pushAudit(db, {
      action: "medschedule.create",
      entity: row.id,
      detail: `${row.medicineName} · ${row.times.join(",")}`,
      actorId: session.id,
      actorName: session.name,
    });
    await writeDb(db);
    return NextResponse.json({ medSchedule: row }, { status: 201 });
  }

  if (resource === "advance") {
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!body.staffId || typeof body.amount !== "number") {
      return NextResponse.json({ error: "staffId and amount required" }, { status: 400 });
    }
    const row: SalaryAdvance = {
      id: `adv-${Date.now()}`,
      staffId: body.staffId,
      amount: body.amount,
      reason: body.reason || "Advance",
      status: "open",
      createdAt: new Date().toISOString(),
    };
    db.advances.unshift(row);
    pushAudit(db, {
      action: "advance.create",
      entity: row.id,
      detail: `₹${row.amount}`,
      actorId: session.id,
      actorName: session.name,
    });
    await writeDb(db);
    return NextResponse.json({ advance: row }, { status: 201 });
  }

  if (resource === "doctor-note") {
    if (session.role !== "admin" && session.role !== "nurse") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!body.bookingId || !body.doctorName || !body.notes) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const booking = db.bookings.find((b) => b.id === body.bookingId);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    const row: DoctorNote = {
      id: `dn-${Date.now()}`,
      bookingId: booking.id,
      patientName: booking.patientName,
      doctorName: String(body.doctorName).trim(),
      notes: String(body.notes).trim(),
      visitDate: body.visitDate || new Date().toISOString().slice(0, 10),
      createdBy: session.id,
      createdAt: new Date().toISOString(),
    };
    db.doctorNotes.unshift(row);
    await writeDb(db);
    return NextResponse.json({ doctorNote: row }, { status: 201 });
  }

  if (resource === "call-log") {
    if (session.role === "family") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!body.bookingId || !body.summary) {
      return NextResponse.json({ error: "bookingId and summary required" }, { status: 400 });
    }
    const booking = db.bookings.find((b) => b.id === body.bookingId);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    const row: CallLog = {
      id: `cl-${Date.now()}`,
      bookingId: booking.id,
      patientName: booking.patientName,
      direction: body.direction || "outbound",
      summary: String(body.summary).trim(),
      createdBy: session.id,
      createdByName: session.name,
      createdAt: new Date().toISOString(),
    };
    db.callLogs.unshift(row);
    await writeDb(db);
    return NextResponse.json({ callLog: row }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const resource = body.resource as string;
  const db = await readDb();

  if (resource === "leave") {
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const idx = db.leaves.findIndex((l) => l.id === body.id);
    if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    db.leaves[idx] = {
      ...db.leaves[idx],
      status: body.status,
      decidedAt: new Date().toISOString(),
    };
    if (body.status === "approved") {
      const staff = db.staff.find((s) => s.id === db.leaves[idx].staffId);
      if (staff) staff.status = "leave";
    }
    pushAudit(db, {
      action: `leave.${body.status}`,
      entity: body.id,
      actorId: session.id,
      actorName: session.name,
    });
    await writeDb(db);
    return NextResponse.json({ leave: db.leaves[idx] });
  }

  if (resource === "sos") {
    if (session.role !== "admin" && session.role !== "nurse") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const idx = db.sosAlerts.findIndex((s) => s.id === body.id);
    if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    db.sosAlerts[idx] = {
      ...db.sosAlerts[idx],
      status: body.status,
      updatedAt: new Date().toISOString(),
    };
    await writeDb(db);
    return NextResponse.json({ sos: db.sosAlerts[idx] });
  }

  if (resource === "advance") {
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const idx = db.advances.findIndex((a) => a.id === body.id);
    if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    db.advances[idx] = { ...db.advances[idx], status: body.status };
    await writeDb(db);
    return NextResponse.json({ advance: db.advances[idx] });
  }

  if (resource === "backup") {
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const idx = db.bookings.findIndex((b) => b.id === body.bookingId);
    if (idx < 0) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    db.bookings[idx] = {
      ...db.bookings[idx],
      backupStaffId: body.backupStaffId || undefined,
      assignedStaffId: body.swapToBackup
        ? db.bookings[idx].backupStaffId || db.bookings[idx].assignedStaffId
        : db.bookings[idx].assignedStaffId,
    };
    if (body.swapToBackup && db.bookings[idx].backupStaffId) {
      const old = db.bookings[idx].assignedStaffId;
      db.bookings[idx].assignedStaffId = db.bookings[idx].backupStaffId;
      db.bookings[idx].backupStaffId = old;
    }
    pushAudit(db, {
      action: "booking.backup",
      entity: body.bookingId,
      detail: `backup=${db.bookings[idx].backupStaffId}`,
      actorId: session.id,
      actorName: session.name,
    });
    await writeDb(db);
    return NextResponse.json({ booking: db.bookings[idx] });
  }

  return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
}
