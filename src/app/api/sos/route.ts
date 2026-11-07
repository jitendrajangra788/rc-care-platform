import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-guard";
import { readDb } from "@/lib/db";
import { isStaffOpsRole, normalizeRole } from "@/lib/permissions";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const db = await readDb();
  const role = normalizeRole(auth.user.role);
  if (isStaffOpsRole(role) || role === "nurse") {
    return NextResponse.json({ sosAlerts: db.sosAlerts || [] });
  }
  return NextResponse.json({
    sosAlerts: (db.sosAlerts || []).filter((s) => s.raisedByUserId === auth.user.id),
  });
}
