"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  FileText,
  LoaderCircle,
  Search,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  filterSearchHits,
  splitHighlight,
  type SearchHit,
} from "@/lib/search";
import { cn } from "@/lib/utils";

const typeMeta: Record<SearchHit["type"], { label: string; icon: LucideIcon }> = {
  patient: { label: "Patient", icon: UserRound },
  booking: { label: "Booking", icon: CalendarDays },
  staff: { label: "Staff", icon: Users },
  lead: { label: "Lead", icon: FileText },
  invoice: { label: "Invoice", icon: FileText },
};

function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {splitHighlight(text, query).map((part, i) =>
        part.hit ? (
          <mark
            key={`${i}-${part.text}`}
            className="rounded-sm bg-[var(--warning-soft)] px-0.5 font-semibold text-inherit"
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

/** Hospital-style autocomplete: 1 letter → instant suggestions. */
export function RecordSearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Staff, patient, booking no…",
  className,
  size = "md",
  autoFocus = false,
  autocomplete = true,
}: {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
  autoFocus?: boolean;
  /** Live dropdown as you type (EHR-style). */
  autocomplete?: boolean;
}) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inner, setInner] = useState("");
  const [catalog, setCatalog] = useState<SearchHit[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const controlled = value !== undefined;
  const q = controlled ? value : inner;

  const loadCatalog = useCallback(async () => {
    if (catalogReady || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/search?mode=index", { cache: "no-store" });
      if (!res.ok) throw new Error("fail");
      const data = (await res.json()) as { results?: SearchHit[] };
      setCatalog(data.results || []);
      setCatalogReady(true);
    } catch {
      setCatalog([]);
    } finally {
      setLoading(false);
    }
  }, [catalogReady, loading]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const hits = useMemo(
    () => (autocomplete ? filterSearchHits(catalog, q, 12) : []),
    [autocomplete, catalog, q],
  );

  useEffect(() => {
    setActive(0);
  }, [q]);

  function setQ(next: string) {
    if (!controlled) setInner(next);
    onChange?.(next);
    if (autocomplete) setOpen(true);
  }

  function go(hit: SearchHit) {
    setOpen(false);
    setQ(hit.title);
    onSearch?.(hit.title);
    router.push(hit.href);
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    if (hits[active]) {
      go(hits[active]);
      return;
    }
    if (hits[0]) {
      go(hits[0]);
      return;
    }
    onSearch?.(trimmed);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || hits.length === 0) {
      if (e.key === "ArrowDown" && q.trim()) setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + hits.length) % hits.length);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      go(hits[active]);
    }
  }

  const showMenu = autocomplete && open && q.trim().length >= 1;

  return (
    <div ref={rootRef} className={cn("relative min-w-0 flex-1", className)}>
      <form
        onSubmit={submit}
        className={cn(
          "flex min-w-0 items-stretch overflow-hidden rounded-lg border border-[var(--line)] bg-surface shadow-sm",
          "focus-within:border-primary/45 focus-within:ring-2 focus-within:ring-[var(--primary-soft)]",
        )}
        role="search"
      >
        <label className="flex min-w-0 flex-1 items-center gap-2 px-3">
          {loading && !catalogReady ? (
            <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-muted" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          )}
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => {
              void loadCatalog();
              if (q.trim()) setOpen(true);
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label={placeholder}
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={showMenu}
            autoComplete="off"
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
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
            size === "sm" ? "h-9" : "h-10",
          )}
        >
          Search
        </button>
      </form>

      {showMenu ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-surface shadow-[var(--shadow-lg)]"
        >
          <div className="border-b border-[var(--line)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
            {hits.length
              ? `${hits.length} match${hits.length === 1 ? "" : "es"} · live`
              : "No matches"}
          </div>
          <ul className="max-h-[min(60vh,22rem)] overflow-y-auto py-1">
            {hits.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted">
                No staff / patient / booking for “{q.trim()}”
              </li>
            ) : (
              hits.map((hit, i) => {
                const meta = typeMeta[hit.type];
                const Icon = meta.icon;
                const selected = i === active;
                return (
                  <li key={`${hit.type}-${hit.id}`} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition",
                        selected
                          ? "bg-[var(--primary-soft)] text-primary"
                          : "text-heading hover:bg-paper-2",
                      )}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(hit)}
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">
                          <Highlighted text={hit.title} query={q} />
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          <Highlighted text={hit.subtitle} query={q} />
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-paper-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                        {meta.label}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <div className="border-t border-[var(--line)] px-3 py-1.5 text-[10px] text-muted">
            ↑↓ navigate · Enter open · Esc close
          </div>
        </div>
      ) : null}
    </div>
  );
}
