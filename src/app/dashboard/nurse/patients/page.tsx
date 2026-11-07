import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileText,
  HeartPulse,
  MapPinned,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { nursePatients } from "@/lib/nurse-desk";
import { formatDate } from "@/lib/format";
import { NursePatientsList } from "@/components/dashboard/NursePatientsList";
import { NurseMobileDock } from "@/components/dashboard/NurseMobileDock";
import { RefreshButton } from "@/components/dashboard/RefreshButton";
import { Badge } from "@/components/ui/Badge";

export default async function NursePatientsPage({
  searchParams,
}: {
  searchParams?: Promise<{ focus?: string }> | { focus?: string };
}) {
  await requireRole("nurse");
  const user = await getSession();
  if (!user) return null;
  const db = await readDb();
  const rows = nursePatients(db, user);
  const sp = await Promise.resolve(searchParams || {});
  const focusRaw = typeof sp.focus === "string" ? sp.focus : "all";
  const initialFocus =
    focusRaw === "today" ||
    focusRaw === "report" ||
    focusRaw === "doctor" ||
    focusRaw === "attendance" ||
    focusRaw === "urgent" ||
    focusRaw === "upcoming"
      ? focusRaw
      : "all";

  const today = rows[0]?.today || new Date().toISOString().slice(0, 10);
  const dayName = new Date(`${today}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
  });

  const activeCount = rows.filter((r) => r.activeBooking).length;
  const pastCount = rows.length - activeCount;
  const reportPending = rows.filter((r) => r.reportPendingToday).length;
  const doctorPending = rows.filter((r) => r.doctorPending).length;
  const attendanceOpen = rows.filter(
    (r) => r.isTodayDuty && !r.attendanceComplete,
  ).length;
  const upcomingDuty = rows.filter((r) => {
    const start = r.activeBooking?.startDate;
    return !!start && start > today;
  }).length;
  const tasksClear = rows.filter(
    (r) => r.pendingTaskCount === 0 && r.activeBooking,
  ).length;
  const urgentCount = rows.filter((r) => r.urgent).length;

  const attention = [
    attendanceOpen > 0
      ? {
          id: "attendance",
          title: "Pending attendance",
          count: attendanceOpen,
          detail: "AM / PM still open on today’s duty",
          href: "/dashboard/nurse/patients?focus=attendance",
          tone: "warning" as const,
          icon: MapPinned,
        }
      : null,
    doctorPending > 0
      ? {
          id: "doctor",
          title: "Doctor review pending",
          count: doctorPending,
          detail: "Reports awaiting clinician check",
          href: "/dashboard/nurse/patients?focus=doctor",
          tone: "primary" as const,
          icon: Stethoscope,
        }
      : null,
    reportPending > 0
      ? {
          id: "report",
          title: "Incomplete care reports",
          count: reportPending,
          detail: "Today’s duty without a care report",
          href: "/dashboard/nurse/patients?focus=report",
          tone: "warning" as const,
          icon: FileText,
        }
      : null,
    upcomingDuty > 0
      ? {
          id: "upcoming",
          title: "Upcoming duty alerts",
          count: upcomingDuty,
          detail: "Assignments starting after today",
          href: "/dashboard/nurse/patients?focus=upcoming",
          tone: "primary" as const,
          icon: CalendarClock,
        }
      : null,
  ].filter(Boolean) as {
    id: string;
    title: string;
    count: number;
    detail: string;
    href: string;
    tone: "warning" | "primary";
    icon: typeof MapPinned;
  }[];

  const kpis = [
    {
      label: "Assigned patients",
      value: String(rows.length),
      hint: "Linked to your caseload",
      icon: UserRound,
      tone: "text-primary",
      soft: "bg-[var(--primary-soft)]",
    },
    {
      label: "Active care",
      value: String(activeCount),
      hint: "Open clinical assignments",
      icon: HeartPulse,
      tone: "text-success",
      soft: "bg-[var(--success-soft)]",
    },
    {
      label: "Attendance pending",
      value: String(attendanceOpen),
      hint: "Complete AM + PM today",
      icon: MapPinned,
      tone: attendanceOpen ? "text-[var(--warning)]" : "text-success",
      soft: attendanceOpen ? "bg-[var(--warning-soft)]" : "bg-[var(--success-soft)]",
    },
    {
      label: "Reports pending",
      value: String(reportPending),
      hint: "Care documentation due",
      icon: FileText,
      tone: reportPending ? "text-[var(--warning)]" : "text-heading",
      soft: reportPending ? "bg-[var(--warning-soft)]" : "bg-paper-2",
    },
  ];

  return (
    <div className="dash-stack max-w-[1480px] pb-20 md:pb-0">
      <section className="ehr-command p-3.5 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[var(--primary-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Clinical worklist
              </span>
              {urgentCount > 0 ? (
                <Badge tone="danger">{urgentCount} urgent</Badge>
              ) : (
                <Badge tone="success">Census stable</Badge>
              )}
            </div>
            <h1 className="font-display mt-2 text-3xl tracking-[-0.03em] text-heading md:text-4xl">
              My Patients
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted md:text-base">
              Manage assigned patients, duty status, documentation, and chart actions from one
              hospital-grade nurse workstation.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{dayName}</Badge>
              <Badge tone="neutral">{formatDate(today)}</Badge>
              <span className="text-xs text-muted">
                Past {pastCount} · Dr review {doctorPending} · Clear {tasksClear}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/nurse/attendance" className="btn btn-primary">
              <MapPinned className="h-4 w-4" /> Attendance desk
            </Link>
            <Link href="/dashboard/nurse/vitals" className="btn btn-outline">
              <HeartPulse className="h-4 w-4" /> Vitals desk
            </Link>
            <RefreshButton label="Refresh census" />
          </div>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="ehr-kpi">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                    {kpi.label}
                  </p>
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${kpi.soft} ${kpi.tone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="font-display mt-2 text-3xl font-semibold tracking-tight text-heading">
                  {kpi.value}
                </p>
                <p className="mt-1 text-sm text-muted">{kpi.hint}</p>
              </div>
            );
          })}
        </div>
      </section>

      {attention.length > 0 ? (
        <section className="ehr-command p-3 md:p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--warning-soft)] text-[var(--warning)]">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-heading">Needs attention</h2>
              <p className="text-xs text-muted">Priority queue — tap to filter the worklist</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {attention.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--line)] bg-white px-3 py-3 transition hover:border-primary/35 hover:bg-[var(--secondary)]"
                >
                  <span
                    className={
                      item.tone === "warning"
                        ? "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--warning-soft)] text-[var(--warning)]"
                        : "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-primary"
                    }
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-heading">{item.title}</span>
                      <span className="font-display text-xl font-semibold text-heading">
                        {item.count}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted">
                      {item.detail}
                    </span>
                    <span className="mt-1.5 inline-flex items-center gap-0.5 text-xs font-semibold text-primary">
                      Open queue
                      <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="flex items-center gap-2 rounded-[var(--radius-xl)] border border-success/25 bg-[var(--success-soft)] px-3 py-2.5 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Worklist clear — attendance, reports, and doctor checks are up to date.
        </section>
      )}

      <NursePatientsList key={initialFocus} rows={rows} initialFocus={initialFocus} />
      <NurseMobileDock />
    </div>
  );
}
