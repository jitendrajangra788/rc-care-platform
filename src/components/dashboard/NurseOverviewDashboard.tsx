import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  MapPinned,
  NotebookPen,
  Sun,
  Moon,
  Syringe,
  UserRound,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import type { ActivityEvent } from "@/lib/types";
import type { NurseDeskContext } from "@/lib/nurse-desk";
import { dutyProgress } from "@/lib/duty";
import { formatINR, cn } from "@/lib/utils";
import { formatDate, formatDateTime, formatPhone } from "@/lib/format";
import { Panel } from "@/components/dashboard/DashboardShell";
import { NurseStatusPill } from "@/components/dashboard/NurseStatusPill";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";

const launch = [
  { href: "/dashboard/nurse/duties", label: "Duties", icon: ClipboardList },
  { href: "/dashboard/nurse/attendance", label: "Present", icon: MapPinned },
  { href: "/dashboard/nurse/patients", label: "Patients", icon: UserRound },
  { href: "/dashboard/nurse/medications", label: "Medicine", icon: Syringe },
  { href: "/dashboard/nurse/notes", label: "Notes", icon: NotebookPen },
  { href: "/dashboard/nurse/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/nurse/vitals", label: "Vitals", icon: Activity },
  { href: "/dashboard/nurse/salary", label: "Salary", icon: Wallet },
] as const;

