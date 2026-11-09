"use client";

import type { Booking, LeaveRequest, NurseAvailability, Staff } from "@/lib/types";
import { bookingTouchesDay, nurseStatusOnDay, resolveShiftTimes } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  HATCH_UNAVAILABLE,
  dutyHasConflict,
  shiftBlockClass,
  shiftDayPercent,
  shortPatientName,
} from "./utils";

const HOURS = Array.from({ length: 25 }, (_, i) => i);

export function DayTimelineView({
  staff,
  day,
  bookings,
  filteredBookings,
  leaves,
  availability,
  asOf,
  nurseFilter,
  onOpen,
}: {
  staff: Staff[];
  day: string;
  bookings: Booking[];
  filteredBookings: Booking[];
  leaves: LeaveRequest[];
  availability: NurseAvailability[];
  asOf: string;
  nurseFilter: string;
  onOpen: (b: Booking) => void;
}) {
  const rows = staff.filter((s) => !nurseFilter || s.id === nurseFilter);

  if (rows.length === 0) {
    return (
      <EmptyState title="No nurses" description="Adjust the nurse filter to see timelines." />
    );
  }

  return (
    <div className="overflow-auto rounded-[var(--radius-xl)] border border-[var(--line)]">
      <div className="min-w-[640px]">
        <div
          className="sticky top-0 z-20 grid border-b border-[var(--line)] bg-surface"
          style={{ gridTemplateColumns: "10rem 1fr" }}
        >
          <div className="border-r border-[var(--line)] px-3 py-2 text-xs font-semibold text-muted">
            Nurse
          </div>
          <div className="relative h-8">
            {HOURS.filter((h) => h % 3 === 0 && h < 24).map((h) => (
              <span
                key={h}
                className="absolute top-1 -translate-x-1/2 text-[10px] font-semibold text-muted"
                style={{ left: `${(h / 24) * 100}%` }}
              >
                {String(h).padStart(2, "0")}:00
              </span>
            ))}
          </div>
        </div>

        {rows.map((s) => {
          const dayInfo = nurseStatusOnDay({
            staff: s,
            day,
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
              bookingTouchesDay(b, day, asOf),
          );

          return (
            <div
              key={s.id}
              className="grid border-b border-[var(--line)]"
              style={{ gridTemplateColumns: "10rem 1fr" }}
            >
              <div className="flex flex-col justify-center gap-1 border-r border-[var(--line)] px-3 py-3">
                <p className="truncate text-sm font-semibold text-heading">{s.name}</p>
                <StatusBadge status={dayInfo.status} />
              </div>
              <div
                className={cn(
                  "relative h-12 bg-paper-2/40",
                  blocked && HATCH_UNAVAILABLE,
                )}
              >
                {HOURS.filter((h) => h > 0 && h < 24).map((h) => (
                  <span
                    key={h}
                    className="absolute inset-y-0 w-px bg-[var(--line)]/60"
                    style={{ left: `${(h / 24) * 100}%` }}
                    aria-hidden
                  />
                ))}
                {duties.map((b) => {
                  const { left, width } = shiftDayPercent(b);
                  const times = resolveShiftTimes(b);
                  const conflict = dutyHasConflict(
                    b,
                    bookings,
                    leaves,
                    availability,
                    asOf,
                  );
                  return (
                    <button
                      key={b.id}
                      type="button"
                      title={`${b.id} · ${b.patientName} · ${b.address}`}
                      onClick={() => onOpen(b)}
                      className={cn(
                        "absolute top-2 bottom-2 overflow-hidden rounded-[var(--radius-md)] border px-1.5 text-left text-[10px] font-semibold focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
                        shiftBlockClass(b),
                        conflict && "border-[var(--danger)]",
                      )}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      <span className="block truncate">
                        {times.start} {shortPatientName(b.patientName, 12)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
