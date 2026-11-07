import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pushActivity } from "@/lib/activity";
import { readDb, saveDataUrlImage, writeDb } from "@/lib/db";
import type { MedicationLog, MedicationType } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await readDb();
  if (session.role === "admin") {
    return NextResponse.json({ medications: db.medications });
  }
  if (session.role === "nurse") {
    return NextResponse.json({
      medications: db.medications.filter((m) => m.nurseId === session.id),
    });
  }
  const bookingIds = new Set(
    db.bookings.filter((b) => b.familyUserId === session.id).map((b) => b.id),
  );
  return NextResponse.json({
    medications: db.medications.filter((m) => bookingIds.has(m.bookingId)),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "nurse") {
    return NextResponse.json({ error: "Only staff can add medicine logs" }, { status: 401 });
  }

  const body = (await req.json()) as {
    bookingId?: string;
    medicineName?: string;
    type?: MedicationType;
    dose?: string;
    route?: string;
    timeGiven?: string;
    notes?: string;
    photoDataUrl?: string;
  };

  if (!body.bookingId || !body.medicineName || !body.dose || !body.type) {
    return NextResponse.json(
      { error: "bookingId, medicineName, type and dose are required" },
      { status: 400 },
    );
  }

  const db = await readDb();
  const staff = db.staff.find((s) => s.userId === session.id || s.name === session.name);
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  const booking = db.bookings.find((b) => b.id === body.bookingId);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.assignedStaffId !== staff.id) {
    return NextResponse.json({ error: "This patient is not assigned to you" }, { status: 403 });
  }

  let photoUrl: string | undefined;
  if (body.photoDataUrl?.startsWith("data:image/")) {
    photoUrl = await saveDataUrlImage(body.photoDataUrl, "medications", staff.id);
  }

  const log: MedicationLog = {
    id: `med-${Date.now()}`,
    bookingId: booking.id,
    staffId: staff.id,
    nurseId: session.id,
    patientName: booking.patientName,
    medicineName: body.medicineName.trim(),
    type: body.type,
    dose: body.dose.trim(),
    route: body.route?.trim(),
    timeGiven: body.timeGiven || new Date().toISOString(),
    notes: body.notes?.trim(),
    photoUrl,
    createdAt: new Date().toISOString(),
  };

  db.medications.unshift(log);
  pushActivity(db, {
    kind: "medication",
    title: `${log.medicineName} logged · ${log.patientName}`,
    detail: `${log.type} · ${log.dose}`,
    href: "/dashboard/admin/medications",
    actorId: session.id,
    actorName: session.name,
  });
  await writeDb(db);
  return NextResponse.json({ medication: log }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "nurse" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = await readDb();
  const item = db.medications.find((m) => m.id === id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role === "nurse" && item.nurseId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  db.medications = db.medications.filter((m) => m.id !== id);
  await writeDb(db);
  return NextResponse.json({ ok: true });
}