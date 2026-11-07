"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import type { NavItem } from "@/lib/nav";

export function CommandPalette({
  links,
  open,
  onOpenChange,
}: {
  links: NavItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

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

  function close() {
    setQuery("");
    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--heading)_45%,transparent)]"
        aria-label="Close command palette"
        onClick={close}
      />
      <div className="relative mx-auto mt-[12vh] w-[min(92vw,560px)] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-surface shadow-[var(--shadow-lg)]">
        <Command label="Command palette" className="bg-surface">
          <div className="flex items-center gap-2 border-b border-[var(--line)] px-3">
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Jump to page…"
              className="h-12 w-full bg-transparent text-sm text-heading outline-none placeholder:text-muted"
              aria-label="Command search"
            />
            <kbd className="hidden rounded border border-[var(--line)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-semibold text-muted sm:inline">
              Esc
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
            <Command.Empty className="px-3 py-3 text-center text-sm text-muted">
              No matching pages
            </Command.Empty>
            <Command.Group
              heading="Pages"
              className="px-1 py-1 text-xs font-semibold uppercase tracking-wide text-muted"
            >
              {links.map((link) => (
                <Command.Item
                  key={link.href}
                  value={`${link.label} ${link.href}`}
                  onSelect={() => {
                    setQuery("");
                    onOpenChange(false);
                    router.push(link.href);
                  }}
                  className="flex cursor-pointer items-center justify-between rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-heading aria-selected:bg-[var(--primary-soft)] aria-selected:text-primary"
                >
                  <span className="font-medium">{link.label}</span>
                  <span className="text-xs text-muted">
                    {link.href.replace("/dashboard", "")}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
