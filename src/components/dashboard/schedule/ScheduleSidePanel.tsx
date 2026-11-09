"use client";

import type { Booking, LeaveRequest, NurseAvailability, Staff } from "@/lib/types";
import { formatDate } from "@/lib/format";
import {
  formatShiftLabel,
  nurseStatusOnDay,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { hoursOnDay } from "./utils";
import type { SidePanelTab } from "./types";

export function ScheduleSidePanel({
  tab,
  onTabChange,
  selectedDay,
  dayBookings,
  staff,
  bookings,
  leaves,
  availability,
  asOf,
  pending,
  nurseFilter,
  onOpen,
  onMarkAvailability,
  compact = false,
  mobileAvailabilityOnly = false,
}: {
  tab: SidePanelTab;
  onTabChange: (t: SidePanelTab) => void;
  selectedDay: string;
  dayBookings: Booking[];
  staff: Staff[];
  bookings: Booking[];
  leaves: LeaveRequest[];
  availability: NurseAvailability[];
  asOf: string;
  pending: boolean;
  nurseFilter: string;
  onOpen: (b: Booking) => void;
  onMarkAvailability: (
    staffId: string,
    date: string,
    status: NurseAvailability["status"],
  ) => void;
  compact?: boolean;
  mobileAvailabilityOnly?: boolean;
}) {
  const nurseRows = staff
    .filter((s) => !nurseFilter || s.id === nurseFilter)
    .map((s) => ({
      staff: s,
      day: nurseStatusOnDay({
        staff: s,
        day: selectedDay,
        bookings,
        leaves,
        availability,
        asOf,
      }),
      hours: hoursOnDay(s.id, selectedDay, bookings, asOf),
    }));

  const showDuties = !mobileAvailabilityOnly && tab === "duties";
  const showAvailability = mobileAvailabilityOnly || tab === "availability";

  return (
    <section
      className={cn(
        "soft-panel space-y-1.5",
        compact ? "p-1.5 sm:p-2" : "p-2 md:p-2.5",
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className={cn("font-display text-heading", compact ? "text-base" : "text-lg")}>
            {mobileAvailabilityOnly ? "Nurse availability" : "Day panel"}
          </h3>
          <p className="text-xs text-muted">
            {formatDate(selectedDay.includes("T") ? selectedDay : `${selectedDay}T12:00:00`)}
          </p>
        </div>
        {!mobileAvailabilityOnly ? (
          <FilterTabs
            tabs={[
              { id: "duties", label: "Duties", count: dayBookings.length },
              { id: "availability", label: "Nurses", count: nurseRows.length },
            ]}
            value={tab}
            onChange={(id) => onTabChange(id as SidePanelTab)}
          />
        ) : null}
      </div>

      {pending ? (
        <div className="space-y-1.5" aria-busy="true" aria-label="Refreshing">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[var(--radius-lg)] border border-[var(--line)] p-2.5">
              <Skeleton className="mb-2 h-4 w-28" />
              <SkeletonText lines={1} />
            </div>
          ))}
        </div>
      ) : showDuties ? (
        dayBookings.length === 0 ? (
          <EmptyState title="No duties" description="Nothing matches for this day." />
        ) : (
          <div className="space-y-1.5">
            {dayBookings.map((b) => {
              const nurse = staff.find((s) => s.id === b.assignedStaffId);
              return (
                <article
                  key={b.id}
                  className="rounded-[0.85rem] border border-[var(--line)] bg-surface p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="truncate text-sm font-semibold text-heading">
                          {b.patientName}
                        </h4>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {formatShiftLabel(b)} · {nurse ? nurse.name : "Needs nurse"}
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="secondary" onClick={() => onOpen(b)}>
                      {b.assignedStaffId ? "Edit" : "Assign"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : showAvailability ? (
        nurseRows.length === 0 ? (
          <EmptyState title="No nurses" description="Staff list is empty." />
        ) : (
          <div className="max-h-[28rem] space-y-1.5 overflow-y-auto pr-0.5">
            {nurseRows.map(({ staff: s, day, hours }) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2 rounded-[0.75rem] border border-[var(--line)] px-2.5 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar name={s.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-heading">{s.name}</p>
                    <p className="truncate text-[10px] text-muted">
                      {hours}h
                      {day.duties.length
                        ? ` · ${day.duties.map((d) => d.patientName).join(", ")}`
                        : day.leave?.reason
                          ? ` · ${day.leave.reason}`
                          : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <StatusBadge status={day.status} />
                  {day.status === "available" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => onMarkAvailability(s.id, selectedDay, "unavailable")}
                    >
                      Off
                    </Button>
                  ) : day.status === "unavailable" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onMarkAvailability(s.id, selectedDay, "available")}
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}
    </section>
  );
}
