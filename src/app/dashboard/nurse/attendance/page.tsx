import Link from "next/link";
import {
  Activity,
  ClipboardList,
  History,
  MapPinned,
} from "lucide-react";
import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { buildNurseDesk } from "@/lib/nurse-desk";
import { formatDate } from "@/lib/format";
import { AttendancePanel } from "@/components/dashboard/AttendancePanel";
import { NurseMobileDock } from "@/components/dashboard/NurseMobileDock";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";

export default async function NurseAttendancePage() {
  await requireRole("nurse");
  const user = await getSession();
  if (!user) return null;
  const db = await readDb();
  const desk = buildNurseDesk(db, user);

  const dayName = new Date(`${desk.today}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
  });

  const statusLabel = desk.attendanceComplete
    ? "Duty Completed"
    : desk.todayAttendanceCount >= 2
      ? "Evening Completed"
      : desk.todayAttendanceCount === 1
        ? "Morning Completed"
        : "Not Started";

  const statusTone = desk.attendanceComplete
    ? "success"
    : desk.todayAttendanceCount === 0
      ? "warning"
      : "primary";

  return (
    <div className="dash-stack max-w-[1400px] pb-20 md:pb-0">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-label text-primary">Nurse ops · Attendance</p>
          <h1 className="font-display mt-0.5 text-display-lg text-heading">Attendance</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Manage your daily nursing duty check-in and check-out.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{dayName}</Badge>
            <Badge tone="neutral">{formatDate(desk.today)}</Badge>
            <Badge tone={statusTone}>{statusLabel}</Badge>
          </div>
        </div>
        <Link href="/dashboard/nurse/attendance/history" className="btn btn-outline shrink-0">
          <History className="h-4 w-4" /> History
        </Link>
      </header>

      <div className="dash-grid-stats cols-3">
        <StatCard
          label="Active duties"
          value={String(desk.activeDuties.length)}
          tone="primary"
          icon={<ClipboardList className="h-4 w-4" />}
          hint="Assigned care sites"
        />
        <StatCard
          label="Today’s attendance"
          value={
            desk.todayAttendanceCount === 0
              ? "0 / 2"
              : desk.attendanceComplete
                ? "2 / 2"
                : `${desk.todayAttendanceCount} / 2`
          }
          tone={desk.attendanceComplete ? "success" : "warning"}
          icon={<MapPinned className="h-4 w-4" />}
          hint="Morning + evening marks"
        />
        <StatCard
          label="Current status"
          value={statusLabel}
          tone={desk.attendanceComplete ? "success" : "default"}
          icon={<Activity className="h-4 w-4" />}
          hint={
            desk.attendanceComplete
              ? "Salary eligible for completed duty"
              : "Complete AM + PM to earn"
          }
        />
      </div>

      <AttendancePanel
        duties={desk.activeDuties}
        history={desk.history}
        salaryPerShift={desk.staff?.salaryPerShift || 700}
      />
      <NurseMobileDock />
    </div>
  );
}
