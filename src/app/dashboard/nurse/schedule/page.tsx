import Link from "next/link";
import { ClipboardList, MapPinned, CalendarDays, Plane } from "lucide-react";
import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { dutiesForStaff, staffForUser } from "@/lib/scope";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { NurseScheduleBoard } from "@/components/dashboard/NurseScheduleBoard";
import { NurseMobileDock } from "@/components/dashboard/NurseMobileDock";
import { StatCard } from "@/components/ui/StatCard";

export default async function NurseSchedulePage() {
  await requireRole("nurse");
  const user = await getSession();
  if (!user) return null;
  const db = await readDb();
  const staff = staffForUser(db, user);
  const duties = dutiesForStaff(db, staff);
  const leaves = (db.leaves || []).filter((l) => staff && l.staffId === staff.id);
  const active = duties.filter((d) => d.status === "active" || d.status === "assigned");
  const onLeave = leaves.filter((l) => l.status === "approved" || l.status === "pending");

  return (
    <div className="dash-stack !gap-1.5 pb-20 md:!gap-2 md:pb-0">
      <PageHeader
        eyebrow="Roster"
        title="My schedule"
        subtitle="Shifts, locations, and leave."
        action={
          <div className="flex flex-wrap gap-1.5">
            <Link href="/dashboard/nurse/duties" className="btn btn-outline btn-sm">
              <ClipboardList className="h-3.5 w-3.5" /> Duties
            </Link>
            <Link href="/dashboard/nurse/attendance" className="btn btn-primary btn-sm">
              <MapPinned className="h-3.5 w-3.5" /> Present
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-1.5">
        <StatCard
          label="Active"
          value={String(active.length)}
          tone="primary"
          icon={<CalendarDays className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="All"
          value={String(duties.length)}
          icon={<ClipboardList className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Leave"
          value={String(onLeave.length)}
          tone="warning"
          icon={<Plane className="h-3.5 w-3.5" />}
        />
      </div>

      <NurseScheduleBoard duties={duties} leaves={leaves} />
      <NurseMobileDock />
    </div>
  );
}