export function NurseOverviewDashboard({
  desk,
  patientCount,
  notifications,
}: {
  desk: NurseDeskContext;
  patientCount: number;
  notifications: ActivityEvent[];
}) {
  const firstName = desk.user.name.split(" ")[0];
  const progress = desk.currentDuty
    ? dutyProgress(desk.history, desk.currentDuty.id, desk.today)
    : null;

  const nextAction = !desk.currentDuty
    ? {
        href: "/dashboard/nurse/duties",
        label: "View duties",
        hint: "No active duty on the floor right now",
      }
    : progress?.complete
      ? {
          href: "/dashboard/nurse/notes",
          label: "Add care note",
          hint: "AM + PM complete — log vitals for the family",
        }
      : progress?.nextSlot === "evening"
        ? {
            href: "/dashboard/nurse/attendance",
            label: "Mark evening",
            hint: "Morning done — evening check-in unlocks salary",
          }
        : {
            href: "/dashboard/nurse/attendance",
            label: "Mark morning",
            hint: "Start with GPS + photo morning present",
          };

  const queue: {
    id: string;
    title: string;
    detail: string;
    href: string;
    tone: "warning" | "danger" | "primary";
    icon: typeof MapPinned;
  }[] = [];

  if (desk.currentDuty && progress && !progress.complete) {
    queue.push({
      id: "att",
      title: progress.nextSlot === "evening" ? "Evening check-in pending" : "Morning check-in pending",
      detail: desk.currentDuty.patientName,
      href: "/dashboard/nurse/attendance",
      tone: "warning",
      icon: MapPinned,
    });
  }
  if (desk.pendingMedDuties > 0) {
    queue.push({
      id: "med",
      title: `${desk.pendingMedDuties} medicine log${desk.pendingMedDuties > 1 ? "s" : ""} due`,
      detail: "Schedules awaiting today’s MAR entry",
      href: "/dashboard/nurse/medications",
      tone: "warning",
      icon: Syringe,
    });
  }
  if (desk.pendingReports.length > 0) {
    queue.push({
      id: "rep",
      title: `${desk.pendingReports.length} care report${desk.pendingReports.length > 1 ? "s" : ""} open`,
      detail: "Today’s duties without a daily report",
      href: "/dashboard/nurse/reports",
      tone: "primary",
      icon: FileText,
    });
  }

  const doneToday = desk.todayDuties.filter((d) => {
    const p = dutyProgress(desk.history, d.id, desk.today);
    return p.complete;
  }).length;
  const dutyPct =
    desk.todayDuties.length === 0
      ? 0
      : Math.round((doneToday / desk.todayDuties.length) * 100);

  return (
    <div className="space-y-2">
      {/* Shift command hero */}
      <section className="nurse-hero p-3 md:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Shift desk · {formatDate(desk.today)}
            </p>
            <h1 className="font-display mt-1 text-2xl tracking-[-0.03em] text-heading md:text-3xl">
              Hello, {firstName}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted">{nextAction.hint}</p>
            {desk.staff ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone={desk.staff.status === "on-duty" ? "success" : "primary"}>
                  {desk.staff.status}
                </Badge>
                <Badge tone="neutral">★ {desk.staff.rating}</Badge>
                {typeof desk.staff.performanceScore === "number" ? (
                  <Badge tone="neutral">Score {desk.staff.performanceScore}</Badge>
                ) : null}
                <Badge tone="neutral">{formatINR(desk.staff.salaryPerShift || 0)} / shift</Badge>
              </div>
            ) : null}
          </div>
          <Link href={nextAction.href} className="btn btn-primary shrink-0">
            {nextAction.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-3 grid gap-2 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="nurse-hero-chip">
            {!desk.currentDuty ? (
              <div className="py-2">
                <p className="text-sm font-semibold text-heading">No current duty</p>
                <p className="mt-0.5 text-xs text-muted">
                  Assigned active bookings appear here with AM/PM progress.
                </p>
                <Link href="/dashboard/nurse/duties" className="btn btn-outline btn-sm mt-2">
                  Open duty board
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Current duty
                    </p>
                    <p className="font-name mt-0.5 text-xl text-heading">
                      {desk.currentDuty.patientName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {desk.currentDuty.careType} · {desk.currentDuty.shift} ·{" "}
                      {desk.currentDuty.id}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                      {desk.currentDuty.address}
                      {desk.currentDuty.phone ? ` · ${formatPhone(desk.currentDuty.phone)}` : ""}
                    </p>
                  </div>
                  <Badge
                    tone={desk.currentDuty.status === "active" ? "success" : "primary"}
                  >
                    {desk.currentDuty.status}
                  </Badge>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <SlotCard
                    icon={<Sun className="h-4 w-4" />}
                    label="Morning"
                    done={!!progress?.morningDone}
                    active={progress?.nextSlot === "morning"}
                  />
                  <SlotCard
                    icon={<Moon className="h-4 w-4" />}
                    label="Evening"
                    done={!!progress?.eveningDone}
                    active={progress?.nextSlot === "evening"}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/dashboard/nurse/attendance" className="btn btn-primary btn-sm">
                    <MapPinned className="h-3.5 w-3.5" /> Attendance
                  </Link>
                  {desk.currentDuty.patientId ? (
                    <Link
                      href={`/dashboard/nurse/patients/${desk.currentDuty.patientId}`}
                      className="btn btn-outline btn-sm"
                    >
                      Patient
                    </Link>
                  ) : null}
                  <Link href="/dashboard/nurse/medications" className="btn btn-ghost btn-sm">
                    Medicine
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <MiniMetric
              label="Today progress"
              value={`${dutyPct}%`}
              hint={`${doneToday}/${desk.todayDuties.length} duties complete`}
            />
            <MiniMetric
              label="Month earned"
              value={formatINR(desk.monthEarned)}
              hint={`Paid ${formatINR(desk.monthPaid)}`}
            />
            <MiniMetric
              label="Caseload"
              value={String(patientCount)}
              hint={`${desk.activeDuties.length} active assignments`}
            />
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="dash-grid-stats cols-4">
        <StatCard
          label="Today’s duties"
          value={String(desk.todayDuties.length)}
          tone="primary"
          icon={<ClipboardList className="h-4 w-4" />}
          hint={`${desk.upcomingDuties.length} upcoming`}
        />
        <StatCard
          label="Attendance"
          value={
            desk.todayAttendanceCount === 0
              ? "Open"
              : desk.attendanceComplete
                ? "Complete"
                : `${desk.todayAttendanceCount}/2`
          }
          tone={desk.attendanceComplete ? "success" : "warning"}
          icon={<MapPinned className="h-4 w-4" />}
        />
        <StatCard
          label="Pending tasks"
          value={String(queue.length)}
          tone={queue.length ? "warning" : "success"}
          icon={<AlertTriangle className="h-4 w-4" />}
          hint={queue.length ? "Action needed" : "All clear"}
        />
        <StatCard
          label="Completed duties"
          value={String(desk.completedDuties.length)}
          tone="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>

      {/* Priority queue + launch */}
      <div className="grid gap-2 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Action queue"
          subtitle={queue.length ? "Do these next" : "Nothing blocking your shift"}
        >
          {queue.length === 0 ? (
            <div className="flex items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--success-soft)] px-3 py-2.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Floor clear — attendance, meds, and reports look good.
            </div>
          ) : (
            <div className="space-y-1.5">
              {queue.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-[var(--radius-lg)] border border-[var(--line)] bg-paper-2/50 px-2.5 py-2 transition hover:border-primary/30 hover:bg-[var(--secondary)]"
                  >
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                        item.tone === "warning" && "bg-[var(--warning-soft)] text-warning",
                        item.tone === "danger" && "bg-[var(--danger-soft)] text-danger",
                        item.tone === "primary" && "bg-[var(--primary-soft)] text-primary",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-heading">{item.title}</p>
                      <p className="truncate text-xs text-muted">{item.detail}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Quick launch" subtitle="Jump to floor tools">
          <div className="grid grid-cols-4 gap-1.5">
            {launch.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex flex-col items-center gap-1 rounded-[var(--radius-lg)] border border-[var(--line)] bg-paper-2/40 px-1.5 py-2.5 text-center transition hover:border-primary/25 hover:bg-[var(--secondary)]"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[10px] font-semibold text-heading sm:text-[11px]">
                    {a.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Today board */}
      <Panel
        title="Today’s duty board"
        subtitle={`${desk.todayDuties.length} assigned · ${doneToday} complete`}
        action={
          <Link href="/dashboard/nurse/duties" className="btn btn-ghost btn-sm">
            Full board
          </Link>
        }
      >
        {desk.todayDuties.length === 0 ? (
          <EmptyState
            title="No duties today"
            description="When care desk assigns you, patients show here with AM/PM status."
          />
        ) : (
          <div className="space-y-1.5">
            {desk.todayDuties.slice(0, 6).map((d) => {
              const p = dutyProgress(desk.history, d.id, desk.today);
              const step = p.complete ? 2 : p.morningDone ? 1 : 0;
              return (
                <div
                  key={d.id}
                  className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-surface p-2.5 animate-dash-in"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-name text-lg text-heading">{d.patientName}</p>
                        <Badge tone={d.status === "active" ? "success" : "primary"}>
                          {d.status}
                        </Badge>
                        {d.priority === "urgent" ? <Badge tone="danger">Urgent</Badge> : null}
                      </div>
                      <ListTileMeta>
                        {d.careType} · {d.shift}
                        {d.area ? ` · ${d.area}` : ""}
                      </ListTileMeta>
                    </div>
                    <div className="flex gap-1.5">
                      <NurseStatusPill label="AM" ok={p.morningDone} compact />
                      <NurseStatusPill label="PM" ok={p.eveningDone} compact />
                    </div>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {[0, 1].map((i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          step > i ? "bg-primary" : "bg-paper-2",
                        )}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Link href="/dashboard/nurse/attendance" className="btn btn-outline btn-sm">
                      Check in
                    </Link>
                    {d.patientId ? (
                      <Link
                        href={`/dashboard/nurse/patients/${d.patientId}`}
                        className="btn btn-ghost btn-sm"
                      >
                        Open
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <div className="grid gap-2 lg:grid-cols-2">
        <Panel
          title="Upcoming shifts"
          subtitle="Starts after today"
          action={
            <Link href="/dashboard/nurse/schedule" className="btn btn-ghost btn-sm">
              Schedule
            </Link>
          }
        >
          {desk.upcomingDuties.length === 0 ? (
            <EmptyState title="No upcoming shifts" description="New assignments will appear here." />
          ) : (
            <div className="space-y-1.5">
              {desk.upcomingDuties.slice(0, 5).map((d) => (
                <ListTile key={d.id}>
                  <ListTileHeader>
                    <div>
                      <p className="font-semibold text-heading">{d.patientName}</p>
                      <ListTileMeta>
                        {d.careType} · starts {formatDate(d.startDate)}
                        {d.area ? ` · ${d.area}` : ""}
                      </ListTileMeta>
                    </div>
                    <Badge tone="neutral">{d.status}</Badge>
                  </ListTileHeader>
                </ListTile>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Recent activity"
          subtitle="Desk feed"
          action={
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Bell className="h-3.5 w-3.5" /> Live
            </span>
          }
        >
          {notifications.length === 0 ? (
            <EmptyState title="No recent alerts" description="Attendance and duty updates show here." />
          ) : (
            <div className="space-y-1.5">
              {notifications.map((n) => (
                <ListTile key={n.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-heading">{n.title}</p>
                      {n.detail ? <ListTileMeta>{n.detail}</ListTileMeta> : null}
                      <ListTileMeta>{formatDateTime(n.createdAt)}</ListTileMeta>
                    </div>
                    {n.href ? (
                      <Link href={n.href} className="btn btn-ghost btn-sm shrink-0">
                        Open
                      </Link>
                    ) : null}
                  </div>
                </ListTile>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function SlotCard({
  icon,
  label,
  done,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border px-3 py-2.5",
        done && "border-success/30 bg-[var(--success-soft)]",
        active && !done && "border-primary/35 bg-[var(--primary-soft)]",
        !done && !active && "border-[var(--line)] bg-surface/70",
      )}
    >
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-heading">
        {done ? "Done" : active ? "Next up" : "Waiting"}
      </p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="nurse-hero-chip">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-display mt-0.5 text-xl font-semibold text-heading">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted">{hint}</p>
    </div>
  );
}
