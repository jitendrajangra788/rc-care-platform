"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpDown,
  ClipboardList,
  MapPin,
  Phone,
  Search,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import type { NursePatientRow } from "@/lib/nurse-desk";
import { formatDate, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePagedList } from "@/hooks/usePagedList";
import { NurseStatusPill } from "@/components/dashboard/NurseStatusPill";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

type Scope = "active" | "all" | "past";
type Focus =
  | "all"
  | "today"
  | "report"
  | "doctor"
  | "attendance"
  | "urgent"
  | "upcoming";
type SortKey = "pending" | "name" | "newest";

export function NursePatientsList({
  rows,
  initialFocus = "all",
}: {
  rows: NursePatientRow[];
  initialFocus?: Focus;
}) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("active");
  const [focus, setFocus] = useState<Focus>(initialFocus);
  const [sort, setSort] = useState<SortKey>("pending");
  const [statusFilter, setStatusFilter] = useState("all");
  const [careType, setCareType] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");

  const careTypes = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const t = r.activeBooking?.careType || r.bookings[0]?.careType;
      if (t) set.add(t);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const shifts = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const s = r.activeBooking?.shift || r.bookings[0]?.shift;
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const bookingStatuses = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.activeBooking?.status) set.add(r.activeBooking.status);
      for (const b of r.bookings) if (b.status) set.add(b.status);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const hasExtraFilters =
    query.trim() !== "" ||
    statusFilter !== "all" ||
    careType !== "all" ||
    shiftFilter !== "all" ||
    focus !== "all" ||
    sort !== "pending" ||
    scope !== "active";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const today = rows[0]?.today;

    let list = rows.filter((r) => {
      if (scope === "active" && !r.activeBooking) return false;
      if (scope === "past" && r.activeBooking) return false;

      const booking = r.activeBooking || r.bookings[0];
      if (statusFilter.startsWith("patient:")) {
        if (r.patient.status !== statusFilter.slice("patient:".length)) return false;
      } else if (statusFilter !== "all") {
        if ((booking?.status || "") !== statusFilter) return false;
      }
      if (careType !== "all" && (booking?.careType || "") !== careType) return false;
      if (shiftFilter !== "all" && (booking?.shift || "") !== shiftFilter) return false;

      if (focus === "today" && !r.isTodayDuty) return false;
      if (focus === "report" && !r.reportPendingToday) return false;
      if (focus === "doctor" && !r.doctorPending) return false;
      if (focus === "attendance" && !(r.isTodayDuty && !r.attendanceComplete)) {
        return false;
      }
      if (focus === "urgent" && !r.urgent) return false;
      if (focus === "upcoming") {
        const start = r.activeBooking?.startDate;
        if (!start || !today || start <= today) return false;
      }

      if (!q) return true;
      const p = r.patient;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.area || "").toLowerCase().includes(q) ||
        (booking?.careType || "").toLowerCase().includes(q) ||
        (booking?.id || "").toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      if (sort === "name") return a.patient.name.localeCompare(b.patient.name);
      if (sort === "newest") {
        const ad = a.activeBooking?.startDate || a.bookings[0]?.startDate || "";
        const bd = b.activeBooking?.startDate || b.bookings[0]?.startDate || "";
        return bd.localeCompare(ad);
      }
      if (b.pendingTaskCount !== a.pendingTaskCount) {
        return b.pendingTaskCount - a.pendingTaskCount;
      }
      return a.patient.name.localeCompare(b.patient.name);
    });

    return list;
  }, [rows, query, scope, focus, sort, statusFilter, careType, shiftFilter]);

  const { page, pageCount, pageSize, rows: pageRows, setPage, setPageSize, resetPage } =
    usePagedList(filtered, 10);

  function clearFilters() {
    setQuery("");
    setScope("active");
    setFocus("all");
    setSort("pending");
    setStatusFilter("all");
    setCareType("all");
    setShiftFilter("all");
    resetPage();
  }

  return (
    <div className="ehr-worklist">
      <div className="ehr-worklist-head space-y-3 p-3 md:p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              Nurse census · Worklist
            </p>
            <h2 className="font-display mt-1 text-xl text-heading md:text-2xl">
              Patient directory
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Search MRN / name / phone · filter acuity · open chart
            </p>
          </div>
          <Badge tone="neutral">{filtered.length} in view</Badge>
        </div>

        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="field field-with-icon"
              placeholder="Find patient by name, ID (MRN), or phone…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
              aria-label="Search patients"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <label className="flex items-center gap-1.5 text-xs text-muted">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <select
                className="field !w-auto !py-1.5 !text-sm"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortKey);
                  resetPage();
                }}
              >
                <option value="pending">Acuity · pending first</option>
                <option value="name">Name A–Z</option>
                <option value="newest">Newest assignment</option>
              </select>
            </label>
            {hasExtraFilters ? (
              <button type="button" onClick={clearFilters} className="btn btn-ghost btn-sm">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            ) : null}
          </div>
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          <Chip
            active={scope === "active"}
            onClick={() => {
              setScope("active");
              resetPage();
            }}
            label="Active Care"
          />
          <Chip
            active={scope === "all"}
            onClick={() => {
              setScope("all");
              resetPage();
            }}
            label="All Assigned"
          />
          <Chip
            active={scope === "past"}
            onClick={() => {
              setScope("past");
              resetPage();
            }}
            label="Past Patients"
          />
          <span className="mx-0.5 hidden h-7 w-px bg-[var(--line)] sm:block" />
          {(
            [
              ["all", "All"],
              ["today", "Today"],
              ["attendance", "Attendance"],
              ["report", "Reports"],
              ["doctor", "Dr review"],
              ["upcoming", "Upcoming"],
              ["urgent", "Urgent"],
            ] as const
          ).map(([key, label]) => (
            <Chip
              key={key}
              active={focus === key}
              onClick={() => {
                setFocus(key);
                resetPage();
              }}
              label={label}
            />
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <select
            className="field !text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              resetPage();
            }}
            aria-label="Status filter"
          >
            <option value="all">Status · All</option>
            {bookingStatuses.map((s) => (
              <option key={s} value={s}>
                Booking · {s}
              </option>
            ))}
            <option value="patient:active">Patient · active</option>
            <option value="patient:inactive">Patient · inactive</option>
          </select>
          <select
            className="field !text-sm"
            value={careType}
            onChange={(e) => {
              setCareType(e.target.value);
              resetPage();
            }}
            aria-label="Care type filter"
          >
            <option value="all">Care type · All</option>
            {careTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="field !text-sm"
            value={shiftFilter}
            onChange={(e) => {
              setShiftFilter(e.target.value);
              resetPage();
            }}
            aria-label="Shift filter"
          >
            <option value="all">Shift · All</option>
            {shifts.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="No patients in this worklist"
            description="Clear filters, or wait for care desk to assign a patient."
          />
        </div>
      ) : (
        <>
          <div className="hidden border-b border-[var(--line)] bg-paper-2/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted xl:grid xl:grid-cols-[1.35fr_1fr_0.9fr_0.85fr_auto] xl:gap-3">
            <span>Patient</span>
            <span>Assignment</span>
            <span>Attendance</span>
            <span>Care status</span>
            <span className="text-right">Actions</span>
          </div>

          <div>
            {pageRows.map((row) => (
              <WorklistRow key={row.patient.id} row={row} />
            ))}
          </div>

          <div className="border-t border-[var(--line)] p-3">
            <Pagination
              page={page}
              pageCount={pageCount}
              pageSize={pageSize}
              total={rows.length}
              filteredCount={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 15, 30]}
              noun="patients"
            />
          </div>
        </>
      )}
    </div>
  );
}

