import Link from "next/link";
import { Settings } from "lucide-react";
import { defaultSettings } from "@/lib/defaults";
import { readDb } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { StatCard } from "@/components/dashboard/DashboardShell";
import { BillingManager } from "@/components/dashboard/BillingManager";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function AdminBillingPage() {
  const db = await readDb();
  const settings = { ...defaultSettings, ...(db.settings || {}) };
  const collected = db.invoices.reduce((s, i) => s + i.paid, 0);
  const billed = db.invoices.reduce((s, i) => s + i.amount, 0);
  const due = db.invoices.reduce((s, i) => s + (i.amount - i.paid), 0);
  const today = new Date().toISOString().slice(0, 10);
  const overdue = db.invoices.filter(
    (i) => i.status !== "paid" && i.dueDate < today,
  ).length;
  const rate = billed > 0 ? Math.round((collected / billed) * 100) : 0;

  return (
    <div className="dash-stack !gap-1.5 md:!gap-2">
      <PageHeader
        eyebrow="Finance"
        title="Billing"
        subtitle={`${settings.orgName} receivables · print invoices with logo from Settings.`}
        action={
          <Link href="/dashboard/admin/settings" className="btn btn-outline btn-sm">
            <Settings className="h-3.5 w-3.5" /> Branding
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-[0.9rem] border border-[var(--line)] bg-white px-3 py-2.5 shadow-[var(--shadow-xs)]">
        <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-[0.7rem] bg-[var(--primary-soft)]">
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <span className="font-display text-sm font-semibold text-primary">
              {settings.orgName.slice(0, 1)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-heading">{settings.orgName}</p>
          <p className="truncate text-[11px] text-muted">
            {[settings.supportPhone, settings.supportEmail, settings.gstin ? `GST ${settings.gstin}` : null]
              .filter(Boolean)
              .join(" · ") || "Add logo & contacts in Settings"}
          </p>
        </div>
        {settings.upiId ? (
          <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-[11px] font-semibold text-primary">
            UPI {settings.upiId}
          </span>
        ) : null}
      </div>

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
          label="Overdue"
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
