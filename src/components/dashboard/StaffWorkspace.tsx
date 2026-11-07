"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  IndianRupee,
  MapPin,
  Moon,
  Pencil,
  Phone,
  Plus,
  Search,
  Sparkles,
  Sun,
  Trash2,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import type { Attendance, Booking, SalaryPayout, Staff } from "@/lib/types";
import {
  calendarCells,
  monthKey,
  staffAttendanceStats,
  staffSalaryStats,
} from "@/lib/staffStats";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePagedList } from "@/hooks/usePagedList";
import { toast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/dashboard/PageHeader";

type StaffRow = Staff & { loginEmail?: string; hasLogin?: boolean };
type DetailTab = "overview" | "calendar" | "presents" | "pay" | "desk";

const emptyForm = {
  name: "",
  role: "Nurse" as Staff["role"],
  phone: "",
  area: "",
  skills: "",
  status: "available" as Staff["status"],
  email: "",
  password: "",
  salaryMonthly: "20000",
  salaryPerShift: "700",
};

const statusStyle: Record<Staff["status"], string> = {
  available: "bg-[var(--success-soft)] text-mint",
  "on-duty": "bg-[var(--info-soft)] text-sea",
  leave: "bg-[var(--warning-soft)] text-warning",
};

const detailTabs: { key: DetailTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "calendar", label: "Calendar" },
  { key: "presents", label: "Presents" },
  { key: "pay", label: "Salary" },
  { key: "desk", label: "Mark present" },
];

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

function formatMonthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function lastNDates(n: number) {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function slotLabel(type: Attendance["type"]) {
  if (type === "present") return "morning";
  if (type === "checkout") return "evening";
  return type;
}

export function StaffWorkspace({
  staff,
  attendance,
  payouts,
  bookings,
}: {
  staff: StaffRow[];
  attendance: Attendance[];
  payouts: SalaryPayout[];
  bookings: Booking[];
}) {
  const router = useRouter();
  const thisMonth = monthKey();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Staff["status"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(staff[0]?.id || null);
  const [calMonth, setCalMonth] = useState(thisMonth);
  const [tab, setTab] = useState<DetailTab>("overview");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdCred, setCreatedCred] = useState<{ email: string; password: string } | null>(
    null,
  );
  const [markBookingId, setMarkBookingId] = useState("");
  const [markSlot, setMarkSlot] = useState<"morning" | "evening">("morning");
  const [markDate, setMarkDate] = useState(new Date().toISOString().slice(0, 10));
  const [markNote, setMarkNote] = useState("");
  const [marking, setMarking] = useState(false);
  const [reveal, setReveal] = useState(true);

  const selected = staff.find((s) => s.id === selectedId) || null;
  const weekDates = useMemo(() => lastNDates(7), []);

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      const q = query.trim().toLowerCase();
      const matchQ =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.area.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q);
      const matchS = statusFilter === "all" || s.status === statusFilter;
      return matchQ && matchS;
    });
  }, [staff, query, statusFilter]);

  const { page, pageCount, pageSize, rows, setPage, setPageSize, resetPage } =
    usePagedList(filtered, 10);

  const teamMonth = useMemo(() => {
    let presents = 0;
    let earned = 0;
    let complete = 0;
    for (const s of staff) {
      const a = staffAttendanceStats(attendance, s.id, thisMonth);
      presents += a.totalMarks;
      complete += a.completeDays;
      earned += staffSalaryStats(payouts, s.id, thisMonth).earned;
    }
    return {
      presents,
      earned,
      complete,
      onDuty: staff.filter((s) => s.status === "on-duty").length,
      available: staff.filter((s) => s.status === "available").length,
    };
  }, [staff, attendance, payouts, thisMonth]);

  const detail = useMemo(() => {
    if (!selected) return null;
    const attAll = staffAttendanceStats(attendance, selected.id);
    const attMonth = staffAttendanceStats(attendance, selected.id, calMonth);
    const salAll = staffSalaryStats(payouts, selected.id);
    const salMonth = staffSalaryStats(payouts, selected.id, calMonth);
    const dayMap = new Map(attMonth.days.map((d) => [d.date, d]));
    const cells = calendarCells(calMonth);
    const assigned = bookings.filter(
      (b) =>
        b.assignedStaffId === selected.id &&
        (b.status === "active" || b.status === "assigned"),
    );
    const history = attendance
      .filter((a) => a.staffId === selected.id)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const week = weekDates.map((date) => {
      const day = attAll.days.find((d) => d.date === date);
      return {
        date,
        morning: Boolean(day?.morning),
        evening: Boolean(day?.evening),
        complete: Boolean(day?.complete),
      };
    });
    const daysInMonth = cells.filter(Boolean).length || 30;
    const completeRate = Math.round((attMonth.completeDays / daysInMonth) * 100);
    return {
      attAll,
      attMonth,
      salAll,
      salMonth,
      dayMap,
      cells,
      assigned,
      history,
      week,
      completeRate,
    };
  }, [selected, attendance, payouts, bookings, calMonth, weekDates]);

  useEffect(() => {
    const hide = window.setTimeout(() => setReveal(false), 0);
    const show = window.setTimeout(() => setReveal(true), 30);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(show);
    };
  }, [selectedId, tab]);

  function selectStaff(s: StaffRow) {
    setSelectedId(s.id);
    setTab("overview");
    setMarkBookingId(
      bookings.find(
        (b) =>
          b.assignedStaffId === s.id &&
          (b.status === "active" || b.status === "assigned"),
      )?.id || "",
    );
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setCreatedCred(null);
    setOpen(true);
  }

  function openEdit(s: StaffRow) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      role: s.role,
      phone: s.phone,
      area: s.area,
      skills: s.skills.join(", "),
      status: s.status,
      email: s.email || s.loginEmail || "",
      password: "",
      salaryMonthly: String(s.salaryMonthly ?? 20000),
      salaryPerShift: String(s.salaryPerShift ?? 700),
    });
    setError("");
    setCreatedCred(null);
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      id: editingId || undefined,
      salaryMonthly: form.salaryMonthly ? Number(form.salaryMonthly) : undefined,
      salaryPerShift: form.salaryPerShift ? Number(form.salaryPerShift) : undefined,
    };
    const res = await fetch("/api/staff", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Save failed");
      toast.error("Staff save failed", data.error || "Check required fields");
      return;
    }
    if (!editingId && form.password) {
      setCreatedCred({ email: form.email, password: form.password });
      toast.success("Staff saved successfully", "Login credentials ready below");
    } else {
      setOpen(false);
      toast.success(editingId ? "Staff updated successfully" : "Staff saved successfully");
    }
    router.refresh();
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Delete staff "${name}" and their login?`)) return;
    const res = await fetch(`/api/staff?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error("Delete failed", data.error);
      return;
    }
    if (selectedId === id) setSelectedId(staff.find((s) => s.id !== id)?.id || null);
    toast.success("Staff deleted successfully", name);
    router.refresh();
  }

  async function adminMarkPresent() {
    if (!selected) return;
    if (!markBookingId) {
      toast.info("Select booking", "Pehle duty booking choose karo");
      return;
    }
    setMarking(true);
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminMark: true,
        staffId: selected.id,
        bookingId: markBookingId,
        type: markSlot,
        dutyDate: markDate,
        adminNote: markNote || undefined,
      }),
    });
    const data = await res.json();
    setMarking(false);
    if (!res.ok) {
      toast.error("Present failed", data.error || "Try again");
      return;
    }
    toast.success(
      data.dutyComplete ? "Duty complete · salary earned" : `${markSlot} present marked`,
      selected.name,
    );
    setMarkNote("");
    if (markSlot === "morning") setMarkSlot("evening");
    setTab("presents");
    router.refresh();
  }

  function exportStaffCsv() {
    const lines = [
      "name,role,status,area,phone,presentsMonth,completeDaysMonth,salaryEarnedMonth,salaryPaidMonth,perShift,monthly",
    ];
    for (const s of staff) {
      const a = staffAttendanceStats(attendance, s.id, thisMonth);
      const p = staffSalaryStats(payouts, s.id, thisMonth);
      lines.push(
        [
          s.name,
          s.role,
          s.status,
          s.area,
          s.phone,
          a.totalMarks,
          a.completeDays,
          p.earned,
          p.paid,
          s.salaryPerShift,
          s.salaryMonthly ?? "",
        ].join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff-${thisMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  }

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Care desk"
        title="Staff HR"
        subtitle="Presents, salary, calendar aur desk mark — ek jagah pe pure team ka pulse."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportStaffCsv} className="btn btn-outline">
              <Download className="h-4 w-4" /> Export
            </button>
            <button type="button" onClick={openCreate} className="btn btn-primary">
              <Plus className="h-4 w-4" /> Add staff
            </button>
          </div>
        }
      />

      {/* Team pulse strip */}
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Presents this month"
          value={String(teamMonth.presents)}
          hint={`${teamMonth.complete} complete days`}
          tone="sea"
        />
        <Kpi
          label="Salary earned"
          value={formatCurrency(teamMonth.earned)}
          hint="Duty-complete payouts"
          tone="mint"
        />
        <Kpi
          label="On duty now"
          value={String(teamMonth.onDuty)}
          hint={`${teamMonth.available} available`}
          tone="ink"
        />
        <Kpi
          label="Team size"
          value={String(staff.length)}
          hint={`${filtered.length} showing`}
          tone="warm"
        />
      </div>

      {error && !open ? (
        <ErrorState
          title="Staff action failed"
          description={error}
          onRetry={() => setError("")}
          retryLabel="Dismiss"
        />
      ) : null}

      <div className="grid gap-2 xl:grid-cols-[22rem_minmax(0,1fr)]">
        {/* Roster rail */}
        <aside className="soft-panel flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-[var(--radius-2xl)] xl:sticky xl:top-4">
          <div className="border-b border-[var(--line)] p-2 md:p-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sea">
                  Roster
                </p>
                <p className="mt-1 text-sm text-ink-soft">{filtered.length} people</p>
              </div>
            </div>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input
                className="field field-with-icon"
                placeholder="Search name, phone…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  resetPage();
                }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(
                [
                  ["all", "All"],
                  ["available", "Free"],
                  ["on-duty", "Duty"],
                  ["leave", "Leave"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(key);
                    resetPage();
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition",
                    statusFilter === key
                      ? "bg-ink text-[var(--sidebar-fg)]"
                      : "bg-paper-2 text-ink-soft hover:bg-surface",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-2 md:p-2.5">
            {staff.length === 0 ? (
              <EmptyState
                icon={<UserRound className="h-5 w-5" />}
                title="No staff yet"
                description="Add the first teammate to open the roster."
                actionLabel="Add staff"
                onAction={openCreate}
                className="py-3"
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<Search className="h-5 w-5" />}
                title="No staff match"
                description="Try another search or status filter."
                className="py-3"
              />
            ) : (
              rows.map((s) => {
                const att = staffAttendanceStats(attendance, s.id, thisMonth);
                const sal = staffSalaryStats(payouts, s.id, thisMonth);
                const active = s.id === selectedId;
                const heat = weekDates.map((date) => {
                  const day = staffAttendanceStats(attendance, s.id).days.find(
                    (d) => d.date === date,
                  );
                  return day?.complete ? 2 : day?.morning || day?.evening ? 1 : 0;
                });
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectStaff(s)}
                    className={cn(
                      "w-full rounded-2xl border px-3.5 py-3.5 text-left transition duration-200",
                      active
                        ? "border-sea/40 bg-gradient-to-br from-sea/[0.08] to-mint/[0.06] shadow-sm ring-2 ring-sea/15"
                        : "border-transparent bg-paper-2/70 hover:border-[var(--line)] hover:bg-surface",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Avatar name={s.name} photoUrl={s.photoUrl} active={active} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-name truncate text-[15px] text-ink">{s.name}</p>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                              statusStyle[s.status],
                            )}
                          >
                            {s.status === "on-duty" ? "duty" : s.status}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink-soft">
                          {s.role} · {s.area}
                        </p>
                        <div className="mt-2.5 flex items-center gap-1">
                          {heat.map((v, i) => (
                            <span
                              key={`${s.id}-h-${i}`}
                              className={cn(
                                "h-1.5 flex-1 rounded-full transition",
                                v === 2
                                  ? "bg-mint"
                                  : v === 1
                                    ? "bg-sea/50"
                                    : "bg-[var(--line)]",
                              )}
                            />
                          ))}
                        </div>
                        <p className="mt-2 text-[11px] text-ink-soft">
                          <span className="font-semibold text-ink">{att.totalMarks}</span> marks ·{" "}
                          <span className="font-semibold text-ink">
                            {formatCurrency(sal.earned)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
            {filtered.length > 0 ? (
              <Pagination
                className="mt-3 border-t-0 pt-2"
                page={page}
                pageCount={pageCount}
                pageSize={pageSize}
                total={staff.length}
                filteredCount={filtered.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[5, 10, 20]}
                noun="staff"
              />
            ) : null}
          </div>
        </aside>

        {/* Detail pane */}
        <div className="min-w-0 space-y-2">
          {!selected || !detail ? (
            <EmptyState
              icon={<UserRound className="h-5 w-5" />}
              title="Select a teammate"
              description="Choose staff from the roster to open presents, salary, and desk mark."
              className="soft-panel min-h-[20rem] rounded-[var(--radius-2xl)]"
            />
          ) : (
            <>
              {/* Hero */}
              <div className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-[var(--sidebar-bg)] text-[var(--sidebar-fg)] shadow-[var(--shadow-lg)]">
                <div
                  className="pointer-events-none absolute inset-0 opacity-80"
                  style={{
                    background:
                      "radial-gradient(600px 280px at 12% 0%, color-mix(in srgb, var(--mint) 35%, transparent), transparent 55%), radial-gradient(500px 260px at 90% 20%, color-mix(in srgb, var(--sea) 40%, transparent), transparent 50%)",
                  }}
                />
                <div
                  className={cn(
                    "relative p-2.5 md:p-3 transition duration-300",
                    reveal ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                                            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-[var(--sidebar-surface)] ring-2 ring-[color-mix(in_srgb,var(--sidebar-fg)_20%,transparent)] backdrop-blur">
                        {selected.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selected.photoUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="font-name text-2xl text-[var(--sidebar-fg)]">
                            {selected.name.slice(0, 1)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-fg-faint)]">
                          {selected.role} · {selected.area}
                        </p>
                        <h2 className="font-name mt-1 text-3xl tracking-[-0.03em] md:text-4xl">
                          {selected.name}
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-2 text-sm text-[var(--sidebar-fg-muted)]">
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" /> {selected.phone}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" /> {selected.area}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold uppercase",
                          selected.status === "on-duty"
                            ? "bg-mint/25 text-[var(--secondary-deep)]"
                            : selected.status === "leave"
                              ? "bg-[var(--warning-soft)]/20 text-[var(--warning-soft)]"
                              : "bg-[var(--sidebar-surface)] text-[var(--sidebar-fg-muted)]",
                        )}
                      >
                        {selected.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEdit(selected)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sidebar-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--sidebar-fg)] backdrop-blur transition hover:bg-surface/20"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(selected.id, selected.name)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-danger/25 px-3 py-1.5 text-xs font-semibold text-[var(--danger-soft)] transition hover:bg-danger/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-2 sm:grid-cols-4">
                    <HeroStat
                      label="Month presents"
                      value={String(detail.attMonth.totalMarks)}
                      sub={`${detail.attMonth.morningCount} AM · ${detail.attMonth.eveningCount} PM`}
                    />
                    <HeroStat
                      label="Complete days"
                      value={String(detail.attMonth.completeDays)}
                      sub={`${detail.completeRate}% of month`}
                    />
                    <HeroStat
                      label="Earned"
                      value={formatCurrency(detail.salMonth.earned)}
                      sub={`${formatCurrency(detail.salMonth.pending)} pending`}
                    />
                    <HeroStat
                      label="Per shift"
                      value={formatCurrency(selected.salaryPerShift || 0)}
                      sub={
                        selected.salaryMonthly
                          ? `Monthly ${formatCurrency(selected.salaryMonthly)}`
                          : "No monthly"
                      }
                    />
                  </div>

                  <div className="mt-2">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--sidebar-fg-soft)]">
                      <span>Month completion</span>
                      <span>{detail.completeRate}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--sidebar-line)]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sea to-mint transition-all duration-500"
                        style={{ width: `${Math.min(detail.completeRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-1.5 rounded-2xl border border-[var(--line)] bg-surface/80 p-1.5 shadow-sm backdrop-blur">
                {detailTabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                      tab === t.key
                        ? "bg-ink text-[var(--sidebar-fg)] shadow-sm"
                        : "text-ink-soft hover:bg-paper-2 hover:text-ink",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div
                className={cn(
                  "transition duration-300",
                  reveal ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                )}
              >
                {tab === "overview" ? (
                  <div className="grid gap-2 lg:grid-cols-2">
                    <div className="soft-panel rounded-[1.5rem] p-2.5 md:p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                        Last 7 days
                      </p>
                      <h3 className="font-display mt-1 text-2xl">Presence pulse</h3>
                      <div className="mt-2 grid grid-cols-7 gap-2">
                        {detail.week.map((d) => (
                          <div key={d.date} className="text-center">
                            <p className="text-[10px] font-semibold uppercase text-ink-soft">
                              {new Date(d.date + "T12:00:00").toLocaleDateString("en-IN", {
                                weekday: "narrow",
                              })}
                            </p>
                            <div
                              className={cn(
                                "mt-1.5 flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border",
                                d.complete
                                  ? "border-mint/40 bg-[var(--success-soft)]"
                                  : d.morning || d.evening
                                    ? "border-sea/30 bg-sea/10"
                                    : "border-[var(--line)] bg-paper-2",
                              )}
                            >
                              <Sun
                                className={cn(
                                  "h-3 w-3",
                                  d.morning ? "text-sea" : "text-ink-soft/30",
                                )}
                              />
                              <Moon
                                className={cn(
                                  "h-3 w-3",
                                  d.evening ? "text-mint" : "text-ink-soft/30",
                                )}
                              />
                            </div>
                            <p className="mt-1 text-[10px] text-ink-soft">{d.date.slice(-2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="soft-panel rounded-[1.5rem] p-2.5 md:p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                        Profile
                      </p>
                      <h3 className="font-display mt-1 text-2xl">Quick facts</h3>
                      <dl className="mt-2 space-y-1.5 text-sm">
                        <Fact label="Login" value={selected.email || selected.loginEmail || "—"} />
                        <Fact
                          label="Skills"
                          value={selected.skills.join(" · ") || "Not listed"}
                        />
                        <Fact label="Shifts completed" value={String(selected.shiftsCompleted)} />
                        <Fact
                          label="Performance"
                          value={
                            selected.performanceScore != null
                              ? String(selected.performanceScore)
                              : "—"
                          }
                        />
                        <Fact
                          label="Active duties"
                          value={
                            detail.assigned.length
                              ? detail.assigned.map((b) => b.patientName).join(", ")
                              : "None"
                          }
                        />
                        <Fact
                          label="All-time earned"
                          value={formatCurrency(detail.salAll.earned)}
                        />
                      </dl>
                      <button
                        type="button"
                        onClick={() => setTab("desk")}
                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-[var(--sidebar-fg)]"
                      >
                        <Sparkles className="h-4 w-4" /> Mark present from desk
                      </button>
                    </div>
                  </div>
                ) : null}

                {tab === "calendar" ? (
                  <div className="soft-panel rounded-[1.5rem] p-2.5 md:p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-sea">
                          <CalendarDays className="h-3.5 w-3.5" /> Presence calendar
                        </p>
                        <h3 className="font-display mt-1 text-3xl">
                          {formatMonthLabel(calMonth)}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-full bg-paper-2 p-2.5 transition hover:bg-surface"
                          onClick={() => setCalMonth((m) => shiftMonth(m, -1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-paper-2 px-3.5 py-2 text-xs font-semibold transition hover:bg-surface"
                          onClick={() => setCalMonth(thisMonth)}
                        >
                          This month
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-paper-2 p-2.5 transition hover:bg-surface"
                          onClick={() => setCalMonth((m) => shiftMonth(m, 1))}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-7 gap-2 text-center text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                        <div key={d} className="py-1">
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="mt-1 grid grid-cols-7 gap-2">
                      {detail.cells.map((date, i) => {
                        if (!date) return <div key={`e-${i}`} className="aspect-square" />;
                        const day = detail.dayMap.get(date);
                        const dayNum = Number(date.slice(-2));
                        const isToday = date === new Date().toISOString().slice(0, 10);
                        return (
                          <div
                            key={date}
                            title={
                              day
                                ? `${date}: ${day.morning ? "AM " : ""}${day.evening ? "PM" : ""}`
                                : date
                            }
                            className={cn(
                              "relative flex aspect-square flex-col items-center justify-between rounded-2xl border px-1 py-1.5 text-xs transition",
                              day?.complete
                                ? "border-mint/35 bg-gradient-to-b from-[var(--success-soft)] to-white text-mint shadow-sm"
                                : day?.morning || day?.evening
                                  ? "border-sea/25 bg-gradient-to-b from-[var(--info-soft)] to-white text-sea"
                                  : "border-[var(--line)] bg-surface text-ink-soft",
                              isToday && "ring-2 ring-sea/30",
                            )}
                          >
                            <span className="font-semibold">{dayNum}</span>
                            <div className="flex gap-1 pb-0.5">
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  day?.morning ? "bg-sea" : "bg-transparent",
                                )}
                              />
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  day?.evening ? "bg-mint" : "bg-transparent",
                                )}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-soft">
                      <LegendDot className="bg-mint" label="Complete (AM+PM)" />
                      <LegendDot className="bg-sea" label="Partial" />
                      <LegendDot className="bg-[var(--line)]" label="Off / missing" />
                    </div>
                    <p className="mt-3 text-sm text-ink-soft">
                      This month:{" "}
                      <strong className="text-ink">{detail.attMonth.completeDays}</strong> complete
                      days · <strong className="text-ink">{detail.attMonth.totalMarks}</strong>{" "}
                      marks · earned{" "}
                      <strong className="text-ink">
                        {formatCurrency(detail.salMonth.earned)}
                      </strong>
                    </p>
                  </div>
                ) : null}

                {tab === "presents" ? (
                  <div className="soft-panel rounded-[1.5rem] p-2.5 md:p-3">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                          Attendance log
                        </p>
                        <h3 className="font-display mt-1 text-2xl">All presents</h3>
                        <p className="mt-1 text-sm text-ink-soft">
                          {detail.attAll.totalMarks} marks · {detail.attAll.morningCount} morning ·{" "}
                          {detail.attAll.eveningCount} evening
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {detail.history.length === 0 ? (
                        <EmptyState
                          icon={<ClipboardCheck className="h-5 w-5" />}
                          title="No attendance yet"
                          description="Presents for this staff will show here once marked."
                          className="py-3"
                        />
                      ) : (
                        detail.history.map((a) => {
                          const b = bookings.find((x) => x.id === a.bookingId);
                          const slot = slotLabel(a.type);
                          return (
                            <article
                              key={a.id}
                              className="overflow-hidden rounded-2xl border border-[var(--line)] bg-surface transition hover:shadow-md"
                            >
                              <div className="grid sm:grid-cols-[8.5rem_1fr]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={a.photoUrl}
                                  alt=""
                                  className="h-32 w-full object-cover sm:h-full"
                                />
                                <div className="p-4">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={cn(
                                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase",
                                        slot === "morning"
                                          ? "bg-[var(--info-soft)] text-sea"
                                          : "bg-[var(--success-soft)] text-mint",
                                      )}
                                    >
                                      {slot === "morning" ? (
                                        <Sun className="h-3 w-3" />
                                      ) : (
                                        <Moon className="h-3 w-3" />
                                      )}
                                      {slot}
                                    </span>
                                    {a.markedByAdmin ? (
                                      <span className="rounded-full bg-[var(--warning-soft)] px-2.5 py-1 text-[11px] font-semibold text-warning">
                                        Desk mark
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="font-name mt-2 text-base">
                                    {b?.patientName || a.bookingId}
                                  </p>
                                  <p className="mt-1 text-sm text-ink-soft">
                                    {formatDate(a.dutyDate || a.createdAt)} ·{" "}
                                    {formatDateTime(a.createdAt)}
                                  </p>
                                  <p className="mt-1 text-xs text-ink-soft">
                                    {Math.round(a.distanceMeters)}m · {a.lat.toFixed(4)},{" "}
                                    {a.lng.toFixed(4)}
                                    {a.gpsQuality ? ` · GPS ${a.gpsQuality}` : ""}
                                  </p>
                                  {a.adminNote ? (
                                    <p className="mt-2 text-xs text-sea">Note: {a.adminNote}</p>
                                  ) : null}
                                </div>
                              </div>
                            </article>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : null}

                {tab === "pay" ? (
                  <div className="space-y-2">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <MiniMoney
                        label="Earned (month)"
                        value={formatCurrency(detail.salMonth.earned)}
                      />
                      <MiniMoney
                        label="Paid (month)"
                        value={formatCurrency(detail.salMonth.paid)}
                      />
                      <MiniMoney
                        label="Pending (month)"
                        value={formatCurrency(detail.salMonth.pending)}
                      />
                    </div>
                    <div className="soft-panel rounded-[1.5rem] p-2.5 md:p-3">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-sea" />
                        <h3 className="font-display text-2xl">Payout history</h3>
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">
                        All-time {formatCurrency(detail.salAll.earned)} earned ·{" "}
                        {formatCurrency(detail.salAll.paid)} paid
                      </p>
                      <div className="mt-2 space-y-2">
                        {detail.salAll.rows.length === 0 ? (
                          <EmptyState
                            icon={<Wallet className="h-5 w-5" />}
                            title="No salary payouts yet"
                            description="Evening present complete hone pe earn hota hai."
                            className="py-3"
                          />
                        ) : (
                          detail.salAll.rows.map((p) => (
                            <div
                              key={p.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--line)] bg-surface px-4 py-3.5"
                            >
                              <div>
                                <p className="font-name">{p.patientName}</p>
                                <p className="mt-0.5 text-xs text-ink-soft">
                                  {formatDate(p.dutyDate)} · {p.bookingId}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold">
                                  {formatCurrency(p.amount)}
                                </p>
                                <p
                                  className={cn(
                                    "text-[11px] font-semibold uppercase",
                                    p.status === "paid" ? "text-mint" : "text-warning",
                                  )}
                                >
                                  {p.status}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {tab === "desk" ? (
                  <div className="soft-panel overflow-hidden rounded-[1.5rem]">
                    <div className="border-b border-[var(--line)] bg-[var(--sidebar-bg)] px-3 py-2 text-[var(--sidebar-fg)] md:px-3">
                      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sidebar-fg-soft)]">
                        <ClipboardCheck className="h-3.5 w-3.5" /> Admin desk
                      </p>
                      <h3 className="font-display mt-1 text-3xl">
                        Mark present · {selected.name}
                      </h3>
                      <p className="mt-2 max-w-xl text-sm text-[var(--sidebar-fg-muted)]">
                        GPS / phone fail ho to yahan se morning ya evening laga do. Evening pe
                        salary auto-earn hoti hai.
                      </p>
                    </div>
                    <div className="p-2.5 md:p-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="text-sm sm:col-span-2">
                          <span className="mb-1.5 block text-ink-soft">Duty booking</span>
                          <select
                            className="field"
                            value={markBookingId}
                            onChange={(e) => setMarkBookingId(e.target.value)}
                          >
                            <option value="">Select booking</option>
                            {detail.assigned.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.id} · {b.patientName} · {b.status}
                              </option>
                            ))}
                            {bookings
                              .filter(
                                (b) =>
                                  !detail.assigned.some((a) => a.id === b.id) &&
                                  (b.status === "active" || b.status === "assigned"),
                              )
                              .map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.id} · {b.patientName} (reassign)
                                </option>
                              ))}
                          </select>
                        </label>
                        <label className="text-sm">
                          <span className="mb-1.5 block text-ink-soft">Slot</span>
                          <div className="grid grid-cols-2 gap-2">
                            {(["morning", "evening"] as const).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setMarkSlot(s)}
                                className={cn(
                                  "inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold capitalize transition",
                                  markSlot === s
                                    ? s === "morning"
                                      ? "border-sea bg-sea text-[var(--sidebar-fg)]"
                                      : "border-mint bg-mint text-[var(--sidebar-fg)]"
                                    : "border-[var(--line)] bg-surface text-ink-soft",
                                )}
                              >
                                {s === "morning" ? (
                                  <Sun className="h-4 w-4" />
                                ) : (
                                  <Moon className="h-4 w-4" />
                                )}
                                {s}
                              </button>
                            ))}
                          </div>
                        </label>
                        <label className="text-sm">
                          <span className="mb-1.5 block text-ink-soft">Duty date</span>
                          <input
                            className="field"
                            type="date"
                            value={markDate}
                            onChange={(e) => setMarkDate(e.target.value)}
                          />
                        </label>
                        <label className="text-sm sm:col-span-2">
                          <span className="mb-1.5 block text-ink-soft">Note (optional)</span>
                          <input
                            className="field"
                            placeholder="e.g. Phone GPS fail — desk mark"
                            value={markNote}
                            onChange={(e) => setMarkNote(e.target.value)}
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        disabled={marking || !markBookingId}
                        onClick={() => void adminMarkPresent()}
                        className="mt-2 w-full rounded-full bg-mint px-3 py-2 text-sm font-semibold text-[var(--sidebar-fg)] shadow-sm transition hover:brightness-105 disabled:opacity-50"
                      >
                        {marking ? "Saving…" : `Mark ${markSlot} present`}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.5rem] bg-surface p-3 shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-2xl">
                {editingId ? "Edit staff" : "Add staff + login"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-paper-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createdCred ? (
              <div className="mt-2 space-y-1.5 rounded-2xl bg-paper-2 p-4">
                <p className="font-semibold text-mint">Staff created</p>
                <p className="text-sm">Share these login details with the staff member:</p>
                <p className="text-sm">
                  <strong>Email:</strong> {createdCred.email}
                </p>
                <p className="text-sm">
                  <strong>Password:</strong> {createdCred.password}
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-sea px-4 py-2 text-sm font-semibold text-[var(--sidebar-fg)]"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-2 space-y-1.5">
                <input
                  className="field"
                  placeholder="Full name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    className="field"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as Staff["role"] })}
                  >
                    <option value="Nurse">Nurse</option>
                    <option value="Attendant">Attendant</option>
                    <option value="Physio">Physio</option>
                  </select>
                  <select
                    className="field"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as Staff["status"] })
                    }
                  >
                    <option value="available">available</option>
                    <option value="on-duty">on-duty</option>
                    <option value="leave">leave</option>
                  </select>
                </div>
                <input
                  className="field"
                  placeholder="Phone *"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
                <input
                  className="field"
                  placeholder="Area"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                />
                <input
                  className="field"
                  placeholder="Skills (comma separated)"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="field"
                    type="number"
                    min={0}
                    placeholder="Monthly salary"
                    value={form.salaryMonthly}
                    onChange={(e) => setForm({ ...form, salaryMonthly: e.target.value })}
                  />
                  <input
                    className="field"
                    type="number"
                    min={1}
                    placeholder="Per-shift salary *"
                    value={form.salaryPerShift}
                    onChange={(e) => setForm({ ...form, salaryPerShift: e.target.value })}
                    required
                  />
                </div>
                <input
                  className="field"
                  type="email"
                  placeholder="Login email *"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <input
                  className="field"
                  type="text"
                  placeholder={editingId ? "New password (optional)" : "Login password *"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingId}
                />
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-full bg-sea px-4 py-3 text-sm font-semibold text-[var(--sidebar-fg)] disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update staff" : "Create staff + login"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Avatar({
  name,
  photoUrl,
  active,
}: {
  name: string;
  photoUrl?: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-surface text-sm font-semibold text-sea ring-2 transition",
        active ? "ring-sea/40" : "ring-transparent",
      )}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 1)
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "sea" | "mint" | "ink" | "warm";
}) {
  const bar =
    tone === "sea"
      ? "from-sea/15 to-transparent"
      : tone === "mint"
        ? "from-mint/15 to-transparent"
        : tone === "warm"
          ? "from-amber-400/15 to-transparent"
          : "from-ink/10 to-transparent";
  return (
    <div className={cn("soft-panel relative overflow-hidden rounded-2xl p-2.5")}>
      <div
        className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", bar)}
      />
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
          {label}
        </p>
        <p className="font-display mt-2 text-3xl tracking-[-0.03em]">{value}</p>
        <p className="mt-1 text-xs text-ink-soft">{hint}</p>
      </div>
    </div>
  );
}

function HeroStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-[var(--sidebar-surface)] px-4 py-3 ring-1 ring-[var(--sidebar-line)] backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--sidebar-fg-faint)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--sidebar-fg)]">{value}</p>
      <p className="mt-0.5 text-[11px] text-[var(--sidebar-fg-faint)]">{sub}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-[var(--line)] pb-3 last:border-0 last:pb-0">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full", className)} />
      {label}
    </span>
  );
}

function MiniMoney({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-panel rounded-2xl p-4">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        <IndianRupee className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

