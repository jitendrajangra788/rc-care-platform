import { requireOps } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ExpensesPanel } from "@/components/billing/ExpensesPanel";

export default async function AdminExpensesPage() {
  await requireOps();
  const db = await readDb();
  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Finance · Costs"
        title="Business expenses"
        subtitle="Transport, supplies, marketing, and other ops costs with category breakdown."
      />
      <ExpensesPanel expenses={db.expenses || []} staff={db.staff} />
    </div>
  );
}
