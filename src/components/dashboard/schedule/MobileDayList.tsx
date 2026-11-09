"use client";

import { parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Booking, Staff } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { formatShiftLabel } from "@/lib/schedule";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function MobileDayList({
  selectedDay,
  dayBookings,
  staff,
  onOpen,
  onPrev,
  onNext,
  onToday,
}: {
  selectedDay: string;
  dayBookings: Booking[];
  staff: Staff[];
  onOpen: (b: Booking) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
}) {
  return (
    <div className="space-y-1.5 md:hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {onPrev ? (
            <Button type="button" size="sm" variant="secondary" onClick={onPrev} aria-label="Previous day">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : null}
          {onNext ? (
            <Button type="button" size="sm" variant="secondary" onClick={onNext} aria-label="Next day">
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <p className="min-w-0 flex-1 text-center text-sm font-semibold text-heading">
          {formatDate(parseISO(selectedDay + "T12:00:00"))}
        </p>
        {onToday ? (
          <Button type="button" size="sm" variant="ghost" onClick={onToday}>
            Today
          </Button>
        ) : (
          <span className="w-14" />
        )}
      </div>

      {dayBookings.length === 0 ? (
        <EmptyState title="No duties" description="Nothing on this day with current filters." />
      ) : (
        <div className="space-y-1.5">
          {dayBookings.map((b) => {
            const nurse = staff.find((s) => s.id === b.assignedStaffId);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onOpen(b)}
                className="flex w-full items-start justify-between gap-2 rounded-[0.9rem] border border-[var(--line)] bg-surface px-3 py-2.5 text-left active:bg-[var(--surface-muted)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-heading">{b.patientName}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{formatShiftLabel(b)}</p>
                  <p className="text-[11px] text-muted">
                    {nurse ? nurse.name : "Unassigned"}
                    {b.area ? ` · ${b.area}` : ""}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
