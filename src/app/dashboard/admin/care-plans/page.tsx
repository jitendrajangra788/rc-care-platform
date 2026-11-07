import { requireOps } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CarePlansPanel } from "@/components/care/CarePlansPanel";
import { CareReportsPanel } from "@/components/care/CareReportsPanel";

export default async function AdminCarePlansPage() {
  await requireOps();
  const db = await readDb();
  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Clinical"
        title="Care plans"
        subtitle="Goals, tasks, and daily care reports."
      />
      <CarePlansPanel carePlans={db.carePlans || []} patients={db.patients || []} />
      <CareReportsPanel reports={db.careReports || []} patients={db.patients || []} />
    </div>
  );
}
