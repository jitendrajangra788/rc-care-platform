"use client";

import {
  AlertTriangle,
  CalendarCheck2,
  UserCheck,
  UserRound,
  UserX,
  Users,
} from "lucide-react";
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
  const items = [
    {
      id: "total",
      label: "Duties",
      value: total,
      icon: CalendarCheck2,
      className: "bg-[var(--primary-soft)] text-primary",
    },
    {
      id: "assigned",
      label: "Assigned",
      value: assigned,
      icon: UserCheck,
      className: "bg-[var(--success-soft)] text-success",
    },
    {
      id: "unassigned",
      label: "Open",
      value: unassigned,
      icon: UserX,
      className: "bg-[var(--warning-soft)] text-warning",
      onClick: onUnassignedClick,
    },
    {
      id: "onduty",
      label: "On duty",
      value: onDutyNurses,
      icon: UserRound,
      className: "bg-[var(--info-soft)] text-[var(--info)]",
      hideOnMobile: true,
    },
    {
      id: "available",
      label: "Free",
      value: availableNurses,
      icon: Users,
      className: "bg-surface text-heading",
      hideOnMobile: true,
    },
    {
      id: "conflicts",
      label: "Clash",
      value: conflicts,
      icon: AlertTriangle,
      className:
        conflicts > 0
          ? "bg-[var(--danger-soft)] text-danger"
          : "bg-surface text-heading",
    },
  ] as const;

  return (
    <section className="space-y-1">
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
        {items.map((item) => {
          const Icon = item.icon;
          const clickable = "onClick" in item && item.onClick;
          const Comp = clickable ? "button" : "div";
          return (
            <Comp
              key={item.id}
              type={clickable ? "button" : undefined}
              onClick={clickable ? item.onClick : undefined}
              className={cn(
                "flex min-w-[5.75rem] flex-1 items-center gap-2 rounded-[0.75rem] border border-[var(--line)] px-2.5 py-2 text-left shadow-[var(--shadow-xs)] sm:min-w-0",
                item.className,
                "hideOnMobile" in item && item.hideOnMobile && "hidden sm:flex",
                clickable && "transition hover:brightness-[0.98]",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                  {item.label}
                </p>
                <p className="font-display text-lg leading-none tabular-nums">{item.value}</p>
              </div>
            </Comp>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5">
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
              "inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] font-semibold",
              label === "8hr" &&
                "bg-[var(--warning-soft)] text-[color-mix(in_srgb,var(--warning)_90%,var(--heading))]",
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
