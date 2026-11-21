import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import type { DbShape } from "@/lib/types";

export async function POST() {
  const session = await getSession();
  if (!session || (session.role !== "super_admin" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await readDb();
  const keep = db.users.filter((user) => {
    const email = user.email.toLowerCase();
    if (user.role === "super_admin") return true;
    return user.role === "admin" && (email === "admin@roshancare.in" || user.name === "Care Admin");
  });
  if (!keep.some((user) => user.role === "super_admin") || !keep.some((user) => user.role === "admin")) {
    return NextResponse.json({ error: "Super Admin and Care Admin were not both found." }, { status: 409 });
  }

  const next: DbShape = {
    ...db,
    users: keep,
    staff: [],
    bookings: [],
    invoices: [],
    careNotes: [],
    leads: [],
    attendance: [],
    medications: [],
    activities: [],
    salaryPayouts: [],
    monthlySalaries: [],
    careLocations: [],
    siteAllotments: [],
    leaves: [],
    nurseAvailability: [],
    documents: [],
    sosAlerts: [],
    medSchedules: [],
    advances: [],
    doctorNotes: [],
    callLogs: [],
    auditLogs: [],
    patients: [],
    carePlans: [],
    vitals: [],
    careReports: [],
    complaints: [],
    expenses: [],
    payments: [],
    notifications: [],
    homeCareRequests: [],
    careerApplications: [],
  };
  await writeDb(next);

  return NextResponse.json({
    kept: keep.map((user) => ({ name: user.name, email: user.email, role: user.role })),
    staff: 0,
    patients: 0,
    bookings: 0,
  });
}
