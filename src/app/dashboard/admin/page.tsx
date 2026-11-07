import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  MapPinned,
  Receipt,
  Users,
} from "lucide-react";
import { readDb } from "@/lib/db";
import { todayDutyDate } from "@/lib/duty";
import { formatCurrency } from "@/lib/format";
import { dailyWorkload } from "@/lib/schedule";
import {
  AdminCharts,
  type FunnelPoint,
  type RevenuePoint,
} from "@/components/dashboard/AdminCharts";
import { Panel } from "@/components/dashboard/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconBadge } from "@/components/ui/IconBadge";
import { leadFunnelColors } from "@/lib/design-tokens";

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
}

function buildRevenueSeries(
  invoices: { amount: number; paid: number; dueDate: string }[],
  payments: { amount: number; createdAt: string }[],
  months = 6,
): RevenuePoint[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }

  const billed = Object.fromEntries(keys.map((k) => [k, 0]));
  const collected = Object.fromEntries(keys.map((k) => [k, 0]));

  for (const inv of invoices) {
    const k = monthKey(inv.dueDate);
    if (k in billed) billed[k] += inv.amount;
  }

  if (payments.length > 0) {
    for (const p of payments) {
      const k = monthKey(p.createdAt);
      if (k in collected) collected[k] += p.amount;
    }
  } else {
    for (const inv of invoices) {
      const k = monthKey(inv.dueDate);
      if (k in collected) collected[k] += inv.paid;
    }
  }

  return keys.map((k) => ({
    month: monthLabel(k),
    billed: billed[k],
    collected: collected[k],
  }));
}

