"use client";

import {
  AlertTriangle,
  CalendarCheck2,
  UserCheck,
  UserRound,
  UserX,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { cn } from "@/lib/utils";
import type { ShiftKind } from "@/lib/schedule";

export function ScheduleKpis({
  total,
  assigned,
  unassigned,
  onDutyNurses,
  availableNurses,
  conflicts,
  byShift,
  onUnassignedClick,
}: {
  total: number;
  assigned: number;
  unassigned: number;
  onDutyNurses: number;
  availableNurses: number;
  conflicts: number;
  byShift: Record<ShiftKind, number>;
  onUnassignedClick: () => void;
}) {
  return (
    <section className="space-y-1.5">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Aaj ki duties"
          value={total}
          tone="primary"
          icon={<CalendarCheck2 className="h-4 w-4" />}
        />
        <StatCard
          label="Assigned"
          value={assigned}
          tone="success"
          icon={<UserCheck className="h-4 w-4" />}
        />
        <button
          type="button"
          onClick={onUnassignedClick}
          className="rounded-[var(--radius-lg)] text-left focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
        >
          <StatCard
            label="Unassigned"
            value={unassigned}
            tone="warning"
            icon={<UserX className="h-4 w-4" />}
            hint="Click to filter"
            className={cn(unassigned > 0 && "cursor-pointer hover:border-warning/40")}
          />
        </button>
        <StatCard
          label="On duty nurses"
          value={onDutyNurses}
          tone="info"
          icon={<UserRound className="h-4 w-4" />}
        />
        <StatCard
          label="Available nurses"
          value={availableNurses}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Conflicts"
          value={conflicts}
          tone={conflicts > 0 ? "danger" : "default"}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["8hr", byShift["8hr"]],
            ["12hr", byShift["12hr"]],
            ["24hr", byShift["24hr"]],
          ] as const
        ).map(([label, count]) => (
          <span
            key={label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-2.5 py-1 text-xs font-semibold",
              label === "8hr" && "bg-[var(--warning-soft)] text-[color-mix(in_srgb,var(--warning)_90%,var(--heading))]",
              label === "12hr" && "bg-[var(--info-soft)] text-[var(--info)]",
              label === "24hr" && "bg-[var(--primary-soft)] text-primary",
            )}
          >
            {label.replace("hr", "h")}
            <span className="tabular-nums text-heading">{count}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
