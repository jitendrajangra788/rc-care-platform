import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await readDb();
    return NextResponse.json({
      ok: true,
      service: "roshan-care",
      time: new Date().toISOString(),
      counts: {
        users: db.users.length,
        staff: db.staff.length,
        bookings: db.bookings.length,
        invoices: db.invoices.length,
        attendance: db.attendance.length,
        medications: db.medications.length,
        leads: db.leads.length,
        activities: db.activities?.length || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "DB error" },
      { status: 500 },
    );
  }
}