"use client";

import { parseISO } from "date-fns";
import type { Booking, Staff } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { formatShiftLabel } from "@/lib/schedule";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function MobileDayList({
  selectedDay,
  dayBookings,
  staff,
  onOpen,
}: {
  selectedDay: string;
  dayBookings: Booking[];
  staff: Staff[];
  onOpen: (b: Booking) => void;
}) {
  return (
    <div className="space-y-2 md:hidden">
      <p className="text-sm font-semibold text-heading">
        {formatDate(parseISO(selectedDay + "T12:00:00"))}
      </p>
      {dayBookings.length === 0 ? (
        <EmptyState title="No duties" description="Nothing on this day with current filters." />
      ) : (
        dayBookings.map((b) => {
          const nurse = staff.find((s) => s.id === b.assignedStaffId);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onOpen(b)}
              className="flex w-full flex-col gap-1 rounded-[var(--radius-xl)] border border-[var(--line)] bg-surface p-3 text-left focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-heading">{b.patientName}</span>
                <StatusBadge status={b.status} />
              </div>
              <span className="text-xs text-muted">{formatShiftLabel(b)}</span>
              <span className="text-xs text-muted">
                {nurse ? nurse.name : "Unassigned"} · {formatDate(b.startDate)}
                {b.endDate ? ` → ${formatDate(b.endDate)}` : " → Ongoing"}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
