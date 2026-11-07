"use client";

import { format, isSameDay, isSameMonth } from "date-fns";
import { dailyWorkload } from "@/lib/schedule";
import type { Booking } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MonthHeatmap({
  days,
  anchor,
  selectedDay,
  filteredBookings,
  asOf,
  onSelectDay,
}: {
  days: Date[];
  anchor: Date;
  selectedDay: string;
  filteredBookings: Booking[];
  asOf: string;
  onSelectDay: (iso: string, date: Date) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
        <div key={d} className="px-2 py-1 text-center text-[11px] font-semibold text-muted">
          {d}
        </div>
      ))}
      {days.map((d) => {
        const iso = format(d, "yyyy-MM-dd");
        const wl = dailyWorkload(filteredBookings, iso, asOf);
        const inMonth = isSameMonth(d, anchor);
        const selected = iso === selectedDay;
        const intensity = Math.min(wl.total, 6) / 6;
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onSelectDay(iso, d)}
            className={cn(
              "min-h-[4rem] rounded-[var(--radius-lg)] border p-2 text-left transition focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
              inMonth ? "border-[var(--line)]" : "border-transparent text-muted",
              selected && "ring-2 ring-primary/40",
              isSameDay(d, new Date()) && "border-primary/40",
            )}
            style={{
              backgroundColor: inMonth
                ? `color-mix(in srgb, var(--primary-soft) ${Math.round(intensity * 100)}%, var(--surface))`
                : "color-mix(in srgb, var(--surface-muted) 50%, transparent)",
            }}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>{format(d, "d")}</span>
              {wl.unassigned ? (
                <span className="rounded-full bg-[var(--warning-soft)] px-1.5 text-[10px] text-[color-mix(in_srgb,var(--warning)_90%,var(--heading))]">
                  {wl.unassigned} open
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-[11px] text-muted">
              {wl.total} dut{wl.total === 1 ? "y" : "ies"}
            </p>
            <p className="text-[11px] text-muted">
              {wl.assigned} assigned · {wl.unassigned} unassigned
            </p>
          </button>
        );
      })}
    </div>
  );
}
