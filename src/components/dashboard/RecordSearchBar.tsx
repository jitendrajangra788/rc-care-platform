"use client";

import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Classic website search bar: icon + input + teal Search button. */
export function RecordSearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Staff, patient, booking no…",
  className,
  size = "md",
  autoFocus = false,
}: {
  value?: string;
  onChange?: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
  autoFocus?: boolean;
}) {
  const [inner, setInner] = useState("");
  const controlled = value !== undefined;
  const q = controlled ? value : inner;

  function setQ(next: string) {
    if (!controlled) setInner(next);
    onChange?.(next);
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    onSearch(q.trim());
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "flex min-w-0 flex-1 items-stretch overflow-hidden rounded-lg border border-[var(--line)] bg-surface shadow-sm",
        "focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-[var(--primary-soft)]",
        className,
      )}
      role="search"
    >
      <label className="flex min-w-0 flex-1 items-center gap-2 px-3">
        <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          autoFocus={autoFocus}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-sm text-heading outline-none placeholder:text-muted",
            size === "sm" ? "h-9" : "h-10",
          )}
        />
      </label>
      <button
        type="submit"
        className={cn(
          "shrink-0 bg-primary px-4 text-sm font-semibold text-[var(--sidebar-fg)] transition hover:opacity-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1",
          size === "sm" ? "h-9" : "h-10",
        )}
      >
        Search
      </button>
    </form>
  );
}
