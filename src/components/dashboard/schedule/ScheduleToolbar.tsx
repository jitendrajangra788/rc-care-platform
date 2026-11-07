"use client";

import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import type { Staff } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import type { ScheduleMode, StatusFilter } from "./types";

const MODES: ScheduleMode[] = ["day", "week", "month", "roster"];

export function ScheduleToolbar({
  mode,
  onModeChange,
  anchorLabel,
  selectedDay,
  onPrev,
  onNext,
  query,
  onQueryChange,
  nurseFilter,
  onNurseFilterChange,
  statusFilter,
  onStatusFilterChange,
  unassignedOnly,
  onUnassignedOnlyChange,
  staff,
  onOpenMobileFilters,
}: {
  mode: ScheduleMode;
  onModeChange: (m: ScheduleMode) => void;
  anchorLabel: string;
  selectedDay: string;
  onPrev: () => void;
  onNext: () => void;
  query: string;
  onQueryChange: (v: string) => void;
  nurseFilter: string;
  onNurseFilterChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (v: StatusFilter) => void;
  unassignedOnly: boolean;
  onUnassignedOnlyChange: (v: boolean) => void;
  staff: Staff[];
  onOpenMobileFilters?: () => void;
}) {
  const chips: { id: string; label: string; onClear: () => void }[] = [];
  if (query.trim()) {
    chips.push({ id: "q", label: `Search: ${query.trim()}`, onClear: () => onQueryChange("") });
  }
  if (nurseFilter) {
    const name = staff.find((s) => s.id === nurseFilter)?.name || nurseFilter;
    chips.push({
      id: "nurse",
      label: `Nurse: ${name}`,
      onClear: () => onNurseFilterChange(""),
    });
  }
  if (statusFilter) {
    chips.push({
      id: "status",
      label: `Status: ${statusFilter}`,
      onClear: () => onStatusFilterChange(""),
    });
  }
  if (unassignedOnly && statusFilter !== "unassigned") {
    chips.push({
      id: "unassigned",
      label: "Unassigned only",
      onClear: () => onUnassignedOnlyChange(false),
    });
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onPrev}
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="font-display text-xl text-heading">{anchorLabel}</p>
            <p className="text-xs text-muted">
              Selected · {formatDate(parseISO(selectedDay + "T12:00:00"))}
            </p>
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={onNext} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label="Calendar view"
            className="hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-paper-2 p-1 md:flex"
          >
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => onModeChange(m)}
                className={cn(
                  "rounded-[var(--radius-lg)] px-3 py-1.5 text-sm font-semibold capitalize focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
                  mode === m ? "bg-surface text-heading shadow-sm" : "text-muted hover:text-heading",
                )}
              >
                {m}
              </button>
            ))}
          </div>
          {onOpenMobileFilters ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="md:hidden"
              onClick={onOpenMobileFilters}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            </Button>
          ) : null}
        </div>
      </div>

      <div className="hidden grid-cols-1 gap-2 md:grid md:grid-cols-12">
        <div className="md:col-span-4">
          <SearchInput
            value={query}
            onChange={onQueryChange}
            placeholder="Patient, booking, nurse…"
            aria-label="Search schedule"
          />
        </div>
        <label className="md:col-span-3">
          <span className="sr-only">Nurse</span>
          <select
            className="field w-full text-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
            value={nurseFilter}
            onChange={(e) => onNurseFilterChange(e.target.value)}
          >
            <option value="">All nurses</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="md:col-span-3">
          <span className="sr-only">Status</span>
          <select
            className="field w-full text-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
          >
            <option value="">All statuses</option>
            <option value="unassigned">Unassigned</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="flex items-center gap-2 md:col-span-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[var(--line)] text-primary focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
            checked={unassignedOnly}
            onChange={(e) => onUnassignedOnlyChange(e.target.checked)}
          />
          <span className="text-sm font-medium text-heading">Unassigned only</span>
        </label>
      </div>

      {/* Mobile view mode pills */}
      <div
        role="tablist"
        aria-label="Calendar view"
        className="flex gap-1 overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--line)] bg-paper-2 p-1 md:hidden"
      >
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => onModeChange(m)}
            className={cn(
              "shrink-0 rounded-[var(--radius-lg)] px-3 py-1.5 text-sm font-semibold capitalize focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
              mode === m ? "bg-surface text-heading shadow-sm" : "text-muted",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={chip.onClear}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-surface px-2.5 py-1 text-xs font-semibold text-heading focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
            >
              {chip.label}
              <X className="h-3 w-3 text-muted" aria-hidden />
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
        </div>
      ) : null}

      <p className="sr-only">
        Anchor {anchorLabel}, weekday {format(parseISO(selectedDay + "T12:00:00"), "EEEE")}
      </p>
    </div>
  );
}

export function ScheduleFiltersForm({
  query,
  onQueryChange,
  nurseFilter,
  onNurseFilterChange,
  statusFilter,
  onStatusFilterChange,
  unassignedOnly,
  onUnassignedOnlyChange,
  staff,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  nurseFilter: string;
  onNurseFilterChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (v: StatusFilter) => void;
  unassignedOnly: boolean;
  onUnassignedOnlyChange: (v: boolean) => void;
  staff: Staff[];
}) {
  return (
    <div className="space-y-1.5">
      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder="Patient, booking, nurse…"
        aria-label="Search schedule"
      />
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Nurse</span>
        <select
          className="field w-full"
          value={nurseFilter}
          onChange={(e) => onNurseFilterChange(e.target.value)}
        >
          <option value="">All nurses</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Status</span>
        <select
          className="field w-full"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
        >
          <option value="">All statuses</option>
          <option value="unassigned">Unassigned</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-[var(--line)] text-primary"
          checked={unassignedOnly}
          onChange={(e) => onUnassignedOnlyChange(e.target.checked)}
        />
        Unassigned only
      </label>
    </div>
  );
}
