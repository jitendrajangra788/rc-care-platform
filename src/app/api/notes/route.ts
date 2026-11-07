import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pushActivity } from "@/lib/activity";
import { readDb, writeDb } from "@/lib/db";
import type { CareNote } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await readDb();
  if (session.role === "admin") return NextResponse.json({ notes: db.careNotes });
  if (session.role === "nurse") {
    return NextResponse.json({
      notes: db.careNotes.filter((n) => n.nurseId === session.id),
    });
  }
  const myIds = new Set(
    db.bookings.filter((b) => b.familyUserId === session.id).map((b) => b.id),
  );
  return NextResponse.json({
    notes: db.careNotes.filter((n) => myIds.has(n.bookingId)),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "nurse" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Partial<CareNote>;
  if (!body.bookingId || !body.notes) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = await readDb();
  const note: CareNote = {
    id: `cn${db.careNotes.length + 1}`,
    bookingId: body.bookingId,
    nurseId: session.id,
    vitals: body.vitals ?? {},
    notes: body.notes,
    createdAt: new Date().toISOString(),
  };
  db.careNotes.unshift(note);
  const booking = db.bookings.find((b) => b.id === note.bookingId);
  pushActivity(db, {
    kind: "note",
    title: `Care note · ${booking?.patientName || note.bookingId}`,
    detail: note.notes.slice(0, 80),
    href: "/dashboard/family/updates",
    actorId: session.id,
    actorName: session.name,
  });
  await writeDb(db);
  return NextResponse.json({ note }, { status: 201 });
}