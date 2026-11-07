"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  Download,
  FileStack,
  MapPin,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  ScrollText,
  ShieldAlert,
  Stethoscope,
  Sun,
  Moon,
  Wallet,
} from "lucide-react";
import type {
  Attendance,
  Booking,
  CallLog,
  DoctorNote,
  LeaveRequest,
  MedSchedule,
  SalaryAdvance,
  SosAlert,
  Staff,
  StaffDocument,
  AuditLog,
  DbShape,
} from "@/lib/types";
import { dutyProgress, todayDutyDate } from "@/lib/duty";
import { computeStaffPerformance } from "@/lib/performance";
import { cn, formatINR } from "@/lib/utils";
import { waLink, waTemplates } from "@/lib/whatsapp";
import { toast } from "@/components/ui/toast";

type Tab =
  | "roster"
  | "sos"
  | "leaves"
  | "docs"
  | "schedule"
  | "money"
  | "clinical"
  | "audit";

type Props = {
  bookings: Booking[];
  staff: Staff[];
  attendance: Attendance[];
  leaves: LeaveRequest[];
  documents: StaffDocument[];
  sosAlerts: SosAlert[];
  medSchedules: MedSchedule[];
  advances: SalaryAdvance[];
  doctorNotes: DoctorNote[];
  callLogs: CallLog[];
  auditLogs: AuditLog[];
  invoices: {
    bookingId: string;
    amount: number;
    paid: number;
    status: string;
    dueDate: string;
    patientName: string;
  }[];
};

const tabs: { key: Tab; label: string; icon: typeof MapPin; hint: string }[] = [
  { key: "roster", label: "Live roster", icon: CalendarClock, hint: "Duties & backup" },
  { key: "sos", label: "SOS desk", icon: ShieldAlert, hint: "Emergencies" },
  { key: "leaves", label: "Leaves", icon: ClipboardList, hint: "Approvals" },
  { key: "docs", label: "Documents", icon: FileStack, hint: "IDs & certs" },
  { key: "schedule", label: "Med schedule", icon: Stethoscope, hint: "Reminders" },
  { key: "money", label: "Money desk", icon: Wallet, hint: "Margin & dues" },
  { key: "clinical", label: "Clinical log", icon: PhoneCall, hint: "Doctor & calls" },
  { key: "audit", label: "Audit trail", icon: ScrollText, hint: "Who changed what" },
];

