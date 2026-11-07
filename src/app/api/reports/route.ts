import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-guard";
import { readDb } from "@/lib/db";
import { todayISO } from "@/lib/schedule";

export async function GET() {
  const auth = await requirePermission("reports.read");
  if ("error" in auth) return auth.error;
  const db = await readDb();
  const today = todayISO();

  const activeBookings = db.bookings.filter(
    (b) => b.status === "active" || b.status === "assigned",
  );
  const unpaid = db.invoices.filter((i) => i.status !== "paid");
  const dues = unpaid.reduce((s, i) => s + (i.amount - i.paid), 0);
  const expensesMonth = (db.expenses || [])
    .filter((e) => e.date.slice(0, 7) === today.slice(0, 7))
    .reduce((s, e) => s + e.amount, 0);
  const payoutsMonth = (db.salaryPayouts || [])
    .filter((p) => p.dutyDate.slice(0, 7) === today.slice(0, 7))
    .reduce((s, p) => s + p.amount, 0);
  const paymentsMonth = (db.payments || [])
    .filter((p) => p.createdAt.slice(0, 7) === today.slice(0, 7))
    .reduce((s, p) => s + p.amount, 0);

  const byStatus = db.bookings.reduce(
    (acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const staffLoad = db.staff.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    activeDuties: activeBookings.filter((b) => b.assignedStaffId === s.id).length,
  }));

  return NextResponse.json({
    asOf: today,
    kpis: {
      patients: (db.patients || []).filter((p) => p.status === "active").length,
      activeBookings: activeBookings.length,
      openComplaints: (db.complaints || []).filter((c) => c.status === "open").length,
      openSos: (db.sosAlerts || []).filter((s) => s.status === "open").length,
      dues,
      expensesMonth,
      payoutsMonth,
      paymentsMonth,
    },
    byStatus,
    staffLoad,
    recentPayments: (db.payments || []).slice(0, 10),
    recentExpenses: (db.expenses || []).slice(0, 10),
  });
}
