import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-guard";
import { readDb } from "@/lib/db";
import { isStaffOpsRole, normalizeRole } from "@/lib/permissions";
import { staffForUser } from "@/lib/scope";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const db = await readDb();
  if (isStaffOpsRole(normalizeRole(auth.user.role))) {
    return NextResponse.json({ leaves: db.leaves || [] });
  }
  const staff = staffForUser(db, auth.user);
  return NextResponse.json({
    leaves: (db.leaves || []).filter((l) => l.staffId === staff?.id),
  });
}
