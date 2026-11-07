import Link from "next/link";
import { MapPinned, Clock3, CheckCircle2 } from "lucide-react";
import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { staffForUser } from "@/lib/scope";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/DashboardShell";
import { NurseMobileDock } from "@/components/dashboard/NurseMobileDock";
import { NurseHistoryList } from "@/components/dashboard/NurseHistoryList";
import { StatCard } from "@/components/ui/StatCard";

export default async function NurseAttendanceHistoryPage() {
  await requireRole("nurse");
  const user = await getSession();
  if (!user) return null;
  const db = await readDb();
  const staff = staffForUser(db, user);
  const history = db.attendance
    .filter((a) => a.staffId === staff?.id || a.nurseId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a) => {
      const booking = db.bookings.find((b) => b.id === a.bookingId);
      return { ...a, patientName: booking?.patientName };
    });
  const lateCount = history.filter((a) => a.punctualityStatus === "late").length;
  const onSite = history.filter((a) => a.withinGeofence).length;

  return (
    <div className="dash-stack pb-20 md:pb-0">
      <PageHeader
        eyebrow="Nurse ops · Attendance"
        title="Attendance history"
        subtitle="Past morning and evening marks with punctuality and GPS status."
        action={
          <Link href="/dashboard/nurse/attendance" className="btn btn-primary btn-sm">
            <MapPinned className="h-3.5 w-3.5" /> Mark present
          </Link>
        }
      />

      <div className="dash-grid-stats cols-3">
        <StatCard
          label="Total marks"
          value={String(history.length)}
          tone="primary"
          icon={<Clock3 className="h-4 w-4" />}
        />
        <StatCard
          label="On site"
          value={String(onSite)}
          tone="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Late marks"
          value={String(lateCount)}
          tone={lateCount ? "warning" : "default"}
        />
      </div>

      <Panel title="History" subtitle={`${history.length} marks`}>
        <NurseHistoryList history={history} />
      </Panel>
      <NurseMobileDock />
    </div>
  );
}
