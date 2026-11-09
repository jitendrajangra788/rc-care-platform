"use client";

import { format, isSameDay, parseISO } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import type { Booking, LeaveRequest, NurseAvailability, Staff } from "@/lib/types";
import {
  bookingTouchesDay,
  nurseStatusOnDay,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { DutyBlock } from "./DutyBlock";
import {
  HATCH_UNAVAILABLE,
  cellDropId,
  weeklyHoursForNurse,
} from "./utils";

function RosterCell({
  staffId,
  day,
  duties,
  blocked,
  bookings,
  leaves,
  availability,
  asOf,
  isToday,
  onOpen,
}: {
  staffId: string;
  day: string;
  duties: Booking[];
  blocked: boolean;
  bookings: Booking[];
  leaves: LeaveRequest[];
  availability: NurseAvailability[];
  asOf: string;
  isToday: boolean;
  onOpen: (b: Booking) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: cellDropId(staffId, day),
    data: { staffId, day },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[2.75rem] border-b border-r border-[var(--line)] p-1 transition",
        isToday && "bg-[var(--primary-soft)]/35",
        blocked && HATCH_UNAVAILABLE,
        isOver && "ring-2 ring-inset ring-[var(--primary)]",
      )}
    >
      <div className="space-y-1">
        {duties.map((b) => (
          <DutyBlock
            key={b.id}
            booking={b}
            bookings={bookings}
            leaves={leaves}
            availability={availability}
            asOf={asOf}
            compact
            onClick={() => onOpen(b)}
          />
        ))}
      </div>
    </div>
  );
}

export function RosterView({
  staff,
  weekDays,
  bookings,
  filteredBookings,
  leaves,
  availability,
  asOf,
  nurseFilter,
  onOpen,
}: {
  staff: Staff[];
  weekDays: Date[];
  bookings: Booking[];
  filteredBookings: Booking[];
  leaves: LeaveRequest[];
  availability: NurseAvailability[];
  asOf: string;
  nurseFilter: string;
  onOpen: (b: Booking) => void;
}) {
  const dayIsos = weekDays.map((d) => format(d, "yyyy-MM-dd"));
  const rows = staff.filter((s) => !nurseFilter || s.id === nurseFilter);
  const today = new Date();

  return (
    <div className="overflow-auto rounded-[var(--radius-xl)] border border-[var(--line)]">
      <div
        className="grid min-w-[720px]"
        style={{
          gridTemplateColumns: `minmax(10rem,12rem) repeat(${weekDays.length}, minmax(6.5rem,1fr))`,
        }}
      >
        <div className="sticky left-0 top-0 z-30 border-b border-r border-[var(--line)] bg-surface px-3 py-2 text-xs font-semibold text-muted">
          Nurse
        </div>
        {weekDays.map((d) => {
          const iso = format(d, "yyyy-MM-dd");
          const isToday = isSameDay(d, today);
          return (
            <div
              key={iso}
              className={cn(
                "sticky top-0 z-20 border-b border-r border-[var(--line)] bg-surface px-2 py-2 text-center",
                isToday && "bg-[var(--primary-soft)]",
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {format(d, "EEE")}
              </p>
              <p className="text-sm font-semibold text-heading">{format(d, "d")}</p>
            </div>
          );
        })}

        {rows.map((s) => {
          const hours = weeklyHoursForNurse(s.id, dayIsos, bookings, asOf);
          return (
            <div key={s.id} className="contents">
              <div className="sticky left-0 z-10 flex flex-col justify-center gap-1 border-b border-r border-[var(--line)] bg-surface px-3 py-2">
                <p className="truncate text-sm font-semibold text-heading">{s.name}</p>
                <p className="truncate text-[11px] text-muted">{s.area}</p>
                <span
                  className={cn(
                    "w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                    hours >= 60
                      ? "border-warning/40 bg-[var(--warning-soft)] text-[color-mix(in_srgb,var(--warning)_90%,var(--heading))]"
                      : "border-[var(--line)] bg-paper-2 text-muted",
                  )}
                >
                  {hours}h / wk
                </span>
              </div>
              {dayIsos.map((iso) => {
                const dayInfo = nurseStatusOnDay({
                  staff: s,
                  day: iso,
                  bookings,
                  leaves,
                  availability,
                  asOf,
                });
                const blocked =
                  dayInfo.status === "leave" || dayInfo.status === "unavailable";
                const duties = filteredBookings.filter(
                  (b) =>
                    b.assignedStaffId === s.id &&
                    b.status !== "cancelled" &&
                    bookingTouchesDay(b, iso, asOf),
                );
                return (
                  <RosterCell
                    key={`${s.id}-${iso}`}
                    staffId={s.id}
                    day={iso}
                    duties={duties}
                    blocked={blocked}
                    bookings={bookings}
                    leaves={leaves}
                    availability={availability}
                    asOf={asOf}
                    isToday={isSameDay(parseISO(iso + "T12:00:00"), today)}
                    onOpen={onOpen}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      {rows.length === 0 ? (
        <p className="p-3 text-center text-sm text-muted">No nurses match the filter.</p>
      ) : null}
    </div>
  );
}
