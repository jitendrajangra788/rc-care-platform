"use client";

import { cn } from "@/lib/utils";

export type FilterTab = {
  id: string;
  label: string;
  count?: number;
};

export function FilterTabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: FilterTab[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filters"
      className={cn(
        "flex flex-wrap gap-1 rounded-[var(--radius-md)] border border-[var(--line)] bg-surface p-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1",
              active
                ? "bg-primary text-[var(--sidebar-fg)] shadow-sm"
                : "text-muted hover:bg-[var(--surface-muted)] hover:text-heading",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-bold",
                  active
                    ? "bg-[color-mix(in_srgb,var(--sidebar-fg)_20%,transparent)]"
                    : "bg-[var(--surface-muted)] text-muted",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