export function OpsHub(props: Props) {
  const router = useRouter();
  const today = todayDutyDate();
  const [tab, setTab] = useState<Tab>("roster");
  const [nowMs] = useState(() => Date.now());

  const activeBookings = useMemo(
    () => props.bookings.filter((b) => b.status === "active" || b.status === "assigned"),
    [props.bookings],
  );

  const kpis = useMemo(() => {
    let morning = 0;
    let evening = 0;
    let complete = 0;
    for (const b of activeBookings) {
      const p = dutyProgress(props.attendance, b.id, today);
      if (p.morningDone) morning += 1;
      if (p.eveningDone) evening += 1;
      if (p.complete) complete += 1;
    }
    const openSos = props.sosAlerts.filter((s) => s.status === "open").length;
    const pendingLeaves = props.leaves.filter((l) => l.status === "pending").length;
    const dues = props.invoices
      .filter((i) => i.status !== "paid")
      .reduce((s, i) => s + (i.amount - i.paid), 0);
    return { morning, evening, complete, openSos, pendingLeaves, dues, active: activeBookings.length };
  }, [activeBookings, props.attendance, props.sosAlerts, props.leaves, props.invoices, today]);

  const marginRows = useMemo(
    () =>
      props.bookings.map((b) => {
        const pay =
          b.staffPayPerShift ??
          props.staff.find((s) => s.id === b.assignedStaffId)?.salaryPerShift ??
          0;
        return { ...b, staffPay: pay, margin: b.amount - pay };
      }),
    [props.bookings, props.staff],
  );

  async function post(resource: string, payload: Record<string, unknown>) {
    const res = await fetch("/api/extra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error("Save failed", data.error);
      return false;
    }
    toast.success("Saved successfully");
    router.refresh();
    return true;
  }

  async function patch(resource: string, payload: Record<string, unknown>) {
    const res = await fetch("/api/extra", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error("Update failed", data.error);
      return false;
    }
    toast.success("Updated successfully");
    router.refresh();
    return true;
  }

  const activeTab = tabs.find((t) => t.key === tab)!;

  return (
    <div className="space-y-2">
      {/* Command strip */}
      <section className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-[#0d2130] text-white">
        <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[var(--secondary)]/15 blur-3xl" />
        <div className="relative grid gap-2 p-3 md:grid-cols-[1.2fr_1fr] md:p-3">
          <div>
            <p className="text-label text-[var(--secondary-deep)]">
              Care command center · {today}
            </p>
            <h2 className="font-display mt-3 text-3xl tracking-[-0.03em] md:text-4xl">
              Advanced ops hub
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
              Live duties, emergencies, HR, medicine schedules, margins, and audit — one desk for
              the whole care operation.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Kpi label="Active duties" value={String(kpis.active)} />
            <Kpi label="Morning done" value={`${kpis.morning}/${kpis.active || 0}`} tone="mint" />
            <Kpi label="Evening done" value={`${kpis.evening}/${kpis.active || 0}`} />
            <Kpi label="Open SOS" value={String(kpis.openSos)} tone={kpis.openSos ? "warn" : "mint"} />
            <Kpi label="Leave pending" value={String(kpis.pendingLeaves)} />
            <Kpi label="Family dues" value={formatINR(kpis.dues)} />
          </div>
        </div>
      </section>

      <div className="grid gap-2 lg:grid-cols-[240px_1fr]">
        {/* Module rail */}
        <aside className="h-fit rounded-[var(--radius-2xl)] border border-[var(--line)] bg-surface/95 p-2 shadow-[var(--shadow-sm)] lg:sticky lg:top-24">
          <p className="px-3 pb-2 pt-3 text-label text-muted">Modules</p>
          <nav className="space-y-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              const badge =
                t.key === "sos"
                  ? kpis.openSos
                  : t.key === "leaves"
                    ? kpis.pendingLeaves
                    : 0;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition",
                    active ? "bg-[#0d2130] text-white" : "text-heading hover:bg-paper-2",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-lg",
                      active ? "bg-white/10" : "bg-paper-2 text-sea",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{t.label}</span>
                    <span className={cn("block text-[11px]", active ? "text-white/55" : "text-muted")}>
                      {t.hint}
                    </span>
                  </span>
                  {badge > 0 ? (
                    <span
                      className={cn(
                        "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold",
                        active ? "bg-primary text-white" : "bg-danger text-white",
                      )}
                    >
                      {badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Workspace */}
        <section className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sea">
                {activeTab.hint}
              </p>
              <h3 className="font-display mt-1 text-2xl tracking-[-0.03em] md:text-3xl">
                {activeTab.label}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                router.refresh();
                toast.info("Ops desk refreshed");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-ink"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>

          {tab === "roster" ? (
            <div className="space-y-2">
              {activeBookings.length === 0 ? (
                <Empty title="No active duties" text="Assign a booking to see live roster cards." />
              ) : (
                activeBookings.map((b) => {
                  const main = props.staff.find((s) => s.id === b.assignedStaffId);
                  const backup = props.staff.find((s) => s.id === b.backupStaffId);
                  const p = dutyProgress(props.attendance, b.id, today);
                  const perf = main
                    ? computeStaffPerformance(
                        { attendance: props.attendance } as DbShape,
                        main.id,
                      )
                    : null;
                  const score = main?.performanceScore ?? perf?.score ?? 0;
                  return (
                    <article
                      key={b.id}
                      className="overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white shadow-[var(--shadow)]"
                    >
                      <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="p-2.5 md:p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sea">
                                {b.id} · {b.shift}
                              </p>
                              <h4 className="font-name mt-1 text-xl md:text-2xl">{b.patientName}</h4>
                              <p className="mt-1 text-sm text-ink-soft">{b.address}</p>
                            </div>
                            <span
                              className={cn(
                                "rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase",
                                p.complete
                                  ? "bg-[#e8f7f2] text-mint"
                                  : "bg-paper-2 text-ink-soft",
                              )}
                            >
                              {p.complete ? "Duty complete" : "In progress"}
                            </span>
                          </div>

                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <DutyChip
                              icon={<Sun className="h-4 w-4" />}
                              label="Morning"
                              done={p.morningDone}
                            />
                            <DutyChip
                              icon={<Moon className="h-4 w-4" />}
                              label="Evening"
                              done={p.eveningDone}
                            />
                          </div>

                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <PersonBlock
                              label="Assigned"
                              name={main?.name || "Unassigned"}
                              meta={main ? `${main.role} · score ${score}` : "Set staff on bookings"}
                            />
                            <PersonBlock
                              label="Backup"
                              name={backup?.name || "Not set"}
                              meta={backup ? backup.role : "Choose replacement cover"}
                            />
                          </div>

                          {b.lat != null && b.lng != null ? (
                            <a
                              className="mt-1.5 inline-flex items-center gap-2 text-sm font-semibold text-sea"
                              href={`https://www.google.com/maps?q=${b.lat},${b.lng}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MapPin className="h-4 w-4" /> Open care pin · {b.lat.toFixed(4)},{" "}
                              {b.lng.toFixed(4)}
                            </a>
                          ) : null}
                        </div>

                        <div className="border-t border-[var(--line)] bg-[#f7fafc] p-2.5 md:border-l md:border-t-0 md:p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                            Quick actions
                          </p>
                          <div className="mt-3 grid gap-2">
                            {main?.phone ? (
                              <a
                                href={waLink(
                                  main.phone,
                                  waTemplates.bookingAssigned(b.patientName, b.shift),
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-2.5 text-xs font-semibold text-white"
                              >
                                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp staff
                              </a>
                            ) : null}
                            {b.phone ? (
                              <a
                                href={waLink(
                                  b.phone,
                                  p.complete
                                    ? waTemplates.eveningDone(
                                        b.patientName,
                                        main?.name || "Staff",
                                        b.staffPayPerShift || main?.salaryPerShift || 0,
                                      )
                                    : p.morningDone
                                      ? waTemplates.morningDone(b.patientName, main?.name || "Staff")
                                      : `Roshan Care update: ${b.patientName} duty ongoing.`,
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sea px-3 py-2.5 text-xs font-semibold text-white"
                              >
                                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp family
                              </a>
                            ) : null}
                            {backup ? (
                              <button
                                type="button"
                                onClick={() =>
                                  patch("backup", { bookingId: b.id, swapToBackup: true })
                                }
                                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-xs font-semibold"
                              >
                                Swap to backup now
                              </button>
                            ) : null}
                          </div>

                          <form
                            className="mt-1.5 space-y-2 border-t border-[var(--line)] pt-4"
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const fd = new FormData(e.currentTarget);
                              await patch("backup", {
                                bookingId: b.id,
                                backupStaffId: String(fd.get("backupStaffId") || ""),
                              });
                            }}
                          >
                            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                              Set backup
                            </label>
                            <select
                              name="backupStaffId"
                              className="field"
                              defaultValue={b.backupStaffId || ""}
                            >
                              <option value="">Select backup staff</option>
                              {props.staff
                                .filter((s) => s.id !== b.assignedStaffId)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} · {s.role} · {s.status}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="submit"
                              className="w-full rounded-xl bg-[#102538] px-3 py-2.5 text-xs font-semibold text-white"
                            >
                              Save backup
                            </button>
                          </form>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          ) : null}

          {tab === "sos" ? (
            <div className="space-y-1.5">
              {props.sosAlerts.length === 0 ? (
                <Empty title="All clear" text="No SOS alerts right now." />
              ) : (
                props.sosAlerts.map((s) => (
                  <article
                    key={s.id}
                    className={cn(
                      "rounded-[1.35rem] border px-3 py-2",
                      s.status === "open"
                        ? "border-[#e8b089] bg-gradient-to-br from-[#fff8ef] to-white"
                        : "border-[var(--line)] bg-white",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="inline-flex items-center gap-2 text-[#8a4b12]">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                            {s.status}
                          </span>
                        </div>
                        <h4 className="font-name mt-2 text-xl">{s.patientName}</h4>
                        <p className="mt-1 text-sm text-ink-soft">
                          {s.raisedByName} · {s.raisedByRole} ·{" "}
                          {new Date(s.createdAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-[15px] leading-relaxed text-ink">{s.message}</p>
                    {s.status !== "resolved" ? (
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => patch("sos", { id: s.id, status: "acknowledged" })}
                          className="rounded-xl bg-sea px-4 py-2 text-xs font-semibold text-white"
                        >
                          Acknowledge
                        </button>
                        <button
                          type="button"
                          onClick={() => patch("sos", { id: s.id, status: "resolved" })}
                          className="btn btn-primary btn-sm"
                        >
                          Resolve
                        </button>
                        <a
                          href={waLink("7073231360", waTemplates.sos(s.patientName, s.message))}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-[#25D366] px-4 py-2 text-xs font-semibold text-white"
                        >
                          WhatsApp desk
                        </a>
                      </div>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          ) : null}

          {tab === "leaves" ? (
            <div className="space-y-1.5">
              {props.leaves.length === 0 ? (
                <Empty title="No leave requests" text="Staff leave applications will show here." />
              ) : (
                props.leaves.map((l) => (
                  <article
                    key={l.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[1.35rem] border border-[var(--line)] bg-white px-3 py-2"
                  >
                    <div>
                      <p className="font-name text-lg">{l.staffName}</p>
                      <p className="mt-1 text-sm text-ink-soft">
                        {l.fromDate} → {l.toDate}
                      </p>
                      <p className="mt-1 text-sm">{l.reason}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill
                        tone={
                          l.status === "approved"
                            ? "mint"
                            : l.status === "rejected"
                              ? "warn"
                              : "soft"
                        }
                      >
                        {l.status}
                      </StatusPill>
                      {l.status === "pending" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => patch("leave", { id: l.id, status: "approved" })}
                            className="btn btn-primary btn-sm"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => patch("leave", { id: l.id, status: "rejected" })}
                            className="rounded-xl bg-[#c45c4a] px-3 py-2 text-xs font-semibold text-white"
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          ) : null}

          {tab === "docs" ? (
            <div className="space-y-1.5">
              {props.documents.length === 0 ? (
                <Empty title="No documents" text="Staff can upload ID / certificates from Leave & Docs." />
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {props.documents.map((d) => {
                    const s = props.staff.find((x) => x.id === d.staffId);
                    const expiring =
                      d.expiryDate &&
                      new Date(d.expiryDate).getTime() - nowMs < 30 * 86400000;
                    return (
                      <a
                        key={d.id}
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-[1.25rem] border border-[var(--line)] bg-white p-4 transition hover:border-sea/30 hover:bg-sea/[0.03]"
                      >
                        <p className="font-semibold text-ink">{d.title}</p>
                        <p className="mt-1 text-sm text-ink-soft">
                          {s?.name} · {d.kind}
                          {d.expiryDate ? ` · exp ${d.expiryDate}` : ""}
                        </p>
                        {expiring ? (
                          <p className="mt-2 text-xs font-semibold text-[#b7791f]">Expiring soon</p>
                        ) : null}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {tab === "schedule" ? (
            <div className="space-y-2">
              <ScheduleForm
                bookings={props.bookings}
                onSave={async (payload) => post("med-schedule", payload)}
              />
              <div className="grid gap-2 md:grid-cols-2">
                {props.medSchedules.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-[1.25rem] border border-[var(--line)] bg-white p-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sea">
                      {m.patientName}
                    </p>
                    <p className="font-name mt-1 text-lg">{m.medicineName}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {m.dose} · {m.type} · {m.times.join(" · ")}
                    </p>
                    <a
                      href={waLink(
                        props.bookings.find((b) => b.id === m.bookingId)?.phone || "7073231360",
                        waTemplates.medicineDue(m.patientName, m.medicineName, m.times[0] || ""),
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1f9c57]"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Send reminder
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "money" ? (
            <div className="space-y-2">
              <div className="grid gap-2 xl:grid-cols-2">
                <Panel title="Package vs staff margin">
                  <div className="divide-y divide-[var(--line)]">
                    {marginRows.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-2 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold">{r.patientName}</p>
                          <p className="text-xs text-ink-soft">
                            pkg {formatINR(r.amount)} − staff {formatINR(r.staffPay)}
                          </p>
                        </div>
                        <p
                          className={cn(
                            "font-name text-base",
                            r.margin >= 0 ? "text-mint" : "text-[#c45c4a]",
                          )}
                        >
                          {formatINR(r.margin)}
                        </p>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel title="Pending family dues">
                  {props.invoices.filter((i) => i.status !== "paid").length === 0 ? (
                    <p className="text-sm text-ink-soft">No outstanding invoices.</p>
                  ) : (
                    <div className="divide-y divide-[var(--line)]">
                      {props.invoices
                        .filter((i) => i.status !== "paid")
                        .map((i) => (
                          <div
                            key={i.bookingId + i.dueDate}
                            className="flex justify-between gap-2 py-3 text-sm"
                          >
                            <span>
                              {i.patientName}
                              <span className="mt-0.5 block text-xs text-ink-soft">
                                due {i.dueDate}
                              </span>
                            </span>
                            <span className="font-semibold">{formatINR(i.amount - i.paid)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </Panel>
              </div>

              <AdvanceForm staff={props.staff} onSave={(p) => post("advance", p)} />

              <div className="space-y-2">
                {props.advances.map((a) => {
                  const s = props.staff.find((x) => x.id === a.staffId);
                  return (
                    <div
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[1.15rem] border border-[var(--line)] bg-white px-4 py-3 text-sm"
                    >
                      <span>
                        <strong>{s?.name}</strong> · {formatINR(a.amount)} · {a.reason}
                      </span>
                      <button
                        type="button"
                        disabled={a.status !== "open"}
                        onClick={() => patch("advance", { id: a.id, status: "deducted" })}
                        className="rounded-xl bg-sea px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        {a.status === "open" ? "Mark deducted" : a.status}
                      </button>
                    </div>
                  );
                })}
              </div>

              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(
                  ["staff,role,monthly,perShift,score,shifts"]
                    .concat(
                      props.staff.map(
                        (s) =>
                          `${s.name},${s.role},${s.salaryMonthly || 0},${s.salaryPerShift},${s.performanceScore || 0},${s.shiftsCompleted}`,
                      ),
                    )
                    .join("\n"),
                )}`}
                download={`roshan-payroll-${today}.csv`}
                className="btn btn-primary"
              >
                <Download className="h-4 w-4" /> Export payroll CSV
              </a>
            </div>
          ) : null}

          {tab === "clinical" ? (
            <div className="space-y-2">
              <div className="grid gap-2 xl:grid-cols-2">
                <DoctorForm bookings={props.bookings} onSave={(p) => post("doctor-note", p)} />
                <CallForm bookings={props.bookings} onSave={(p) => post("call-log", p)} />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {props.doctorNotes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-[1.25rem] border border-[var(--line)] bg-white p-4 text-sm"
                  >
                    <p className="font-semibold">
                      {n.patientName} · Dr. {n.doctorName}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">{n.visitDate}</p>
                    <p className="mt-2 text-ink-soft">{n.notes}</p>
                  </div>
                ))}
                {props.callLogs.map((c) => (
                  <div key={c.id} className="rounded-[1.25rem] bg-paper-2 p-4 text-sm">
                    <p className="font-semibold">
                      {c.patientName} · {c.direction}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">{c.createdByName}</p>
                    <p className="mt-2 text-ink-soft">{c.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "audit" ? (
            <div className="overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-white">
              {props.auditLogs.length === 0 ? (
                <div className="p-3">
                  <Empty title="Audit trail empty" text="Create / update actions will appear here." />
                </div>
              ) : (
                <div className="divide-y divide-[var(--line)]">
                  {props.auditLogs.slice(0, 80).map((a) => (
                    <div key={a.id} className="px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-ink">
                          {a.action}
                          <span className="font-normal text-ink-soft"> · {a.entity}</span>
                        </p>
                        <p className="text-xs text-ink-soft">
                          {new Date(a.createdAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-ink-soft">{a.actorName || "system"}</p>
                      {a.detail ? <p className="mt-1 text-ink-soft">{a.detail}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "mint" | "warn";
}) {
  return (
    <div className="rounded-2xl bg-white/8 px-3 py-3 backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p
        className={cn(
          "mt-1.5 font-display text-xl tracking-[-0.03em]",
          tone === "mint" && "text-mint",
          tone === "warn" && "text-[#ffb4a8]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function DutyChip({
  icon,
  label,
  done,
}: {
  icon: React.ReactNode;
  label: string;
  done: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-3",
        done ? "bg-[#e8f7f2] text-mint" : "bg-paper-2 text-ink-soft",
      )}
    >
      {icon}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em]">{label}</p>
        <p className="text-sm font-semibold text-ink">{done ? "Done" : "Pending"}</p>
      </div>
    </div>
  );
}

function PersonBlock({ label, name, meta }: { label: string; name: string; meta: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">{label}</p>
      <p className="font-name mt-1 text-sm">{name}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{meta}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.35rem] border border-[var(--line)] bg-white p-2.5">
      <h4 className="font-display text-xl tracking-[-0.02em]">{title}</h4>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-[var(--line)] bg-white/70 px-3 py-2 text-center">
      <p className="font-display text-2xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{text}</p>
    </div>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "mint" | "warn" | "soft";
}) {
  return (
    <span
      className={cn(
        "rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase",
        tone === "mint" && "bg-[#e8f7f2] text-mint",
        tone === "warn" && "bg-[#fde8e4] text-[#c45c4a]",
        tone === "soft" && "bg-paper-2 text-ink-soft",
      )}
    >
      {children}
    </span>
  );
}

function ScheduleForm({
  bookings,
  onSave,
}: {
  bookings: Booking[];
  onSave: (p: Record<string, unknown>) => Promise<boolean>;
}) {
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await onSave({
      bookingId: fd.get("bookingId"),
      medicineName: fd.get("medicineName"),
      dose: fd.get("dose"),
      type: fd.get("type"),
      times: String(fd.get("times") || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      notes: fd.get("notes"),
    });
    if (ok) e.currentTarget.reset();
  }
  return (
    <form
      onSubmit={submit}
      className="grid gap-2 rounded-[1.35rem] border border-[var(--line)] bg-white p-2.5 md:grid-cols-2"
    >
      <p className="md:col-span-2 font-display text-xl">Add medicine schedule</p>
      <select name="bookingId" className="field" required>
        {bookings.map((b) => (
          <option key={b.id} value={b.id}>
            {b.patientName} · {b.id}
          </option>
        ))}
      </select>
      <input name="medicineName" className="field" placeholder="Medicine *" required />
      <input name="dose" className="field" placeholder="Dose *" required />
      <input name="times" className="field" placeholder="Times e.g. 08:00, 20:00 *" required />
      <select name="type" className="field" defaultValue="tablet">
        <option value="tablet">tablet</option>
        <option value="injection">injection</option>
        <option value="syrup">syrup</option>
        <option value="iv">iv</option>
      </select>
      <button
        type="submit"
        className="btn btn-primary"
      >
        Add schedule
      </button>
    </form>
  );
}

function AdvanceForm({
  staff,
  onSave,
}: {
  staff: Staff[];
  onSave: (p: Record<string, unknown>) => Promise<boolean>;
}) {
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await onSave({
      staffId: fd.get("staffId"),
      amount: Number(fd.get("amount")),
      reason: fd.get("reason"),
    });
    if (ok) e.currentTarget.reset();
  }
  return (
    <form
      onSubmit={submit}
      className="grid gap-2 rounded-[1.35rem] border border-[var(--line)] bg-white p-2.5 md:grid-cols-4"
    >
      <p className="md:col-span-4 font-display text-xl">Salary advance</p>
      <select name="staffId" className="field" required>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <input name="amount" type="number" className="field" placeholder="Amount" required />
      <input name="reason" className="field" placeholder="Reason" />
      <button type="submit" className="rounded-xl bg-sea px-4 py-3 text-sm font-semibold text-white">
        Add advance
      </button>
    </form>
  );
}

function DoctorForm({
  bookings,
  onSave,
}: {
  bookings: Booking[];
  onSave: (p: Record<string, unknown>) => Promise<boolean>;
}) {
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await onSave({
      bookingId: fd.get("bookingId"),
      doctorName: fd.get("doctorName"),
      visitDate: fd.get("visitDate"),
      notes: fd.get("notes"),
    });
    if (ok) e.currentTarget.reset();
  }
  return (
    <form
      onSubmit={submit}
      className="space-y-1.5 rounded-[1.35rem] border border-[var(--line)] bg-white p-2.5"
    >
      <p className="font-display text-xl">Doctor visit note</p>
      <select name="bookingId" className="field" required>
        {bookings.map((b) => (
          <option key={b.id} value={b.id}>
            {b.patientName}
          </option>
        ))}
      </select>
      <input name="doctorName" className="field" placeholder="Doctor name" required />
      <input name="visitDate" type="date" className="field" />
      <textarea name="notes" className="field" rows={3} placeholder="Notes" required />
      <button type="submit" className="btn btn-primary">
        Save note
      </button>
    </form>
  );
}

function CallForm({
  bookings,
  onSave,
}: {
  bookings: Booking[];
  onSave: (p: Record<string, unknown>) => Promise<boolean>;
}) {
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await onSave({
      bookingId: fd.get("bookingId"),
      direction: fd.get("direction"),
      summary: fd.get("summary"),
    });
    if (ok) e.currentTarget.reset();
  }
  return (
    <form
      onSubmit={submit}
      className="space-y-1.5 rounded-[1.35rem] border border-[var(--line)] bg-white p-2.5"
    >
      <p className="font-display text-xl">Care call log</p>
      <select name="bookingId" className="field" required>
        {bookings.map((b) => (
          <option key={b.id} value={b.id}>
            {b.patientName}
          </option>
        ))}
      </select>
      <select name="direction" className="field" defaultValue="outbound">
        <option value="outbound">outbound</option>
        <option value="inbound">inbound</option>
      </select>
      <input name="summary" className="field" placeholder="Call summary" required />
      <button type="submit" className="rounded-xl bg-sea px-4 py-2.5 text-sm font-semibold text-white">
        Save call
      </button>
    </form>
  );
}
