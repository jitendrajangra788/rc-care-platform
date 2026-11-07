import { requireOps } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { VitalsPanel } from "@/components/care/VitalsPanel";

export default async function AdminVitalsPage() {
  await requireOps();
  const db = await readDb();
  return (
    <div className="dash-stack">
      <PageHeader eyebrow="Clinical" title="Vitals timeline" subtitle="BP, sugar, pulse, temp, SpO2 by patient." />
      <VitalsPanel vitals={db.vitals || []} patients={db.patients || []} />
    </div>
  );
}
