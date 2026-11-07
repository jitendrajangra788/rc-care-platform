import { ClipboardList, FileText, UserRound } from "lucide-react";
import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { patientIdsForUser } from "@/lib/scope";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CarePlansPanel } from "@/components/care/CarePlansPanel";
import { CareReportsPanel } from "@/components/care/CareReportsPanel";
import { NurseMobileDock } from "@/components/dashboard/NurseMobileDock";
import { StatCard } from "@/components/ui/StatCard";

export default async function NurseCarePlansPage() {
  await requireRole("nurse");
  const user = await getSession();
  if (!user) return null;
  const db = await readDb();
  const allowed = patientIdsForUser(db, user);
  const patients = (db.patients || []).filter((p) => allowed.has(p.id));
  const carePlans = (db.carePlans || []).filter((p) => allowed.has(p.patientId));
  const reports = (db.careReports || []).filter((r) => allowed.has(r.patientId));
  const activePlans = carePlans.filter((p) => (p.status || "active") === "active").length;

  return (
    <div className="dash-stack pb-20 md:pb-0">
      <PageHeader
        eyebrow="Nurse ops · Clinical"
        title="Care plans"
        subtitle="Plans and daily reports for your assigned patients."
      />
      <div className="dash-grid-stats cols-3">
        <StatCard
          label="Patients"
          value={String(patients.length)}
          tone="primary"
          icon={<UserRound className="h-4 w-4" />}
        />
        <StatCard
          label="Active plans"
          value={String(activePlans)}
          tone="success"
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatCard
          label="Reports"
          value={String(reports.length)}
          icon={<FileText className="h-4 w-4" />}
        />
      </div>
      <CarePlansPanel carePlans={carePlans} patients={patients} canWrite />
      <CareReportsPanel reports={reports} patients={patients} canWrite />
      <NurseMobileDock />
    </div>
  );
}
