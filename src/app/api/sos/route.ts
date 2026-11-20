import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-guard";
import { readDb } from "@/lib/db";
import { isStaffOpsRole, normalizeRole } from "@/lib/permissions";
import { dutiesForStaff, dutyLabel, staffForUser } from "@/lib/scope";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const db = await readDb();
  const role = normalizeRole(auth.user.role);
  if (isStaffOpsRole(role)) {
    return NextResponse.json({ sosAlerts: db.sosAlerts || [] });
  }
  if (role === "nurse") {
    const dutyIds = new Set(dutiesForStaff(db, staffForUser(db, auth.user)).map((b) => b.id));
    return NextResponse.json({
      sosAlerts: (db.sosAlerts || [])
        .filter((s) => dutyIds.has(s.bookingId) || s.raisedByUserId === auth.user.id)
        .map((s) => ({ ...s, patientName: dutyLabel(s.bookingId) })),
    });
  }
  return NextResponse.json({
    sosAlerts: (db.sosAlerts || []).filter((s) => s.raisedByUserId === auth.user.id),
  });
}
