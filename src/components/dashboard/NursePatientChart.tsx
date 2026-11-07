"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  FileText,
  MapPinned,
  NotebookPen,
  Paperclip,
  Stethoscope,
  Syringe,
  UserRound,
} from "lucide-react";
import type {
  Booking,
  CareNote,
  CarePlan,
  CareReport,
  DoctorNote,
  MedicationLog,
  Patient,
  VitalRecord,
} from "@/lib/types";
import { formatDate, formatDateTime, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePagedList } from "@/hooks/usePagedList";
import { NurseCompleteReportForm } from "@/components/dashboard/NurseCompleteReportForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, Input, Textarea } from "@/components/ui/Input";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";
import { Pagination } from "@/components/ui/Pagination";
import { Panel } from "@/components/dashboard/DashboardShell";
import { toast } from "@/components/ui/toast";

type Tab =
  | "overview"
  | "personal"
  | "care"
  | "vitals"
  | "medicines"
  | "notes"
  | "reports"
  | "duties";

const TAB_KEYS: Tab[] = [
  "overview",
  "personal",
  "care",
  "vitals",
  "medicines",
  "notes",
  "reports",
  "duties",
];

function parseTab(value?: string): Tab {
  if (value && TAB_KEYS.includes(value as Tab)) return value as Tab;
  if (value === "clinical") return "vitals";
  return "overview";
}

