"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  CalendarDays,
  FileText,
  Search,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { NavItem } from "@/lib/nav";
import type { SearchHit } from "@/lib/search";

const typeMeta: Record<
  SearchHit["type"],
  { label: string; icon: LucideIcon }
> = {
  patient: { label: "Patients", icon: UserRound },
  booking: { label: "Bookings", icon: CalendarDays },
  staff: { label: "Staff", icon: Users },
  lead: { label: "Leads", icon: FileText },
  invoice: { label: "Billing", icon: FileText },
};

export function CommandPalette({
  open,
  onOpenChange,
}: {
  /** Kept for call-site compatibility; pages are no longer searched. */
  links?: NavItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 1) {
      setHits([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setHits([]);
          return;
        }
        const data = (await res.json()) as { results?: SearchHit[] };
        if (!cancelled) setHits(data.results || []);
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query, open]);

  const groupedHits = useMemo(() => {
    const order: SearchHit["type"][] = [
      "booking",
      "patient",
      "staff",
      "lead",
      "invoice",
    ];
    return order
      .map((type) => ({
        type,
        items: hits.filter((h) => h.type === type),
      }))
      .filter((g) => g.items.length > 0);
  }, [hits]);

  function go(href: string) {
    setQuery("");
    setHits([]);
    onOpenChange(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--heading)_45%,transparent)]"
        aria-label="Close command palette"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative mx-auto mt-[10vh] w-[min(94vw,600px)] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-surface shadow-[var(--shadow-lg)]">
        <Command shouldFilter={false} label="Global search" className="bg-surface">
          <div className="flex items-center gap-2 border-b border-[var(--line)] px-3">
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search staff, patients, bookings…"
              className="h-12 w-full bg-transparent text-sm text-heading outline-none placeholder:text-muted"
              aria-label="Record search"
              autoFocus
            />
            <kbd className="hidden rounded border border-[var(--line)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-semibold text-muted sm:inline">
              Esc
            </kbd>
          </div>
          <Command.List className="max-h-[min(70vh,28rem)] overflow-y-auto p-2 scrollbar-thin">
            <Command.Empty className="px-3 py-8 text-center text-sm text-muted">
              {loading
                ? "Searching…"
                : query.trim()
                  ? "No matching staff, patients, or bookings"
                  : "Type a staff name, patient name, phone, or booking no."}
            </Command.Empty>

            {groupedHits.map((group) => {
              const meta = typeMeta[group.type];
              const Icon = meta.icon;
              return (
                <Command.Group
                  key={group.type}
                  heading={meta.label}
                  className="px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted"
                >
                  {group.items.map((hit) => (
                    <Command.Item
                      key={`${hit.type}-${hit.id}`}
                      value={`${hit.type} ${hit.keywords} ${hit.title} ${hit.subtitle}`}
                      onSelect={() => go(hit.href)}
                      className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-heading aria-selected:bg-[var(--primary-soft)] aria-selected:text-primary"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{hit.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {hit.subtitle}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-paper-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                        {hit.type}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}

          </Command.List>
        </Command>
      </div>
    </div>
  );
}
