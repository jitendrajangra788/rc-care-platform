import { Award, CalendarCheck, Wallet } from "lucide-react";
import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { staffForUser } from "@/lib/scope";
import { formatINR } from "@/lib/utils";
import { computeStaffPerformance } from "@/lib/performance";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { NurseExtras } from "@/components/dashboard/NurseExtras";
import { NurseMobileDock } from "@/components/dashboard/NurseMobileDock";
import { StatCard } from "@/components/ui/StatCard";

export default async function NurseHrPage() {
  await requireRole("nurse");
  const user = await getSession();
  if (!user) return null;
  const db = await readDb();
  const staff = staffForUser(db, user);
  const leaves = db.leaves.filter((l) => l.staffId === staff?.id);
  const documents = db.documents.filter((d) => d.staffId === staff?.id);
  const perf = staff ? computeStaffPerformance(db, staff.id) : null;

  return (
    <div className="dash-stack pb-20 md:pb-0">
      <PageHeader
        eyebrow="Nurse ops · HR"
        title="Leave & documents"
        subtitle="Leave requests, ID/certificate upload, and duty performance score."
      />
      <div className="dash-grid-stats cols-3">
        <StatCard
          label="Performance"
          value={`${perf?.score ?? staff?.performanceScore ?? 80}`}
          hint="Morning + evening completion"
          tone="primary"
          icon={<Award className="h-4 w-4" />}
        />
        <StatCard
          label="Complete days"
          value={String(perf?.completeDays ?? 0)}
          tone="success"
          icon={<CalendarCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Shift rate"
          value={formatINR(staff?.salaryPerShift ?? 0)}
          icon={<Wallet className="h-4 w-4" />}
        />
      </div>
      <NurseExtras leaves={leaves} documents={documents} />
      <NurseMobileDock />
    </div>
  );
}