export default async function AdminDashboardPage() {
  const db = await readDb();
  const today = todayDutyDate();

  const totalBookings = db.bookings.length;
  const active = db.bookings.filter((b) => b.status === "active").length;
  const pending = db.bookings.filter((b) => b.status === "pending").length;
  const onDutyNurses = db.staff.filter((s) => s.status === "on-duty").length;
  const availableStaff = db.staff.filter((s) => s.status === "available").length;
  const todayAttendance = db.attendance.filter(
    (a) => (a.dutyDate || a.createdAt.slice(0, 10)) === today,
  ).length;
  const revenue = db.invoices.reduce((sum, i) => sum + i.paid, 0);
  const outstanding = db.invoices.reduce((sum, i) => sum + (i.amount - i.paid), 0);
  const unpaidInvoices = db.invoices.filter((i) => i.status !== "paid").length;
  const openSos = (db.sosAlerts || []).filter((s) => s.status === "open").length;
  const pendingLeaves = (db.leaves || []).filter((l) => l.status === "pending").length;
  const newLeads = db.leads.filter((l) => l.status === "new").length;
  const weakGps = db.attendance.filter((a) => a.gpsQuality === "weak").length;
  const activities = (db.activities || []).slice(0, 8);

  const workload = dailyWorkload(db.bookings, today);
  const todayActiveDuties = workload.bookings.filter(
    (b) => b.status === "active" || b.status === "assigned",
  );
  const pendingUnassigned = db.bookings.filter(
    (b) =>
      b.status === "pending" ||
      (!b.assignedStaffId && b.status !== "completed" && b.status !== "cancelled"),
  );
  const urgentBookings = db.bookings.filter(
    (b) =>
      b.priority === "urgent" &&
      b.status !== "completed" &&
      b.status !== "cancelled",
  );

  const contactedLeads = db.leads.filter((l) => l.status === "contacted").length;
  const convertedLeads = db.leads.filter((l) => l.status === "converted").length;
  const funnelStages = [
    { name: "New", key: "new", value: newLeads },
    { name: "Contacted", key: "contacted", value: contactedLeads },
    { name: "Converted", key: "converted", value: convertedLeads },
  ] as const;
  const funnel: FunnelPoint[] = funnelStages.map((s, i) => ({
    name: s.name,
    value: s.value,
    fill: leadFunnelColors(s.key, i),
  }));

  const revenueSeries = buildRevenueSeries(db.invoices, db.payments || []);

  const alerts: {
    title: string;
    detail: string;
    href: string;
    tone: "warning" | "danger" | "primary";
  }[] = [];
  if (openSos > 0)
    alerts.push({
      title: `${openSos} open SOS`,
      detail: "Emergency desk needs response",
      href: "/dashboard/admin/ops",
      tone: "danger",
    });
  if (urgentBookings.length > 0)
    alerts.push({
      title: `${urgentBookings.length} urgent bookings`,
      detail: "Priority care cases need attention",
      href: "/dashboard/admin/bookings",
      tone: "danger",
    });
  if (pendingLeaves > 0)
    alerts.push({
      title: `${pendingLeaves} leave requests`,
      detail: "Pending HR approval",
      href: "/dashboard/admin/ops",
      tone: "warning",
    });
  if (unpaidInvoices > 0)
    alerts.push({
      title: `${unpaidInvoices} unpaid invoices`,
      detail: `${formatCurrency(outstanding)} outstanding`,
      href: "/dashboard/admin/billing",
      tone: "warning",
    });
  if (newLeads > 0)
    alerts.push({
      title: `${newLeads} new leads`,
      detail: "Enquiry pipeline waiting",
      href: "/dashboard/admin/leads",
      tone: "primary",
    });
  if (weakGps > 0)
    alerts.push({
      title: `${weakGps} weak GPS marks`,
      detail: "Review attendance trail",
      href: "/dashboard/admin/attendance",
      tone: "warning",
    });
  if (workload.unassigned > 0)
    alerts.push({
      title: `${workload.unassigned} unassigned today`,
      detail: "Duties without a nurse",
      href: "/dashboard/admin/schedule",
      tone: "warning",
    });

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Admin"
        title="Care desk overview"
        subtitle="Live snapshot of bookings, staff, attendance, collections, and ops alerts."
        action={
          <Link href="/dashboard/admin/bookings" className="btn btn-primary btn-sm">
            New booking <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="dash-grid-stats cols-4">
        <StatCard
          label="Today's active duties"
          value={String(todayActiveDuties.length)}
          hint={`${workload.total} on board · ${workload.unassigned} unassigned`}
          tone="primary"
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatCard
          label="Pending / unassigned"
          value={String(pendingUnassigned.length)}
          hint={`${pending} pending · ${active} active overall`}
          tone={pendingUnassigned.length > 0 ? "warning" : "default"}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatCard
          label="Active nurses"
          value={String(onDutyNurses)}
          hint={`${availableStaff} available · ${todayAttendance} attendance today`}
          tone="success"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Pending payments"
          value={formatCurrency(outstanding)}
          hint={`${unpaidInvoices} invoices open · ${formatCurrency(revenue)} collected`}
          tone={outstanding > 0 ? "warning" : "default"}
          icon={<Receipt className="h-4 w-4" />}
        />
      </div>

      <AdminCharts revenue={revenueSeries} funnel={funnel} />

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["/dashboard/admin/bookings", "Bookings", CalendarDays],
          ["/dashboard/admin/staff", "Staff", Users],
          ["/dashboard/admin/attendance", "Attendance", MapPinned],
          ["/dashboard/admin/billing", "Billing", Receipt],
        ].map(([href, label, Icon]) => (
          <Link
            key={href as string}
            href={href as string}
            className="rc-card flex items-center gap-2 p-4"
          >
            <IconBadge tone="primary">
              <Icon className="h-4 w-4" />
            </IconBadge>
            <span className="text-sm font-semibold text-heading">{label as string}</span>
            <ArrowUpRight className="ml-auto h-4 w-4 text-muted" />
          </Link>
        ))}
      </div>

      {alerts.length > 0 ? (
        <Panel title="Operational alerts" subtitle="Items that need desk attention">
          <div className="grid gap-2 md:grid-cols-2">
            {alerts.map((a) => (
              <Link
                key={a.title}
                href={a.href}
                className="flex items-start gap-2 rounded-[var(--radius-lg)] border border-[var(--line)] bg-paper-2/80 px-2.5 py-2 transition hover:border-primary/25"
              >
                <AlertTriangle
                  className={
                    a.tone === "danger"
                      ? "mt-0.5 h-4 w-4 text-danger"
                      : a.tone === "warning"
                        ? "mt-0.5 h-4 w-4 text-warning"
                        : "mt-0.5 h-4 w-4 text-primary"
                  }
                />
                <div>
                  <p className="text-sm font-semibold text-heading">{a.title}</p>
                  <p className="text-xs text-muted">{a.detail}</p>
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-2 xl:grid-cols-3">
        <Panel
          title="Today's duties"
          action={
            <Link href="/dashboard/admin/schedule" className="text-sm font-semibold text-primary">
              Schedule →
            </Link>
          }
        >
          {todayActiveDuties.length === 0 ? (
            <EmptyState
              title="No active duties today"
              description="Assigned care shifts for today will appear here."
            />
          ) : (
            <div className="space-y-1.5">
              {todayActiveDuties.slice(0, 6).map((b) => {
                const nurse = db.staff.find((s) => s.id === b.assignedStaffId);
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-2 rounded-[var(--radius-lg)] bg-paper-2 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-name truncate text-heading">{b.patientName}</p>
                      <p className="text-xs text-muted">
                        {b.careType} · {b.shift}
                        {nurse ? ` · ${nurse.name}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel
          title="Pending / unassigned"
          action={
            <Link href="/dashboard/admin/bookings" className="text-sm font-semibold text-primary">
              Manage →
            </Link>
          }
        >
          {pendingUnassigned.length === 0 ? (
            <EmptyState
              title="Queue clear"
              description="No pending or unassigned bookings."
            />
          ) : (
            <div className="space-y-1.5">
              {pendingUnassigned.slice(0, 6).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-2 rounded-[var(--radius-lg)] bg-paper-2 px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-name truncate text-heading">{b.patientName}</p>
                    <p className="text-xs text-muted">
                      {b.id} · {b.careType} · {b.shift}
                    </p>
                  </div>
                  <StatusBadge
                    status={b.status}
                    label={
                      !b.assignedStaffId && b.status !== "pending"
                        ? "unassigned"
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="New leads"
          action={
            <Link href="/dashboard/admin/leads" className="text-sm font-semibold text-primary">
              All leads →
            </Link>
          }
        >
          {db.leads.length === 0 ? (
            <EmptyState title="No leads" description="Enquiries will appear here." />
          ) : (
            <div className="space-y-1.5">
              {db.leads.slice(0, 5).map((l) => (
                <div
                  key={l.id}
                  className="rounded-[var(--radius-lg)] border border-[var(--line)] px-2.5 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-name text-heading">{l.name}</p>
                    <StatusBadge status={l.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {l.careType} · {l.phone}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{l.message}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Recent activity" subtitle={`${totalBookings} bookings on record`}>
        {activities.length === 0 ? (
          <EmptyState title="No activity yet" description="Ops feed fills as teams work." />
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            {activities.map((a) => (
              <div key={a.id} className="rounded-[var(--radius-lg)] bg-paper-2 px-2.5 py-2">
                <p className="text-sm font-semibold text-heading">{a.title}</p>
                {a.detail ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">{a.detail}</p>
                ) : null}
                <p className="mt-1 text-[11px] text-muted">
                  {new Date(a.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
