import Link from "next/link";
import { MapPinned } from "lucide-react";
import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { buildNurseDesk } from "@/lib/nurse-desk";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { NurseDutiesBoard } from "@/components/dashboard/NurseDutiesBoard";
import { NurseMobileDock } from "@/components/dashboard/NurseMobileDock";
import { StatCard } from "@/components/ui/StatCard";
import { ClipboardList, CalendarDays, Activity } from "lucide-react";

export default async function NurseDutiesPage() {
  await requireRole("nurse");
  const user = await getSession();
  if (!user) return null;
  const db = await readDb();
  const desk = buildNurseDesk(db, user);

  return (
    <div className="dash-stack pb-20 md:pb-0">
      <PageHeader
        eyebrow={`Nurse ops · ${formatDate(desk.today)}`}
        title="My duties"
        subtitle="Assigned patients, AM/PM progress, medicine schedules, and floor actions."
        action={
          <Link href="/dashboard/nurse/attendance" className="btn btn-primary">
            <MapPinned className="h-4 w-4" /> Mark present
          </Link>
        }
      />

      <div className="dash-grid-stats cols-3">
        <StatCard
          label="On board today"
          value={String(desk.todayDuties.length)}
          tone="primary"
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatCard
          label="Active assignments"
          value={String(desk.activeDuties.length)}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatCard
          label="Today check-ins"
          value={String(desk.todayAttendanceCount)}
          tone="success"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <NurseDutiesBoard
        today={desk.today}
        duties={desk.duties}
        history={desk.history}
        medSchedules={desk.medSchedules}
      />

      <NurseMobileDock />
    </div>
  );
}
