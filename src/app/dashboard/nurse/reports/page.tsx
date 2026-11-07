import Link from "next/link";
import { FileText, Upload, UserRound } from "lucide-react";
import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { patientIdsForUser } from "@/lib/scope";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { NurseMobileDock } from "@/components/dashboard/NurseMobileDock";
import { NurseReportsHub } from "@/components/dashboard/NurseReportsHub";
import { StatCard } from "@/components/ui/StatCard";

export default async function NurseReportsPage() {
  await requireRole("nurse");
  const user = await getSession();
  if (!user) return null;
  const db = await readDb();
  const allowed = patientIdsForUser(db, user);
  const patients = (db.patients || []).filter((p) => allowed.has(p.id));
  const reports = (db.careReports || [])
    .filter((r) => allowed.has(r.patientId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const complete = reports.filter((r) => (r.reportType || "daily") === "complete").length;
  const withFile = reports.filter((r) => !!r.attachmentUrl).length;

  return (
    <div className="dash-stack pb-20 md:pb-0">
      <PageHeader
        eyebrow="Nurse ops · Clinical"
        title="Care reports"
        subtitle="Daily and complete patient reports — upload files from patient pages."
        action={
          <Link href="/dashboard/nurse/patients" className="btn btn-primary btn-sm">
            <Upload className="h-3.5 w-3.5" /> Upload from patient
          </Link>
        }
      />

      <div className="dash-grid-stats cols-3">
        <StatCard
          label="All reports"
          value={String(reports.length)}
          tone="primary"
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          label="Complete reports"
          value={String(complete)}
          tone="success"
          icon={<Upload className="h-4 w-4" />}
        />
        <StatCard
          label="With attachment"
          value={String(withFile)}
          icon={<UserRound className="h-4 w-4" />}
          hint={`${patients.length} assigned patients`}
        />
      </div>

      <NurseReportsHub reports={reports} patients={patients} />
      <NurseMobileDock />
    </div>
  );
}
