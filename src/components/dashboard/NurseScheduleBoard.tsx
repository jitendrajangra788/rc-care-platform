"use client";

import { useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
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
    () => Array.from({ length: 7 }, (_, i) => format(addDays(parseISO(focus + "T12:00:00"), i - 1), "yyyy-MM-dd")),
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

  return (
    <div className="space-y-2">
      <section className="soft-panel p-2 md:p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-display-md text-heading">My week</h2>
            <p className="text-xs text-muted sm:text-sm">
              Tap a date to recenter. Leave days highlight in amber.
            </p>
          </div>
          <input
            type="date"
            className="field max-w-[11rem]"
            value={focus}
            onChange={(e) => setFocus(e.target.value || asOf)}
          />
        </div>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {days.map((day) => {
            const list = upcoming.filter((b) => touches(b, day));
            const onLeave = myLeave.some((l) => day >= l.fromDate && day <= l.toDate);
            return (
              <div
                key={day}
                className={cn(
                  "rounded-[var(--radius-lg)] border border-[var(--line)] bg-surface p-2.5 shadow-[var(--shadow-xs)]",
                  day === asOf && "border-primary/40 ring-2 ring-primary/20",
                  onLeave && "bg-[var(--warning-soft)]",
                )}
              >
                <p className="text-xs font-semibold text-muted">
                  <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                  {format(parseISO(day), "EEE d")}
                </p>
                {onLeave ? (
                  <p className="mt-2 text-xs font-medium text-amber-900">On approved leave</p>
                ) : list.length === 0 ? (
                  <p className="mt-2 text-xs text-muted">Free</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {list.map((b) => (
                      <li key={b.id} className="rounded-lg bg-paper-2 px-2 py-1.5 text-xs">
                        <p className="font-semibold text-heading">{b.patientName}</p>
                        <p className="text-muted">{formatShiftLabel(b)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="soft-panel p-2 md:p-2.5">
        <h2 className="font-display text-xl text-heading">Upcoming duties</h2>
        {upcoming.length === 0 ? (
          <div className="mt-1.5">
            <EmptyState
              title="No assigned shifts"
              description="When care desk assigns you a patient, the duty appears here with location and shift status."
            />
          </div>
        ) : (
          <div className="mt-1.5 space-y-1.5">
            {upcoming.map((b) => (
              <article
                key={b.id}
                className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-surface p-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-name text-lg text-heading">{b.patientName}</h3>
                    <p className="text-sm text-muted">
                      {b.careType}
                      {b.patientAge ? ` · ${b.patientAge}y` : ""}
                      {b.gender ? ` · ${b.gender}` : ""}
                    </p>
                  </div>
                  <Badge tone={statusTone[b.status]}>{b.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted">
                  <Clock3 className="mr-1 inline h-3.5 w-3.5" />
                  {formatShiftLabel(b)} · {b.startDate}
                  {b.endDate ? ` → ${b.endDate}` : ""}
                </p>
                <p className="mt-1 text-sm text-muted">
                  <MapPin className="mr-1 inline h-3.5 w-3.5" />
                  {b.address}
                  {b.area ? ` · ${b.area}` : ""}
                </p>
                {b.notes ? (
                  <p className="mt-3 rounded-[var(--radius-lg)] bg-paper-2 px-3 py-2 text-sm text-heading">
                    Care brief: {b.notes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
