import { requireOps } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ComplaintsPanel } from "@/components/dashboard/ComplaintsPanel";

export default async function AdminComplaintsPage() {
  await requireOps();
  const db = await readDb();
  return (
    <div className="dash-stack">
      <PageHeader eyebrow="Support" title="Complaints" subtitle="Track and resolve family or patient issues." />
      <ComplaintsPanel complaints={db.complaints || []} canManage />
    </div>
  );
}
