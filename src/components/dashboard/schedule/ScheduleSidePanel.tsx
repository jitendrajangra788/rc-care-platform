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

  return (
    <section className="soft-panel space-y-1.5 p-2 md:p-2.5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-display text-xl text-heading">Day panel</h3>
          <p className="text-sm text-muted">
            {formatDate(selectedDay.includes("T") ? selectedDay : `${selectedDay}T12:00:00`)}
          </p>
        </div>
        <FilterTabs
          tabs={[
            { id: "duties", label: "Duties", count: dayBookings.length },
            { id: "availability", label: "Nurse availability", count: nurseRows.length },
          ]}
          value={tab}
          onChange={(id) => onTabChange(id as SidePanelTab)}
        />
      </div>

      {pending ? (
        <div className="space-y-1.5" aria-busy="true" aria-label="Refreshing">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-lg)] border border-[var(--line)] p-3"
            >
              <Skeleton className="mb-2 h-4 w-32" />
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
      ) : tab === "duties" ? (
        dayBookings.length === 0 ? (
          <EmptyState
            title="No duties today"
            description="Nothing matches filters for this day."
          />
        ) : (
          <div className="space-y-1.5">
            {dayBookings.map((b) => {
              const nurse = staff.find((s) => s.id === b.assignedStaffId);
              return (
                <article
                  key={b.id}
                  className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-surface p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-name text-lg text-heading">{b.patientName}</h4>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {b.id} · {formatShiftLabel(b)}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {formatDate(b.startDate)}
                        {" → "}
                        {b.endDate ? formatDate(b.endDate) : "Ongoing"}
                      </p>
                      <p className="mt-2 text-sm font-medium text-heading">
                        {nurse ? nurse.name : "Needs nurse"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => onOpen(b)}
                    >
                      {b.assignedStaffId ? "Replace / edit" : "Assign"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : nurseRows.length === 0 ? (
        <EmptyState title="No nurses" description="Staff list is empty." />
      ) : (
        <div className="space-y-2">
          {nurseRows.map(({ staff: s, day, hours }) => (
            <div
              key={s.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-[var(--line)] px-3 py-2.5",
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Avatar name={s.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-heading">{s.name}</p>
                  <p className="text-[11px] text-muted">
                    {s.area} · {hours}h today
                    {day.duties.length
                      ? ` · ${day.duties.map((d) => d.patientName).join(", ")}`
                      : day.leave?.reason
                        ? ` · ${day.leave.reason}`
                        : day.note
                          ? ` · ${day.note}`
                          : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={day.status} />
                {day.status === "available" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => onMarkAvailability(s.id, selectedDay, "unavailable")}
                  >
                    Mark off
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
      )}
    </section>
  );
}