export function NursePatientChart({
  patient,
  bookings,
  active,
  reports,
  notes,
  plans,
  vitals,
  meds,
  doctorNotes,
  initialTab,
}: {
  patient: Patient;
  bookings: Booking[];
  active?: Booking;
  reports: CareReport[];
  notes: CareNote[];
  plans: CarePlan[];
  vitals: VitalRecord[];
  meds: MedicationLog[];
  doctorNotes: DoctorNote[];
  initialTab?: string;
}) {
  const [tab, setTab] = useState<Tab>(() => parseTab(initialTab));
  const checkedCount = reports.filter((r) => r.doctorChecked).length;
  const completeCount = reports.filter((r) => (r.reportType || "daily") === "complete").length;
  const initials = patient.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

  return (
    <div className="space-y-3">
      <section className="ehr-patient-banner relative p-4 md:p-5">
        <div className="relative z-[1] flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 font-display text-lg font-semibold text-white ring-1 ring-white/25">
              {initials || <UserRound className="h-6 w-6" />}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                Electronic chart · MRN {patient.id}
              </p>
              <h1 className="font-display mt-1 text-2xl tracking-[-0.03em] text-white md:text-4xl">
                {patient.name}
              </h1>
              <p className="mt-1 text-sm text-white/80">
                {formatPhone(patient.phone)}
                {patient.age ? ` · ${patient.age}y` : ""}
                {patient.gender ? ` · ${patient.gender}` : ""}
                {patient.area ? ` · ${patient.area}` : ""}
              </p>
              {patient.address ? (
                <p className="mt-1 line-clamp-2 text-sm text-white/70">{patient.address}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
                  {patient.status || "active"}
                </span>
                {active ? (
                  <span className="rounded-full bg-[#DDF5EC] px-2.5 py-1 text-xs font-semibold text-[#066670]">
                    {active.status} · {active.careType}
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/15">
                    No active duty
                  </span>
                )}
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/15">
                  {reports.length} reports
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/15">
                  Dr {checkedCount}/{reports.length || 0}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/nurse/attendance"
              className="btn btn-sm border-0 bg-white text-[#066670] hover:bg-[#DDF5EC]"
            >
              <MapPinned className="h-3.5 w-3.5" /> Present
            </Link>
            <Link
              href="/dashboard/nurse/medications"
              className="btn btn-sm border border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              <Syringe className="h-3.5 w-3.5" /> Meds
            </Link>
            <Link
              href="/dashboard/nurse/vitals"
              className="btn btn-sm border border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              <Activity className="h-3.5 w-3.5" /> Log vitals
            </Link>
          </div>
        </div>

        <div className="relative z-[1] mt-4 grid gap-2 sm:grid-cols-4">
          <BannerStat label="Reports" value={String(reports.length)} />
          <BannerStat label="Complete" value={String(completeCount)} />
          <BannerStat label="Doctor checked" value={String(checkedCount)} />
          <BannerStat label="Vitals logged" value={String(vitals.length)} />
        </div>
      </section>

      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-white shadow-[var(--shadow-xs)]">
        <div className="ehr-storyboard">
          {(
            [
              ["overview", "Overview"],
              ["personal", "Personal"],
              ["care", "Care Plan"],
              ["vitals", "Vitals"],
              ["medicines", "Medicines"],
              ["notes", "Care Notes"],
              ["reports", "Care Reports"],
              ["duties", "Duty History"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              data-active={tab === key}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="p-3 md:p-4">

      {tab === "overview" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Overview" subtitle="Assignment snapshot">
            {!active ? (
              <EmptyState title="No active duty" description="No open assignment for you." />
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="success">{active.status}</Badge>
                  <span className="text-sm font-semibold text-heading">{active.id}</span>
                </div>
                <p className="text-sm text-muted">
                  {active.careType} · {active.shift} · {formatDate(active.startDate)}
                  {active.endDate ? ` → ${formatDate(active.endDate)}` : ""}
                </p>
                <p className="text-sm text-heading">{active.address}</p>
              </div>
            )}
          </Panel>
          <Panel title="Emergency information" subtitle="From patient record">
            <dl className="grid gap-2 text-sm">
              <Field label="Primary phone" value={formatPhone(patient.phone)} />
              <Field label="Address" value={patient.address || patient.area || "—"} />
              <Field
                label="Care / emergency notes"
                value={patient.notes || active?.notes || "No emergency notes on file."}
              />
            </dl>
          </Panel>
          <Panel title="Care plans" subtitle={`${plans.length} plan(s)`}>
            {plans.length === 0 ? (
              <EmptyState title="No care plans" description="Desk can attach plans later." />
            ) : (
              <div className="space-y-1.5">
                {plans.slice(0, 3).map((p) => (
                  <ListTile key={p.id}>
                    <ListTileHeader>
                      <div>
                        <p className="font-semibold text-heading">{p.title || p.id}</p>
                        <ListTileMeta>
                          {p.goals || (p.tasks?.length ? `${p.tasks.length} tasks` : "Care plan")}
                        </ListTileMeta>
                      </div>
                      <Badge tone={p.status === "active" ? "success" : "neutral"}>{p.status}</Badge>
                    </ListTileHeader>
                  </ListTile>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Doctor visit notes" subtitle="From ops desk">
            {doctorNotes.length === 0 ? (
              <EmptyState
                title="No doctor notes yet"
                description="Doctor visit notes from ops will show here."
              />
            ) : (
              <div className="space-y-1.5">
                {doctorNotes.slice(0, 4).map((n) => (
                  <ListTile key={n.id}>
                    <p className="font-semibold text-heading">{n.doctorName}</p>
                    <ListTileMeta>
                      Visit {formatDate(n.visitDate)} · {n.bookingId}
                    </ListTileMeta>
                    <p className="mt-1 text-sm text-heading">{n.notes}</p>
                  </ListTile>
                ))}
              </div>
            )}
          </Panel>
        </div>
      ) : null}

      {tab === "personal" ? (
        <Panel title="Personal information" subtitle="Demographics on file">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <Field label="Patient ID" value={patient.id} />
            <Field label="Full name" value={patient.name} />
            <Field label="Phone" value={formatPhone(patient.phone)} />
            <Field label="Age" value={patient.age != null ? String(patient.age) : "—"} />
            <Field label="Gender" value={patient.gender || "—"} />
            <Field label="Status" value={patient.status || "active"} />
            <Field label="Area" value={patient.area || "—"} />
            <Field label="Address" value={patient.address || "—"} />
            <Field label="Notes" value={patient.notes || "—"} />
            <Field label="Registered" value={formatDate(patient.createdAt)} />
          </dl>
        </Panel>
      ) : null}

      {tab === "care" ? (
        <Panel title="Care plan" subtitle={`${plans.length} plan(s) for this patient`}>
          {plans.length === 0 ? (
            <EmptyState title="No care plans" description="Desk can attach plans later." />
          ) : (
            <div className="space-y-2">
              {plans.map((p) => (
                <ListTile key={p.id}>
                  <ListTileHeader>
                    <div>
                      <p className="font-semibold text-heading">{p.title || p.id}</p>
                      <ListTileMeta>
                        {p.goals || (p.tasks?.length ? `${p.tasks.length} tasks` : "Care plan")}
                      </ListTileMeta>
                      {p.tasks?.length ? (
                        <ul className="mt-2 list-inside list-disc text-sm text-heading">
                          {p.tasks.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <Badge tone={p.status === "active" ? "success" : "neutral"}>{p.status}</Badge>
                  </ListTileHeader>
                </ListTile>
              ))}
            </div>
          )}
        </Panel>
      ) : null}

      {tab === "vitals" ? (
        <Panel
          title="Vitals history"
          subtitle={`${vitals.length} records`}
          action={
            <Link href="/dashboard/nurse/vitals" className="btn btn-outline btn-sm">
              <Activity className="h-3.5 w-3.5" /> Log vitals
            </Link>
          }
        >
          {vitals.length === 0 ? (
            <EmptyState title="No vitals" description="Record from the Vitals page." />
          ) : (
            <div className="space-y-1.5">
              {vitals.slice(0, 20).map((v) => (
                <ListTile key={v.id}>
                  <ListTileMeta>{formatDateTime(v.recordedAt || v.createdAt)}</ListTileMeta>
                  <p className="mt-1 text-sm text-heading">
                    BP {v.bp || "—"} · Sugar {v.sugar || "—"} · Pulse {v.pulse || "—"} · Temp{" "}
                    {v.temp || "—"}
                    {v.spo2 ? ` · SpO₂ ${v.spo2}` : ""}
                  </p>
                  {v.notes ? <p className="mt-1 text-xs text-muted">{v.notes}</p> : null}
                </ListTile>
              ))}
            </div>
          )}
        </Panel>
      ) : null}

      {tab === "medicines" ? (
        <Panel
          title="Medicine records"
          subtitle={`${meds.length} entries`}
          action={
            <Link href="/dashboard/nurse/medications" className="btn btn-outline btn-sm">
              <Syringe className="h-3.5 w-3.5" /> Meds chart
            </Link>
          }
        >
          {meds.length === 0 ? (
            <EmptyState title="No medicine logs" description="Log from the Medicine chart." />
          ) : (
            <div className="space-y-1.5">
              {meds.slice(0, 20).map((m) => (
                <ListTile key={m.id}>
                  <ListTileHeader>
                    <div>
                      <p className="font-semibold text-heading">{m.medicineName}</p>
                      <ListTileMeta>
                        {m.dose} · {m.type} · {formatDateTime(m.timeGiven)}
                      </ListTileMeta>
                    </div>
                    <Badge tone="primary">{m.type}</Badge>
                  </ListTileHeader>
                </ListTile>
              ))}
            </div>
          )}
        </Panel>
      ) : null}

      {tab === "notes" ? (
        <Panel
          title="Care notes"
          subtitle={`${notes.length} notes`}
          action={
            <Link href="/dashboard/nurse/notes" className="btn btn-ghost btn-sm">
              <NotebookPen className="h-3.5 w-3.5" /> All notes
            </Link>
          }
        >
          {notes.length === 0 ? (
            <EmptyState title="No notes" description="Add from Duties board." />
          ) : (
            <div className="space-y-1.5">
              {notes.slice(0, 20).map((n) => (
                <ListTile key={n.id}>
                  <ListTileMeta>
                    {n.bookingId} · {formatDateTime(n.createdAt)}
                  </ListTileMeta>
                  <p className="mt-1 text-sm text-heading">
                    BP {n.vitals.bp || "—"} · Sugar {n.vitals.sugar || "—"} · Pulse{" "}
                    {n.vitals.pulse || "—"}
                  </p>
                  <p className="mt-1 text-sm text-heading">{n.notes}</p>
                </ListTile>
              ))}
            </div>
          )}
        </Panel>
      ) : null}

      {tab === "reports" ? (
        <div className="space-y-3">
          <NurseCompleteReportForm
            patientId={patient.id}
            patientName={patient.name}
            bookings={bookings}
            defaultBookingId={active?.id}
          />
          <PatientReportsTimeline reports={reports} />
        </div>
      ) : null}

      {tab === "duties" ? (
        <Panel title="Booking and duty history" subtitle={`${bookings.length} record(s)`}>
          {bookings.length === 0 ? (
            <EmptyState title="No bookings" description="No linked duties." />
          ) : (
            <div className="space-y-1.5">
              {bookings.map((b) => (
                <ListTile key={b.id}>
                  <ListTileHeader>
                    <div>
                      <p className="font-semibold text-heading">{b.id}</p>
                      <ListTileMeta>
                        {b.careType} · {b.shift} · {formatDate(b.startDate)}
                        {b.endDate ? ` → ${formatDate(b.endDate)}` : ""}
                      </ListTileMeta>
                      <ListTileMeta>{b.address}</ListTileMeta>
                    </div>
                    <Badge tone={b.status === "active" || b.status === "assigned" ? "success" : "neutral"}>
                      {b.status}
                    </Badge>
                  </ListTileHeader>
                </ListTile>
              ))}
            </div>
          )}
        </Panel>
      ) : null}
        </div>
      </div>
    </div>
  );
}

function PatientReportsTimeline({ reports }: { reports: CareReport[] }) {
  const [filter, setFilter] = useState<"all" | "complete" | "daily" | "pending" | "checked">(
    "all",
  );
  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const type = r.reportType || "daily";
      if (filter === "complete") return type === "complete";
      if (filter === "daily") return type === "daily";
      if (filter === "pending") return !r.doctorChecked;
      if (filter === "checked") return !!r.doctorChecked;
      return true;
    });
  }, [reports, filter]);

  const { page, pageCount, pageSize, rows, setPage, setPageSize, resetPage } =
    usePagedList(filtered, 5);

  return (
    <Panel
      title="Complete report history"
      subtitle="Har report expand karke dekho · doctor check mark karo"
      action={<Badge tone="neutral">{filtered.length}</Badge>}
    >
      <div className="mb-2 flex flex-wrap gap-1.5">
        {(
          [
            ["all", "All"],
            ["complete", "Complete"],
            ["daily", "Daily"],
            ["pending", "Dr pending"],
            ["checked", "Dr checked"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setFilter(key);
              resetPage();
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              filter === key
                ? "bg-primary text-[var(--sidebar-fg)]"
                : "bg-paper-2 text-heading hover:bg-[var(--secondary)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Upload a complete report above — history will show here for doctor check."
        />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
          <Pagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            total={reports.length}
            filteredCount={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[3, 5, 10, 20]}
            noun="reports"
          />
        </div>
      )}
    </Panel>
  );
}

function ReportCard({ report }: { report: CareReport }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [doctorName, setDoctorName] = useState(report.doctorName || "");
  const [doctorRemarks, setDoctorRemarks] = useState(report.doctorRemarks || "");
  const type = report.reportType || "daily";

  async function submitDoctorCheck(e: FormEvent) {
    e.preventDefault();
    if (!doctorName.trim()) {
      toast.info("Doctor name required");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/care-reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: report.id,
        doctorName: doctorName.trim(),
        doctorRemarks: doctorRemarks.trim() || undefined,
        doctorChecked: true,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error("Doctor check failed", data.error);
      return;
    }
    toast.success("Doctor checked this report", doctorName.trim());
    router.refresh();
  }

  return (
    <article className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-surface shadow-[var(--shadow-xs)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 p-3 text-left transition hover:bg-paper-2/60"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={type === "complete" ? "primary" : "neutral"}>
              {type === "complete" ? "Complete" : "Daily"}
            </Badge>
            <Badge tone={report.doctorChecked ? "success" : "warning"}>
              {report.doctorChecked ? (
                <>
                  <CheckCircle2 className="h-3 w-3" /> Dr checked
                </>
              ) : (
                <>
                  <Stethoscope className="h-3 w-3" /> Dr pending
                </>
              )}
            </Badge>
            {report.attachmentUrl ? (
              <Badge tone="neutral">
                <Paperclip className="h-3 w-3" /> File
              </Badge>
            ) : null}
          </div>
          <p className="mt-1.5 font-semibold text-heading">
            Duty {formatDate(report.dutyDate)} · {formatDateTime(report.createdAt)}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{report.summary}</p>
          {report.doctorChecked && report.doctorName ? (
            <p className="mt-1 text-xs font-medium text-success">
              Checked by Dr. {report.doctorName}
              {report.doctorCheckedAt ? ` · ${formatDateTime(report.doctorCheckedAt)}` : ""}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 text-xs font-semibold text-primary">
          {open ? "Hide" : "Open"}
        </span>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-[var(--line)] bg-paper-2/30 p-3">
          <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-surface p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Full summary
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-heading">
              {report.summary}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {report.conditionNote ? (
              <DetailBlock label="Patient condition" value={report.conditionNote} />
            ) : null}
            {report.vitalsNote ? <DetailBlock label="Vitals note" value={report.vitalsNote} /> : null}
            {report.medsNote ? <DetailBlock label="Medicine note" value={report.medsNote} /> : null}
            {report.tasksDone ? <DetailBlock label="Tasks done" value={report.tasksDone} /> : null}
            {report.familyUpdate ? (
              <DetailBlock label="Family update" value={report.familyUpdate} />
            ) : null}
            {report.bookingId ? <DetailBlock label="Booking" value={report.bookingId} /> : null}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted">
            <span>By {report.createdByName}</span>
            {report.attachmentUrl ? (
              <a
                href={report.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary"
              >
                Open attachment{report.attachmentName ? ` · ${report.attachmentName}` : ""}
              </a>
            ) : null}
          </div>

          {report.doctorChecked ? (
            <div className="rounded-[var(--radius-lg)] border border-success/25 bg-[var(--success-soft)] p-3">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
                <Stethoscope className="h-4 w-4" />
                Doctor checked · {report.doctorName}
              </p>
              {report.doctorRemarks ? (
                <p className="mt-1 text-sm text-heading">{report.doctorRemarks}</p>
              ) : null}
              <p className="mt-1 text-xs text-muted">
                Logged by {report.doctorCheckedByName || "—"}
                {report.doctorCheckedAt ? ` · ${formatDateTime(report.doctorCheckedAt)}` : ""}
              </p>
            </div>
          ) : (
            <form
              onSubmit={submitDoctorCheck}
              className="space-y-2 rounded-[var(--radius-lg)] border border-primary/25 bg-[var(--primary-soft)]/40 p-3"
            >
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-heading">
                <Stethoscope className="h-4 w-4 text-primary" />
                Doctor check
              </p>
              <p className="text-xs text-muted">
                Jab doctor report dekh le / site pe review kare, yahan mark karo.
              </p>
              <FormField label="Doctor name *">
                <Input
                  required
                  placeholder="Dr. name"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                />
              </FormField>
              <FormField label="Doctor remarks">
                <Textarea
                  rows={2}
                  placeholder="Advice, changes, follow-up…"
                  value={doctorRemarks}
                  onChange={(e) => setDoctorRemarks(e.target.value)}
                />
              </FormField>
              <Button type="submit" loading={saving} disabled={saving}>
                <CheckCircle2 className="h-4 w-4" />
                Mark doctor checked
              </Button>
            </form>
          )}
        </div>
      ) : null}
    </article>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-surface px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-heading">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-paper-2/70 px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-heading">{value}</dd>
    </div>
  );
}

function BannerStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/15 backdrop-blur-[2px]">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">{label}</p>
      <p className="font-display mt-0.5 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
