import { readDb } from "@/lib/db";
import { LeadsManager } from "@/components/dashboard/LeadsManager";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

export default async function AdminLeadsPage() {
  const db = await readDb();
  const neu = db.leads.filter((l) => l.status === "new").length;
  const contacted = db.leads.filter((l) => l.status === "contacted").length;
  const converted = db.leads.filter((l) => l.status === "converted").length;
  const rate =
    db.leads.length === 0 ? 0 : Math.round((converted / db.leads.length) * 100);

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="CRM · Pipeline"
        title="Leads & enquiries"
        subtitle="Kanban pipeline — capture, contact, convert to patient, then book care."
      />
      <div className="dash-grid-stats cols-4">
        <StatCard label="New" value={String(neu)} tone="warning" />
        <StatCard label="Contacted" value={String(contacted)} tone="primary" />
        <StatCard label="Converted" value={String(converted)} tone="success" />
        <StatCard label="Conversion rate" value={`${rate}%`} />
      </div>
      <LeadsManager leads={db.leads} activities={db.activities || []} />
    </div>
  );
}
