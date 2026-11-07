"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  CalendarDays,
  FileText,
  LoaderCircle,
  Search,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { NavItem } from "@/lib/nav";
import {
  filterSearchHits,
  splitHighlight,
  type SearchHit,
} from "@/lib/search";

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

function Highlighted({ text, query }: { text: string; query: string }) {
  const parts = splitHighlight(text, query);
  return (
    <>
      {parts.map((part, i) =>
        part.hit ? (
          <mark
            key={`${i}-${part.text}`}
            className="rounded-sm bg-[var(--warning-soft)] px-0.5 text-inherit"
          >
            {part.text}
          </mark>
        ) : (
          <span key={`${i}-${part.text}`}>{part.text}</span>
        ),
      )}
    </>
  );
}

export function CommandPalette({
  open,
  onOpenChange,
  initialQuery = "",
}: {
  /** Kept for call-site compatibility; pages are no longer searched. */
  links?: NavItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [catalog, setCatalog] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

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
      setLoadError("");
      return;
    }
    setQuery(initialQuery);
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    void (async () => {
      try {
        const res = await fetch("/api/search?mode=index", { cache: "no-store" });
        if (!res.ok) throw new Error("Search unavailable");
        const data = (await res.json()) as { results?: SearchHit[] };
        if (!cancelled) setCatalog(data.results || []);
      } catch {
        if (!cancelled) {
          setCatalog([]);
          setLoadError("Could not load records. Try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, initialQuery]);

  const hits = useMemo(
    () => filterSearchHits(catalog, query, 40),
    [catalog, query],
  );

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
    onOpenChange(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--heading)_45%,transparent)]"
        aria-label="Close search"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative mx-auto mt-[8vh] w-[min(94vw,640px)] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-surface shadow-[var(--shadow-lg)]">
        <Command shouldFilter={false} label="Record search" className="bg-surface">
          <div className="flex items-center gap-2 border-b border-[var(--line)] px-3">
            {loading ? (
              <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-muted" />
            ) : (
              <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            )}
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Type name, phone, booking no…"
              className="h-12 w-full bg-transparent text-sm text-heading outline-none placeholder:text-muted"
              aria-label="Search records"
              autoFocus
            />
            {query ? (
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-paper-2 hover:text-heading"
                aria-label="Clear search"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="hidden rounded border border-[var(--line)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-semibold text-muted sm:inline">
                Esc
              </kbd>
            )}
          </div>

          <div className="border-b border-[var(--line)] px-3 py-1.5 text-[11px] text-muted">
            {loading
              ? "Loading records…"
              : loadError
                ? loadError
                : query.trim()
                  ? `${hits.length} result${hits.length === 1 ? "" : "s"}`
                  : `${catalog.length} records ready · staff · patients · bookings`}
          </div>

          <Command.List className="max-h-[min(68vh,28rem)] overflow-y-auto p-2 scrollbar-thin">
            <Command.Empty className="px-3 py-8 text-center text-sm text-muted">
              {loading
                ? "Loading…"
                : loadError
                  ? loadError
                  : query.trim()
                    ? `No records match “${query.trim()}”`
                    : "Start typing a staff name, patient name, phone, or BK-…"}
            </Command.Empty>

            {groupedHits.map((group) => {
              const meta = typeMeta[group.type];
              const Icon = meta.icon;
              return (
                <Command.Group
                  key={group.type}
                  heading={`${meta.label} · ${group.items.length}`}
                  className="px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted"
                >
                  {group.items.map((hit) => (
                    <Command.Item
                      key={`${hit.type}-${hit.id}`}
                      value={`${hit.type} ${hit.id} ${hit.title} ${hit.subtitle} ${hit.keywords}`}
                      onSelect={() => go(hit.href)}
                      className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-heading aria-selected:bg-[var(--primary-soft)] aria-selected:text-primary"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">
                          <Highlighted text={hit.title} query={query} />
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          <Highlighted text={hit.subtitle} query={query} />
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
