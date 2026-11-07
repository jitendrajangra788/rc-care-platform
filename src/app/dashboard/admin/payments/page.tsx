import { requireOps } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PaymentsPanel } from "@/components/billing/PaymentsPanel";

export default async function AdminPaymentsPage() {
  await requireOps();
  const db = await readDb();
  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Finance · Ledger"
        title="Payments"
        subtitle="Cash / UPI / bank collections against invoices — synced with billing balances."
      />
      <PaymentsPanel payments={db.payments || []} invoices={db.invoices} />
    </div>
  );
}