function WorklistRow({ row }: { row: NursePatientRow }) {
  const { patient, activeBooking, bookings } = row;
  const phoneHref = patient.phone
    ? `tel:${patient.phone.replace(/[^\d+]/g, "")}`
    : undefined;
  const initials = patient.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

  const acuity = row.urgent
    ? "ehr-acuity-urgent"
    : row.pendingTaskCount > 0
      ? "ehr-acuity-warn"
      : activeBooking
        ? "ehr-acuity-ok"
        : "ehr-acuity-idle";

  const nextDuty = !activeBooking
    ? "—"
    : row.isTodayDuty
      ? "Today"
      : formatDate(activeBooking.startDate);

  const attendanceLabel = !row.isTodayDuty
    ? activeBooking
      ? "Off census today"
      : "Past care"
    : row.attendanceComplete
      ? "Duty complete"
      : row.morningDone
        ? "AM done · PM open"
        : "Attendance open";

  const careStatus = !activeBooking
    ? "Past assignment"
    : row.urgent
      ? "Urgent acuity"
      : row.pendingTaskCount > 0
        ? `${row.pendingTaskCount} open task(s)`
        : "On pathway";

  return (
    <article className="ehr-row xl:grid-cols-[1.35fr_1fr_0.9fr_0.85fr_auto]">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className={cn("ehr-acuity", acuity)} aria-hidden />
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] font-display text-sm font-semibold text-primary">
          {initials || <UserRound className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href={`/dashboard/nurse/patients/${patient.id}`}
              className="font-name text-base font-semibold text-heading hover:text-primary md:text-lg"
            >
              {patient.name}
            </Link>
            {activeBooking ? (
              <Badge tone="success">{activeBooking.status}</Badge>
            ) : (
              <Badge tone="neutral">Past</Badge>
            )}
            {row.urgent ? <Badge tone="danger">Urgent</Badge> : null}
          </div>
          <p className="mt-0.5 text-xs font-semibold tracking-wide text-muted">
            MRN · {patient.id}
          </p>
          <p className="mt-1 text-sm text-muted">
            {patient.age ? `${patient.age}y` : "Age —"}
            {patient.gender ? ` · ${patient.gender}` : ""}
          </p>
          {phoneHref ? (
            <a
              href={phoneHref}
              className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <Phone className="h-3.5 w-3.5" />
              {formatPhone(patient.phone)}
            </a>
          ) : (
            <p className="mt-1 text-sm text-muted">{formatPhone(patient.phone)}</p>
          )}
          <p className="mt-1 flex items-start gap-1 text-sm text-muted">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2">
              {patient.address || patient.area || "Location not set"}
            </span>
          </p>
        </div>
      </div>

      <div className="min-w-0 text-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted xl:hidden">
          Assignment
        </p>
        {activeBooking ? (
          <>
            <p className="font-semibold text-heading">
              {activeBooking.careType} · {activeBooking.shift}
            </p>
            <p className="mt-0.5 text-muted">
              Start {formatDate(activeBooking.startDate)} · {activeBooking.id}
            </p>
            <p className="mt-1 text-heading">
              Next duty · <span className="font-semibold">{nextDuty}</span>
            </p>
          </>
        ) : (
          <p className="text-muted">
            {bookings.length} past booking{bookings.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <div className="min-w-0 text-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted xl:hidden">
          Attendance
        </p>
        <Badge
          tone={
            row.attendanceComplete ? "success" : row.isTodayDuty ? "warning" : "neutral"
          }
        >
          {attendanceLabel}
        </Badge>
        {row.isTodayDuty ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <NurseStatusPill label="AM" ok={row.morningDone} compact />
            <NurseStatusPill label="PM" ok={row.eveningDone} compact />
          </div>
        ) : null}
      </div>

      <div className="min-w-0 text-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted xl:hidden">
          Care status
        </p>
        <Badge tone={row.pendingTaskCount ? "warning" : "success"}>{careStatus}</Badge>
        {row.doctorPending ? (
          <div className="mt-2">
            <Badge tone="warning">
              <Stethoscope className="h-3 w-3" /> Dr pending
            </Badge>
          </div>
        ) : null}
        {row.reportPendingToday ? (
          <div className="mt-2">
            <Badge tone="warning">Report due</Badge>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 xl:flex xl:max-w-[15rem] xl:flex-wrap xl:justify-end">
        <Link
          href={`/dashboard/nurse/patients/${patient.id}`}
          className="btn btn-primary btn-sm w-full justify-center xl:w-auto"
        >
          <UserRound className="h-3.5 w-3.5" /> Open chart
        </Link>
        <Link
          href={`/dashboard/nurse/patients/${patient.id}?tab=care`}
          className="btn btn-outline btn-sm w-full justify-center xl:w-auto"
        >
          <ClipboardList className="h-3.5 w-3.5" /> Care plan
        </Link>
        <Link
          href={`/dashboard/nurse/patients/${patient.id}?tab=vitals`}
          className="btn btn-outline btn-sm w-full justify-center xl:w-auto"
        >
          <Activity className="h-3.5 w-3.5" /> Vitals
        </Link>
      </div>
    </article>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "bg-primary text-[var(--sidebar-fg)]"
          : "bg-white text-heading ring-1 ring-[var(--line)] hover:bg-[var(--secondary)]",
      )}
    >
      {label}
    </button>
  );
}
