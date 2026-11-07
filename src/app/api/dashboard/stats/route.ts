import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
  if (!session || !isStaffOpsRole(normalizeRole(session.role))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await readDb();
  const active = db.bookings.filter((b) => b.status === "active").length;
  const pending = db.bookings.filter((b) => b.status === "pending").length;
  const availableStaff = db.staff.filter((s) => s.status === "available").length;
  const revenue = db.invoices.reduce((sum, i) => sum + i.paid, 0);
  const outstanding = db.invoices.reduce((sum, i) => sum + (i.amount - i.paid), 0);

  return NextResponse.json({
    stats: {
      active,
      pending,
      availableStaff,
      revenue,
      outstanding,
      totalStaff: db.staff.length,
      leads: db.leads.filter((l) => l.status === "new").length,
    },
  });
}