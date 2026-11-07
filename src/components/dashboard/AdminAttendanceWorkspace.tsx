"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Moon,
  Navigation,
  Search,
  ShieldAlert,
  Sun,
  Users,
} from "lucide-react";
import type { Attendance, Booking, Staff } from "@/lib/types";
import { dutyProgress, normalizeSlot, todayDutyDate } from "@/lib/duty";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { GpsTrailMap } from "@/components/dashboard/GpsTrailMap";
import { AttendanceExportBar } from "@/components/dashboard/AttendanceExportBar";

type Tab = "today" | "feed" | "trail" | "staff";

function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function slotLabel(type: Attendance["type"]) {
  const s = normalizeSlot(type);
  return s || String(type);
}

export function AdminAttendanceWorkspace({
  attendance,
  bookings,
  staff,
}: {
  attendance: Attendance[];
  bookings: Booking[];
  staff: Staff[];
}) {
  const today = todayDutyDate();
  const [tab, setTab] = useState<Tab>("today");
  const [query, setQuery] = useState("");
  const [slotFilter, setSlotFilter] = useState<"all" | "morning" | "evening">("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(today);
  const [selectedId, setSelectedId] = useState<string | null>(attendance[0]?.id || null);

  const staffNameById = useMemo(
    () => Object.fromEntries(staff.map((s) => [s.id, s.name])),
    [staff],
  );

  const activeDuties = useMemo(
    () =>
      bookings.filter((b) => b.status === "active" || b.status === "assigned"),
    [bookings],
  );

  const kpis = useMemo(() => {
    const todayRows = attendance.filter(
      (a) => (a.dutyDate || a.createdAt.slice(0, 10)) === today,
    );
    let morning = 0;
    let evening = 0;
    let complete = 0;
    for (const b of activeDuties) {
      const p = dutyProgress(attendance, b.id, today);
      if (p.morningDone) morning += 1;
      if (p.eveningDone) evening += 1;
      if (p.complete) complete += 1;
    }
    return {
      todayMarks: todayRows.length,
      morning,
      evening,
      complete,
      weak: attendance.filter((a) => a.gpsQuality === "weak").length,
      desk: attendance.filter((a) => a.markedByAdmin).length,
      onSite: attendance.filter((a) => a.withinGeofence).length,
      uniqueStaff: new Set(attendance.map((a) => a.staffId)).size,
    };
  }, [attendance, activeDuties, today]);

  const filteredFeed = useMemo(() => {
    return attendance
      .filter((a) => {
        const date = a.dutyDate || a.createdAt.slice(0, 10);
        if (dateFilter && date !== dateFilter) return false;
        const slot = normalizeSlot(a.type);
        if (slotFilter !== "all" && slot !== slotFilter) return false;
        if (staffFilter !== "all" && a.staffId !== staffFilter) return false;
        const b = bookings.find((x) => x.id === a.bookingId);
        const sName = staffNameById[a.staffId] || "";
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          sName.toLowerCase().includes(q) ||
          a.bookingId.toLowerCase().includes(q) ||
          (b?.patientName || "").toLowerCase().includes(q) ||
          (b?.address || "").toLowerCase().includes(q)
        );
      })
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [attendance, bookings, dateFilter, slotFilter, staffFilter, query, staffNameById]);

  const selected = attendance.find((a) => a.id === selectedId) || filteredFeed[0] || null;

  const byStaff = useMemo(() => {
    return staff
      .map((s) => {
        const rows = attendance.filter((a) => a.staffId === s.id);
        const todayP = {
          morning: rows.some(
            (a) =>
              (a.dutyDate || a.createdAt.slice(0, 10)) === today &&
              normalizeSlot(a.type) === "morning",
          ),
          evening: rows.some(
            (a) =>
              (a.dutyDate || a.createdAt.slice(0, 10)) === today &&
              normalizeSlot(a.type) === "evening",
          ),
        };
        return {
          staff: s,
          total: rows.length,
          todayMorning: todayP.morning,
          todayEvening: todayP.evening,
          weak: rows.filter((a) => a.gpsQuality === "weak").length,
          desk: rows.filter((a) => a.markedByAdmin).length,
          last: rows.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [staff, attendance, today]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "today", label: "Live today" },
    { key: "feed", label: "Check-in feed" },
    { key: "trail", label: "GPS trail" },
    { key: "staff", label: "By staff" },
  ];

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Ops control"
        title="Attendance desk"
        subtitle="Aaj ka live board, GPS trail, site photos aur staff-wise present pulse — ek advanced desk."
        action={
          <AttendanceExportBar
            attendance={attendance}
            staff={staff}
            bookings={bookings}
          />
        }
      />

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Today marks" value={String(kpis.todayMarks)} hint={`${kpis.complete} duties complete`} tone="sea" />
        <Kpi label="Morning done" value={`${kpis.morning}/${activeDuties.length}`} hint="Active duties" tone="ink" />
        <Kpi label="Evening done" value={`${kpis.evening}/${activeDuties.length}`} hint="Salary unlocks on evening" tone="mint" />
        <Kpi
          label="Alerts"
          value={String(kpis.weak)}
          hint={`${kpis.weak} weak GPS · ${kpis.desk} desk marks`}
          tone="warm"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-[var(--radius-xl)] border border-[var(--line)] bg-surface/90 p-1.5 shadow-sm backdrop-blur">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-[var(--radius-lg)] px-3.5 py-2 text-sm font-semibold transition",
              tab === t.key
                ? "bg-primary text-[var(--sidebar-fg)] shadow-sm"
                : "text-muted hover:bg-paper-2 hover:text-heading",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "today" ? (
        <div className="space-y-2">
          <div className="soft-panel overflow-hidden rounded-[1.75rem]">
            <div className="border-b border-[var(--line)] bg-[var(--sidebar-bg)] px-3 py-2 text-[var(--sidebar-fg)] md:px-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sidebar-fg-faint)]">
                Live duty board · {today}
              </p>
              <h2 className="font-display mt-1 text-3xl">Who is present today</h2>
              <p className="mt-2 text-sm text-[var(--sidebar-fg-muted)]">
                Morning + evening dono green = duty complete. Missing slots red/amber me dikhte hain.
              </p>
            </div>
            <div className="p-4 md:p-3">
              {activeDuties.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-5 w-5" />}
                  title="No active duties"
                  description="No active / assigned duties right now."
                  className="py-3"
                />
              ) : (
                <div className="grid gap-2 lg:grid-cols-2">
                  {activeDuties.map((b) => {
                    const p = dutyProgress(attendance, b.id, today);
                    const nurse = staff.find((s) => s.id === b.assignedStaffId);
                    return (
                      <article
                        key={b.id}
                        className="rounded-2xl border border-[var(--line)] bg-surface p-4 transition hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-name text-lg">{b.patientName}</p>
                            <p className="mt-0.5 text-sm text-ink-soft">
                              {nurse?.name || "Unassigned"} · {b.id}
                            </p>
                            <p className="mt-1 text-xs text-ink-soft">{b.address}</p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase",
                              p.complete
                                ? "bg-[var(--success-soft)] text-mint"
                                : p.morningDone
                                  ? "bg-[var(--warning-soft)] text-warning"
                                  : "bg-[var(--danger-soft)] text-danger",
                            )}
                          >
                            {p.complete ? "Complete" : p.morningDone ? "Evening left" : "Pending"}
                          </span>
                        </div>
                        <div className="mt-1.5 grid grid-cols-2 gap-2">
                          <SlotChip
                            icon={<Sun className="h-3.5 w-3.5" />}
                            label="Morning"
                            done={p.morningDone}
                            time={
                              p.morning
                                ? new Date(p.morning.createdAt).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : undefined
                            }
                          />
                          <SlotChip
                            icon={<Moon className="h-3.5 w-3.5" />}
                            label="Evening"
                            done={p.eveningDone}
                            time={
                              p.evening
                                ? new Date(p.evening.createdAt).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : undefined
                            }
                          />
                        </div>
                        {p.complete ? (
                          <p className="mt-3 text-xs font-medium text-mint">
                            Salary unlocked ·{" "}
                            {formatCurrency(b.staffPayPerShift || nurse?.salaryPerShift || 700)}
                          </p>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="soft-panel rounded-[1.5rem] p-2.5 md:p-3">
            <h3 className="font-display text-2xl">Latest check-ins today</h3>
            <div className="mt-1.5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {attendance
                .filter((a) => (a.dutyDate || a.createdAt.slice(0, 10)) === today)
                .slice(0, 6)
                .map((a) => (
                  <CheckInCard
                    key={a.id}
                    a={a}
                    staffName={staffNameById[a.staffId]}
                    booking={bookings.find((b) => b.id === a.bookingId)}
                    active={false}
                    onClick={() => {
                      setSelectedId(a.id);
                      setTab("feed");
                    }}
                  />
                ))}
              {attendance.filter((a) => (a.dutyDate || a.createdAt.slice(0, 10)) === today)
                .length === 0 ? (
                <div className="md:col-span-2 xl:col-span-3">
                  <EmptyState
                    icon={<CalendarDays className="h-5 w-5" />}
                    title="No presents today"
                    description="Aaj abhi koi present nahi laga."
                    className="py-3"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "feed" ? (
        <div className="grid gap-2 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="soft-panel flex max-h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-[1.75rem]">
            <div className="border-b border-[var(--line)] p-2 md:p-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[10rem] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                  <input
                    className="field field-with-icon"
                    placeholder="Search staff, patient, booking…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <input
                  className="field w-auto"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(["all", "morning", "evening"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlotFilter(s)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold capitalize transition",
                      slotFilter === s ? "bg-ink text-[var(--sidebar-fg)]" : "bg-paper-2 text-ink-soft",
                    )}
                  >
                    {s}
                  </button>
                ))}
                <select
                  className="field ml-auto w-auto min-w-[9rem] py-1.5 text-xs"
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                >
                  <option value="all">All staff</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2 md:p-2.5">
              {filteredFeed.length === 0 ? (
                <EmptyState
                  icon={<Search className="h-5 w-5" />}
                  title="No check-ins match"
                  description="Try another date, slot, or staff filter."
                  className="py-3"
                />
              ) : (
                filteredFeed.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className="w-full text-left"
                  >
                    <CheckInCard
                      a={a}
                      staffName={staffNameById[a.staffId]}
                      booking={bookings.find((b) => b.id === a.bookingId)}
                      active={selected?.id === a.id}
                      compact
                    />
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="soft-panel h-fit rounded-[1.75rem] p-2.5 md:p-3 xl:sticky xl:top-4">
            {!selected ? (
              <EmptyState
                icon={<Navigation className="h-5 w-5" />}
                title="Select a check-in"
                description="Pick a row from the feed to inspect GPS and site photo."
                className="py-3"
              />
            ) : (
              <InspectPane
                a={selected}
                staffName={staffNameById[selected.staffId]}
                booking={bookings.find((b) => b.id === selected.bookingId)}
              />
            )}
          </section>
        </div>
      ) : null}

      {tab === "trail" ? (
        <div className="soft-panel rounded-[1.75rem] p-2.5 md:p-3">
          <div className="mb-1.5 flex items-start gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-sea/10 text-sea">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl">GPS trail map</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Booking-wise path — geofence ring, morning/evening dots, jump review.
              </p>
            </div>
          </div>
          {kpis.weak > 0 ? (
            <p className="mb-1.5 flex items-center gap-2 rounded-2xl bg-[var(--warning-soft)] px-4 py-3 text-sm text-warning">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {kpis.weak} check-in(s) with weak GPS — trail pe carefully review karo.
            </p>
          ) : null}
          <GpsTrailMap
            attendance={attendance}
            bookings={bookings}
            staffNameById={staffNameById}
          />
        </div>
      ) : null}

      {tab === "staff" ? (
        <div className="soft-panel rounded-[1.75rem] p-2.5 md:p-3">
          <div className="mb-2 flex items-start gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-mint/10 text-mint">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl">Staff presence summary</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Har staff ke aaj ke slots + total marks + weak GPS / desk marks.
              </p>
            </div>
          </div>
          {staff.length === 0 ? (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title="No staff yet"
              description="Add staff to see presence summaries here."
              className="py-3"
            />
          ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {byStaff.map((row) => (
              <article
                key={row.staff.id}
                className="rounded-2xl border border-[var(--line)] bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-name text-lg">{row.staff.name}</p>
                    <p className="text-sm text-ink-soft">
                      {row.staff.role} · {row.staff.area}
                    </p>
                  </div>
                  <span className="rounded-full bg-paper-2 px-2.5 py-1 text-[10px] font-semibold uppercase text-ink-soft">
                    {row.total} marks
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <SlotChip
                    icon={<Sun className="h-3.5 w-3.5" />}
                    label="Today AM"
                    done={row.todayMorning}
                  />
                  <SlotChip
                    icon={<Moon className="h-3.5 w-3.5" />}
                    label="Today PM"
                    done={row.todayEvening}
                  />
                </div>
                <p className="mt-3 text-xs text-ink-soft">
                  {row.weak ? `${row.weak} weak GPS · ` : ""}
                  {row.desk ? `${row.desk} desk · ` : ""}
                  Last: {row.last ? formatDateTime(row.last.createdAt) : "—"}
                </p>
              </article>
            ))}
          </div>
          )}
        </div>
      ) : null}
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
    <div className="soft-panel relative overflow-hidden rounded-2xl p-2.5">
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", bar)} />
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

function SlotChip({
  icon,
  label,
  done,
  time,
}: {
  icon: React.ReactNode;
  label: string;
  done: boolean;
  time?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 text-xs",
        done
          ? "border-mint/30 bg-[var(--success-soft)] text-mint"
          : "border-[var(--line)] bg-paper-2 text-ink-soft",
      )}
    >
      <p className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-medium">{done ? time || "Done" : "Missing"}</p>
    </div>
  );
}

function CheckInCard({
  a,
  staffName,
  booking,
  active,
  compact,
  onClick,
}: {
  a: Attendance;
  staffName?: string;
  booking?: Booking;
  active?: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  const slot = slotLabel(a.type);
  return (
    <article
      onClick={onClick}
      className={cn(
        "overflow-hidden rounded-2xl border transition",
        active
          ? "border-sea/40 ring-2 ring-sea/15 shadow-sm"
          : "border-[var(--line)] bg-surface hover:shadow-md",
        onClick && "cursor-pointer",
      )}
    >
      <div className={cn("grid", compact ? "grid-cols-[4.5rem_1fr]" : "sm:grid-cols-[1fr]")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={a.photoUrl}
          alt=""
          className={cn(
            "object-cover",
            compact ? "h-full min-h-[4.5rem] w-full" : "h-40 w-full",
          )}
        />
        <div className={cn("p-3", !compact && "p-4")}>
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                slot === "morning"
                  ? "bg-[var(--info-soft)] text-sea"
                  : "bg-[var(--success-soft)] text-mint",
              )}
            >
              {slot === "morning" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
              {slot}
            </span>
            {a.markedByAdmin ? (
              <span className="rounded-full bg-[var(--warning-soft)] px-2 py-0.5 text-[10px] font-semibold text-warning">
                Desk
              </span>
            ) : null}
            {a.gpsQuality === "weak" ? (
              <span className="rounded-full bg-[var(--danger-soft)] px-2 py-0.5 text-[10px] font-semibold text-danger">
                Weak GPS
              </span>
            ) : null}
          </div>
          <p className={cn("font-name mt-1.5", compact ? "text-sm" : "text-base")}>
            {staffName || a.staffId}
          </p>
          <p className="mt-0.5 truncate text-xs text-ink-soft">
            {booking?.patientName || a.bookingId}
          </p>
          {!compact ? (
            <p className="mt-2 text-xs text-ink-soft">
              {formatDateTime(a.createdAt)} · {formatDistance(a.distanceMeters)}
            </p>
          ) : (
            <p className="mt-1 text-[10px] text-ink-soft">
              {formatDateTime(a.createdAt)} · {formatDistance(a.distanceMeters)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function InspectPane({
  a,
  staffName,
  booking,
}: {
  a: Attendance;
  staffName?: string;
  booking?: Booking;
}) {
  const slot = slotLabel(a.type);
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={a.photoUrl}
        alt="Site"
        className="h-56 w-full rounded-2xl object-cover ring-1 ring-[var(--line)]"
      />
      <div className="mt-1.5 flex flex-wrap gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase",
            slot === "morning"
              ? "bg-[var(--info-soft)] text-sea"
              : "bg-[var(--success-soft)] text-mint",
          )}
        >
          {slot}
        </span>
        {a.punctualityStatus ? (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
              a.punctualityStatus === "present" && "bg-[var(--success-soft)] text-mint",
              a.punctualityStatus === "late" && "bg-[var(--warning-soft)] text-warning",
              a.punctualityStatus === "half-day" && "bg-[var(--danger-soft)] text-danger",
            )}
          >
            {a.punctualityStatus}
            {a.minutesLate ? ` · ${a.minutesLate}m` : ""}
            {typeof a.salaryMultiplier === "number" ? ` · ×${a.salaryMultiplier}` : ""}
          </span>
        ) : null}
        {a.withinGeofence ? (
          <span className="rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[11px] font-semibold text-mint">
            Inside geofence
          </span>
        ) : (
          <span className="rounded-full bg-[var(--danger-soft)] px-2.5 py-1 text-[11px] font-semibold text-danger">
            Outside
          </span>
        )}
        {a.gpsQuality ? (
          <span className="rounded-full bg-paper-2 px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
            GPS {a.gpsQuality}
          </span>
        ) : null}
      </div>
      <h3 className="font-name mt-1.5 text-2xl">{staffName || a.staffId}</h3>
      <p className="mt-1 text-sm text-ink-soft">
        {booking?.patientName} · {a.bookingId}
      </p>
      <p className="mt-1 text-sm text-ink-soft">{booking?.address}</p>

      <dl className="mt-2 space-y-1.5 text-sm">
        <Row label="When" value={formatDateTime(a.createdAt)} />
        <Row label="Duty date" value={a.dutyDate || a.createdAt.slice(0, 10)} />
        <Row label="Distance" value={formatDistance(a.distanceMeters)} />
        <Row
          label="Coords"
          value={`${a.lat.toFixed(5)}, ${a.lng.toFixed(5)}`}
        />
        <Row
          label="Accuracy"
          value={a.accuracy != null ? `±${Math.round(a.accuracy)} m` : "—"}
        />
        <Row label="Source" value={a.markedByAdmin ? "Admin desk" : "Staff app"} />
        {a.adminNote ? <Row label="Note" value={a.adminNote} /> : null}
        {booking?.sitePin ? <Row label="Site PIN" value="Protected" /> : null}
      </dl>

      <a
        href={`https://www.google.com/maps?q=${a.lat},${a.lng}`}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-sea px-4 py-3 text-sm font-semibold text-[var(--sidebar-fg)]"
      >
        <MapPin className="h-4 w-4" /> Open in Maps
      </a>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-[var(--line)] pb-2.5 last:border-0">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

