import { requireOps } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { todayISO } from "@/lib/schedule";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ReportsOverview } from "@/components/dashboard/ReportsOverview";

export default async function AdminReportsPage() {
  await requireOps();
  const db = await readDb();
  const today = todayISO();
  const activeBookings = db.bookings.filter((b) => b.status === "active" || b.status === "assigned");
  const unpaid = db.invoices.filter((i) => i.status !== "paid");
  const data = {
    asOf: today,
    kpis: {
      patients: (db.patients || []).filter((p) => p.status === "active").length,
      activeBookings: activeBookings.length,
      openComplaints: (db.complaints || []).filter((c) => c.status === "open").length,
      openSos: (db.sosAlerts || []).filter((s) => s.status === "open").length,
      dues: unpaid.reduce((s, i) => s + (i.amount - i.paid), 0),
      expensesMonth: (db.expenses || [])
        .filter((e) => e.date.slice(0, 7) === today.slice(0, 7))
        .reduce((s, e) => s + e.amount, 0),
      payoutsMonth: (db.salaryPayouts || [])
        .filter((p) => p.dutyDate.slice(0, 7) === today.slice(0, 7))
        .reduce((s, p) => s + p.amount, 0),
      paymentsMonth: (db.payments || [])
        .filter((p) => p.createdAt.slice(0, 7) === today.slice(0, 7))
        .reduce((s, p) => s + p.amount, 0),
    },
    byStatus: db.bookings.reduce(
      (acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    staffLoad: db.staff.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      activeDuties: activeBookings.filter((b) => b.assignedStaffId === s.id).length,
    })),
  };

  return (
    <div className="dash-stack">
      <PageHeader eyebrow="Analytics" title="Reports" subtitle={`Ops snapshot as of ${today}.`} />
      <ReportsOverview data={data} />
    </div>
  );
}
