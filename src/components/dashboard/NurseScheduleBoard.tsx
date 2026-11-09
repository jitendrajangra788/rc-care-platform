"use client";

import { useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { Clock3, MapPin } from "lucide-react";
import type { Booking, LeaveRequest } from "@/lib/types";
import { formatShiftLabel, todayISO } from "@/lib/schedule";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const statusTone: Record<Booking["status"], BadgeTone> = {
  pending: "warning",
  assigned: "primary",
  active: "success",
  completed: "neutral",
  cancelled: "danger",
};

export function NurseScheduleBoard({
  duties,
  leaves,
}: {
  duties: Booking[];
  leaves: LeaveRequest[];
}) {
  const asOf = todayISO();
  const [focus, setFocus] = useState(asOf);
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        format(addDays(parseISO(focus + "T12:00:00"), i - 1), "yyyy-MM-dd"),
      ),
    [focus],
  );

  const upcoming = duties
    .filter((d) => d.status === "assigned" || d.status === "active")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  function touches(b: Booking, day: string) {
    const from = b.startDate;
    const to =
      b.endDate ||
      (b.status === "active" || b.status === "assigned" ? (asOf > from ? asOf : from) : from);
    return day >= from && day <= to;
  }

  const myLeave = leaves.filter((l) => l.status === "approved");
  const focusDuties = upcoming.filter((b) => touches(b, focus));
  const focusOnLeave = myLeave.some((l) => focus >= l.fromDate && focus <= l.toDate);

  return (
    <div className="space-y-2">
      <section className="soft-panel p-1.5 sm:p-2 md:p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg text-heading sm:text-xl">My week</h2>
            <p className="text-[11px] text-muted sm:text-xs">Tap a day · leave days in amber</p>
          </div>
          <input
            type="date"
            className="field !py-1.5 max-w-[10.5rem] text-sm"
            value={focus}
            onChange={(e) => setFocus(e.target.value || asOf)}
          />
        </div>

        {/* Compact horizontal week strip (phone + desktop) */}
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 lg:grid lg:grid-cols-7 lg:overflow-visible">
          {days.map((day) => {
            const list = upcoming.filter((b) => touches(b, day));
            const onLeave = myLeave.some((l) => day >= l.fromDate && day <= l.toDate);
            const selected = day === focus;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setFocus(day)}
                className={cn(
                  "min-w-[4.25rem] flex-1 rounded-[0.8rem] border px-2 py-2 text-left transition lg:min-w-0",
                  selected
                    ? "border-primary bg-[var(--primary-soft)] ring-2 ring-primary/25"
                    : "border-[var(--line)] bg-surface",
                  onLeave && !selected && "bg-[var(--warning-soft)]",
                  day === asOf && !selected && "border-primary/35",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {format(parseISO(day), "EEE")}
                </p>
                <p className="font-display text-base leading-none text-heading">
                  {format(parseISO(day), "d")}
                </p>
                <p className="mt-1 text-[10px] font-medium text-muted">
                  {onLeave ? "Leave" : list.length ? `${list.length} duty` : "Free"}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected day detail on phone */}
        <div className="mt-2 rounded-[0.85rem] border border-[var(--line)] bg-[var(--surface-muted)]/50 p-2.5 lg:hidden">
          <p className="text-xs font-semibold text-heading">
            {format(parseISO(focus + "T12:00:00"), "EEEE, d MMM")}
          </p>
          {focusOnLeave ? (
            <p className="mt-1 text-xs text-amber-900">On approved leave</p>
          ) : focusDuties.length === 0 ? (
            <p className="mt-1 text-xs text-muted">No duty this day</p>
          ) : (
            <ul className="mt-1.5 space-y-1.5">
              {focusDuties.map((b) => (
                <li
                  key={b.id}
                  className="rounded-lg border border-[var(--line)] bg-surface px-2.5 py-2"
                >
                  <p className="text-sm font-semibold text-heading">{b.patientName}</p>
                  <p className="text-[11px] text-muted">{formatShiftLabel(b)}</p>
                  <p className="text-[11px] text-muted">{b.area || b.address}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="soft-panel p-1.5 sm:p-2 md:p-2.5">
        <h2 className="font-display text-lg text-heading">Upcoming duties</h2>
        {upcoming.length === 0 ? (
          <div className="mt-1.5">
            <EmptyState
              title="No assigned shifts"
              description="When care desk assigns you, the duty appears here."
            />
          </div>
        ) : (
          <div className="mt-1.5 space-y-1.5">
            {upcoming.map((b) => (
              <article
                key={b.id}
                className="rounded-[0.85rem] border border-[var(--line)] bg-surface p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-heading sm:text-base">
                      {b.patientName}
                    </h3>
                    <p className="text-[11px] text-muted sm:text-xs">
                      {b.careType}
                      {b.patientAge ? ` · ${b.patientAge}y` : ""}
                    </p>
                  </div>
                  <Badge tone={statusTone[b.status]}>{b.status}</Badge>
                </div>
                <p className="mt-1.5 text-[11px] text-muted sm:text-xs">
                  <Clock3 className="mr-1 inline h-3 w-3" />
                  {formatShiftLabel(b)} · {b.startDate}
                  {b.endDate ? ` → ${b.endDate}` : ""}
                </p>
                <p className="mt-0.5 text-[11px] text-muted sm:text-xs">
                  <MapPin className="mr-1 inline h-3 w-3" />
                  {b.address}
                  {b.area ? ` · ${b.area}` : ""}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
