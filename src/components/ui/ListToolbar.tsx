"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterChip = {
  id: string;
  label: string;
};

export function ListToolbar({
  query,
  onQueryChange,
  placeholder = "Search…",
  filters,
  activeFilter,
  onFilterChange,
  actions,
  className,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  filters?: FilterChip[];
  activeFilter?: string;
  onFilterChange?: (id: string) => void;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "soft-panel flex flex-col gap-1.5 p-2 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          className="field field-with-icon"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {filters?.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilterChange?.(f.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
              activeFilter === f.id
                ? "bg-primary text-[var(--sidebar-fg)]"
                : "bg-paper-2 text-heading hover:bg-secondary",
            )}
          >
            {f.label}
          </button>
        ))}
        {actions}
      </div>
    </div>
  );
}
