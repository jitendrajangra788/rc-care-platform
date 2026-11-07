import { Activity, HeartPulse, UserRound } from "lucide-react";
import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { patientIdsForUser } from "@/lib/scope";
import { todayDutyDate } from "@/lib/duty";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { VitalsPanel } from "@/components/care/VitalsPanel";
import { NurseMobileDock } from "@/components/dashboard/NurseMobileDock";
import { StatCard } from "@/components/ui/StatCard";

export default async function NurseVitalsPage() {
  await requireRole("nurse");
  const user = await getSession();
  if (!user) return null;
  const db = await readDb();
  const allowed = patientIdsForUser(db, user);
  const patients = (db.patients || []).filter((p) => allowed.has(p.id));
  const vitals = (db.vitals || []).filter((v) => allowed.has(v.patientId));
  const today = todayDutyDate();
  const todayCount = vitals.filter((v) => (v.recordedAt || v.createdAt || "").slice(0, 10) === today)
    .length;

  return (
    <div className="dash-stack pb-20 md:pb-0">
      <PageHeader
        eyebrow="Nurse ops · Clinical"
        title="Vitals"
        subtitle="Record and review vitals for your assigned patients."
      />
      <div className="dash-grid-stats cols-3">
        <StatCard
          label="Assigned patients"
          value={String(patients.length)}
          tone="primary"
          icon={<UserRound className="h-4 w-4" />}
        />
        <StatCard
          label="Today’s vitals"
          value={String(todayCount)}
          tone="success"
          icon={<HeartPulse className="h-4 w-4" />}
        />
        <StatCard
          label="All records"
          value={String(vitals.length)}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>
      <VitalsPanel vitals={vitals} patients={patients} canWrite />
      <NurseMobileDock />
    </div>
  );
}
