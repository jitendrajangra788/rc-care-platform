import { readDb } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { StatCard } from "@/components/dashboard/DashboardShell";
import { BillingManager } from "@/components/dashboard/BillingManager";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function AdminBillingPage() {
  const db = await readDb();
  const collected = db.invoices.reduce((s, i) => s + i.paid, 0);
  const billed = db.invoices.reduce((s, i) => s + i.amount, 0);
  const due = db.invoices.reduce((s, i) => s + (i.amount - i.paid), 0);
  const today = new Date().toISOString().slice(0, 10);
  const overdue = db.invoices.filter(
    (i) => i.status !== "paid" && i.dueDate < today,
  ).length;
  const rate = billed > 0 ? Math.round((collected / billed) * 100) : 0;

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Finance · Receivables"
        title="Billing"
        subtitle="Create invoices, collect payments, track overdue dues, and sync the payment ledger."
      />
      <div className="dash-grid-stats cols-4">
        <StatCard
          label="Collected"
          value={formatCurrency(collected)}
          tone="success"
          hint={`${rate}% of billed`}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(due)}
          tone={due > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Overdue invoices"
          value={String(overdue)}
          tone={overdue ? "danger" : "default"}
        />
        <StatCard label="Invoices" value={String(db.invoices.length)} />
      </div>
      <BillingManager
        invoices={db.invoices}
        bookings={db.bookings}
        patients={db.patients || []}
      />
    </div>
  );
}
