"use client";

import { FormEvent } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterChip = {
  id: string;
  label: string;
};

export function ListToolbar({
  query,
  onQueryChange,
  placeholder = "Staff, patient, booking no…",
  filters,
  activeFilter,
  onFilterChange,
  actions,
  className,
  onSearch,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  filters?: FilterChip[];
  activeFilter?: string;
  onFilterChange?: (id: string) => void;
  actions?: React.ReactNode;
  className?: string;
  /** Optional explicit search submit (Enter / Search button). Live filter still uses onQueryChange. */
  onSearch?: (value: string) => void;
}) {
  function submit(e: FormEvent) {
    e.preventDefault();
    onSearch?.(query.trim());
  }

  return (
    <div
      className={cn(
        "soft-panel flex flex-col gap-1.5 p-2 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <form
        onSubmit={submit}
        className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-lg border border-[var(--line)] bg-surface"
        role="search"
      >
        <label className="flex min-w-0 flex-1 items-center gap-2 px-3">
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <input
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-heading outline-none placeholder:text-muted"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
          />
        </label>
        <button
          type="submit"
          className="h-10 shrink-0 bg-primary px-4 text-sm font-semibold text-[var(--sidebar-fg)] transition hover:opacity-95"
        >
          Search
        </button>
      </form>
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
