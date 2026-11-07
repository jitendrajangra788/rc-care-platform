"use client";

import type { Booking, LeaveRequest, NurseAvailability } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { DutyBlock } from "./DutyBlock";

export function UnassignedTray({
  bookings,
  allBookings,
  leaves,
  availability,
  asOf,
  onOpen,
}: {
  bookings: Booking[];
  allBookings: Booking[];
  leaves: LeaveRequest[];
  availability: NurseAvailability[];
  asOf: string;
  onOpen: (b: Booking) => void;
}) {
  const list = bookings.filter(
    (b) => !b.assignedStaffId && b.status !== "completed" && b.status !== "cancelled",
  );

  return (
    <div className="rounded-[var(--radius-xl)] border border-warning/30 bg-[var(--warning-soft)]/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-heading">
          Unassigned tray
          <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-[11px] tabular-nums text-muted">
            {list.length}
          </span>
        </p>
        <p className="text-[11px] text-muted">Drag onto a nurse × day cell</p>
      </div>
      {list.length === 0 ? (
        <EmptyState
          title="No open duties"
          description="Unassigned bookings that match filters appear here."
          className="bg-transparent py-3"
        />
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((b) => (
            <div key={b.id} className="w-36 shrink-0">
              <DutyBlock
                booking={b}
                bookings={allBookings}
                leaves={leaves}
                availability={availability}
                asOf={asOf}
                onClick={() => onOpen(b)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
