"use client";

import { format } from "date-fns";
import type { Booking, LeaveRequest, NurseAvailability, Staff } from "@/lib/types";
import { bookingTouchesDay } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { DutyBlock } from "./DutyBlock";
import { EmptyState } from "@/components/ui/EmptyState";

export function WeekColumnsView({
  weekDays,
  selectedDay,
  filteredBookings,
  bookings,
  leaves,
  availability,
  staff,
  asOf,
  onSelectDay,
  onOpen,
}: {
  weekDays: Date[];
  selectedDay: string;
  filteredBookings: Booking[];
  bookings: Booking[];
  leaves: LeaveRequest[];
  availability: NurseAvailability[];
  staff: Staff[];
  asOf: string;
  onSelectDay: (iso: string) => void;
  onOpen: (b: Booking) => void;
}) {
  return (
    <div className="grid gap-1.5 md:grid-cols-7">
      {weekDays.map((d) => {
        const iso = format(d, "yyyy-MM-dd");
        const list = filteredBookings.filter((b) => bookingTouchesDay(b, iso, asOf));
        const selected = iso === selectedDay;
        return (
          <div
            key={iso}
            className={cn(
              "min-h-[4.25rem] rounded-[0.85rem] border border-[var(--line)] bg-surface p-1.5",
              selected && "ring-2 ring-primary/35",
            )}
          >
            <button
              type="button"
              className="mb-2 flex w-full items-center justify-between text-left focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              onClick={() => onSelectDay(iso)}
            >
              <span className="text-sm font-semibold text-heading">{format(d, "EEE d")}</span>
              <span className="text-[11px] text-muted">{list.length}</span>
            </button>
            <div className="space-y-1.5">
              {list.slice(0, 5).map((b) => (
                <DutyBlock
                  key={b.id}
                  booking={b}
                  bookings={bookings}
                  leaves={leaves}
                  availability={availability}
                  asOf={asOf}
                  compact
                  draggable={false}
                  onClick={() => {
                    onSelectDay(iso);
                    onOpen(b);
                  }}
                />
              ))}
              {list.length === 0 ? (
                <p className="px-1 text-[11px] text-muted">No duties</p>
              ) : null}
              {list.length > 5 ? (
                <p className="text-[10px] text-muted">+{list.length - 5} more</p>
              ) : null}
            </div>
          </div>
        );
      })}
      {weekDays.length === 0 ? (
        <EmptyState title="No days" className="md:col-span-7" />
      ) : null}
      <span className="sr-only">{staff.length} nurses on board</span>
    </div>
  );
}
