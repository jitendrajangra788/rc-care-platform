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
import { leadFunnelColors } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
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
  const activities = (db.activities || []).slice(0, 10);

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
      detail: "Priority care cases",
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
      detail: `${formatCurrency(outstanding)} due`,
      href: "/dashboard/admin/billing",
      tone: "warning",
    });
  if (newLeads > 0)
    alerts.push({
      title: `${newLeads} new leads`,
      detail: "Enquiry pipeline",
      href: "/dashboard/admin/leads",
      tone: "primary",
    });
  if (weakGps > 0)
    alerts.push({
      title: `${weakGps} weak GPS`,
      detail: "Review attendance",
      href: "/dashboard/admin/attendance",
      tone: "warning",
    });
  if (workload.unassigned > 0)
    alerts.push({
      title: `${workload.unassigned} unassigned today`,
      detail: "Needs nurse",
      href: "/dashboard/admin/schedule",
      tone: "warning",
    });

  const shortcuts = [
    { href: "/dashboard/admin/bookings", label: "Bookings", icon: CalendarDays },
    { href: "/dashboard/admin/schedule", label: "Schedule", icon: ClipboardList },
    { href: "/dashboard/admin/staff", label: "Staff", icon: Users },
    { href: "/dashboard/admin/attendance", label: "Attendance", icon: MapPinned },
    { href: "/dashboard/admin/billing", label: "Billing", icon: Receipt },
  ] as const;

  return (
    <div className="dash-stack !gap-1.5 md:!gap-2">
      <PageHeader
        eyebrow="Admin"
        title="Care desk"
        subtitle="Bookings, staff, collections, and alerts."
        action={
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href="/dashboard/admin/schedule" className="btn btn-outline btn-sm hidden sm:inline-flex">
              Schedule
            </Link>
            <Link href="/dashboard/admin/bookings" className="btn btn-primary btn-sm">
              New booking <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        }
      />

      {/* Compact shortcut rail */}
      <div className="chip-rail -mx-0.5 overflow-x-auto px-0.5 pb-0.5">
        {shortcuts.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-2.5 py-1.5 text-xs font-semibold text-heading shadow-[var(--shadow-xs)] transition hover:border-primary/30 hover:bg-[var(--primary-soft)]"
          >
            <Icon className="h-3.5 w-3.5 text-primary" />
            {label}
          </Link>
        ))}
      </div>

      <div className="dash-grid-stats cols-4">
        <StatCard
          label="Today's duties"
          value={String(todayActiveDuties.length)}
          hint={`${workload.total} on board · ${workload.unassigned} open`}
          tone="primary"
          icon={<ClipboardList className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Pending / open"
          value={String(pendingUnassigned.length)}
          hint={`${pending} pending · ${active} active`}
          tone={pendingUnassigned.length > 0 ? "warning" : "default"}
          icon={<CalendarDays className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Active nurses"
          value={String(onDutyNurses)}
          hint={`${availableStaff} free · ${todayAttendance} present`}
          tone="success"
          icon={<Users className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(outstanding)}
          hint={`${unpaidInvoices} open · ${formatCurrency(revenue)} paid`}
          tone={outstanding > 0 ? "warning" : "default"}
          icon={<Receipt className="h-3.5 w-3.5" />}
        />
      </div>

      {alerts.length > 0 ? (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 md:flex-wrap md:overflow-visible">
          {alerts.map((a) => (
            <Link
              key={a.title}
              href={a.href}
              className={cn(
                "inline-flex min-w-[11rem] shrink-0 items-start gap-1.5 rounded-[0.75rem] border px-2.5 py-2 md:min-w-0 md:flex-1",
                a.tone === "danger" && "border-danger/25 bg-[var(--danger-soft)]",
                a.tone === "warning" && "border-warning/25 bg-[var(--warning-soft)]",
                a.tone === "primary" && "border-primary/25 bg-[var(--primary-soft)]",
              )}
            >
              <AlertTriangle
                className={cn(
                  "mt-0.5 h-3.5 w-3.5 shrink-0",
                  a.tone === "danger" && "text-danger",
                  a.tone === "warning" && "text-warning",
                  a.tone === "primary" && "text-primary",
                )}
              />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-heading">{a.title}</span>
                <span className="block text-[10px] text-muted">{a.detail}</span>
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      <AdminCharts revenue={revenueSeries} funnel={funnel} />

      <div className="grid gap-2 lg:grid-cols-3">
        <Panel
          title="Today's duties"
          action={
            <Link href="/dashboard/admin/schedule" className="text-xs font-semibold text-primary">
              Schedule →
            </Link>
          }
        >
          {todayActiveDuties.length === 0 ? (
            <p className="py-2 text-sm text-muted">No active duties today.</p>
          ) : (
            <div className="space-y-1">
              {todayActiveDuties.slice(0, 6).map((b) => {
                const nurse = db.staff.find((s) => s.id === b.assignedStaffId);
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-2 rounded-[0.7rem] bg-[var(--surface-muted)]/70 px-2 py-1.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-heading">{b.patientName}</p>
                      <p className="truncate text-[10px] text-muted">
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
            <Link href="/dashboard/admin/bookings" className="text-xs font-semibold text-primary">
              Manage →
            </Link>
          }
        >
          {pendingUnassigned.length === 0 ? (
            <p className="py-2 text-sm text-muted">Queue clear.</p>
          ) : (
            <div className="space-y-1">
              {pendingUnassigned.slice(0, 6).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-2 rounded-[0.7rem] bg-[var(--surface-muted)]/70 px-2 py-1.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-heading">{b.patientName}</p>
                    <p className="truncate text-[10px] text-muted">
                      {b.id} · {b.careType} · {b.shift}
                    </p>
                  </div>
                  <StatusBadge
                    status={b.status}
                    label={
                      !b.assignedStaffId && b.status !== "pending" ? "unassigned" : undefined
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
            <Link href="/dashboard/admin/leads" className="text-xs font-semibold text-primary">
              All →
            </Link>
          }
        >
          {db.leads.length === 0 ? (
            <p className="py-2 text-sm text-muted">No leads yet.</p>
          ) : (
            <div className="space-y-1">
              {db.leads.slice(0, 5).map((l) => (
                <div
                  key={l.id}
                  className="rounded-[0.7rem] border border-[var(--line)] px-2 py-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-heading">{l.name}</p>
                    <StatusBadge status={l.status} />
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-muted">
                    {l.careType} · {l.phone}
                  </p>
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
          <ol className="relative ml-1.5 space-y-0 border-l border-[var(--line)]">
            {activities.map((a) => (
              <li key={a.id} className="relative pb-2.5 pl-4 last:pb-0">
                <span className="absolute -left-[4px] top-1.5 h-2 w-2 rounded-full bg-[#087F8C] ring-2 ring-white" />
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                  <p className="text-sm font-semibold text-heading">{a.title}</p>
                  <p className="text-[10px] text-muted">
                    {new Date(a.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {a.detail ? (
                  <p className="line-clamp-1 text-[11px] text-muted">{a.detail}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
