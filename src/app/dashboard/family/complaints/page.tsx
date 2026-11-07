import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ComplaintsPanel } from "@/components/dashboard/ComplaintsPanel";

export default async function FamilyComplaintsPage() {
  await requireRole("family");
  const user = await getSession();
  const db = await readDb();
  const complaints = (db.complaints || []).filter((c) => c.raisedByUserId === user?.id);
  return (
    <div className="dash-stack">
      <PageHeader eyebrow="Support" title="Complaints" subtitle="Raise issues with the care desk." />
      <ComplaintsPanel complaints={complaints} />
    </div>
  );
}
