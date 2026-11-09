import Link from "next/link";
import { Printer } from "lucide-react";
import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { formatINR } from "@/lib/utils";
import { Panel, StatCard } from "@/components/dashboard/DashboardShell";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";

export default async function FamilyBillingPage() {
  const user = await getSession();
  const db = await readDb();
  const bookingIds = new Set(
    db.bookings.filter((b) => b.familyUserId === user?.id).map((b) => b.id),
  );
  const invoices = db.invoices.filter((i) => bookingIds.has(i.bookingId));
  const outstanding = invoices.reduce((s, i) => s + (i.amount - i.paid), 0);
  const paid = invoices.reduce((s, i) => s + i.paid, 0);
  const today = new Date().toISOString().slice(0, 10);
  const overdue = invoices.filter((i) => i.status !== "paid" && i.dueDate < today).length;

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Account · Billing"
        title="Your invoices"
        subtitle="Payment status for care bookings. Settle dues from Live Care via UPI."
        action={
          <Link href="/dashboard/family/live" className="btn btn-primary btn-sm">
            Pay on Live Care
          </Link>
        }
      />

      <div className="dash-grid-stats cols-4">
        <StatCard label="Paid" value={formatINR(paid)} tone="success" />
        <StatCard
          label="Outstanding"
          value={formatINR(outstanding)}
          tone={outstanding > 0 ? "warning" : "default"}
        />
        <StatCard label="Overdue" value={String(overdue)} tone={overdue ? "danger" : "default"} />
        <StatCard label="Invoices" value={String(invoices.length)} />
      </div>

      <Panel title="Invoices" subtitle="Care desk collections update these balances.">
        {invoices.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            description="Billing records appear when a care booking is invoiced by the care desk."
          />
        ) : (
          <div className="space-y-1.5">
            {invoices.map((inv) => {
              const balance = inv.amount - inv.paid;
              const overdueRow = inv.status !== "paid" && inv.dueDate < today;
              const pct = inv.amount > 0 ? Math.round((inv.paid / inv.amount) * 100) : 0;
              return (
                <ListTile key={inv.id} className="animate-dash-in">
                  <ListTileHeader>
                    <div>
                      <p className="font-display text-base text-heading">{inv.id}</p>
                      <ListTileMeta>
                        {inv.patientName} · Due {inv.dueDate}
                        {overdueRow ? " · Overdue" : ""}
                      </ListTileMeta>
                      <p className="mt-2 text-sm text-heading">
                        Paid {formatINR(inv.paid)} / {formatINR(inv.amount)}
                        {balance > 0 ? (
                          <span className="ml-2 font-semibold text-warning">
                            Balance {formatINR(balance)}
                          </span>
                        ) : null}
                      </p>
                      <div className="mt-2 h-1.5 w-40 max-w-full overflow-hidden rounded-full bg-paper-2">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge
                        tone={
                          inv.status === "paid"
                            ? "success"
                            : inv.status === "partial"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {inv.status}
                      </Badge>
                      {overdueRow ? <Badge tone="danger">Overdue</Badge> : null}
                      <Link
                        href={`/print/invoice/${encodeURIComponent(inv.id)}?auto=1&back=${encodeURIComponent("/dashboard/family/billing")}`}
                        className="btn btn-outline btn-sm"
                      >
                        <Printer className="h-3.5 w-3.5" /> Print
                      </Link>
                    </div>
                  </ListTileHeader>
                </ListTile>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
