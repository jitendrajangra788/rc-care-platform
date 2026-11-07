"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  title,
  description,
  onClose,
  children,
  side = "right",
  wide = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  side?: "right" | "left";
  wide?: boolean;
}) {
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--heading)_40%,transparent)] backdrop-blur-[2px]"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          "absolute inset-y-0 flex w-full max-w-full flex-col bg-surface shadow-[var(--shadow-lg)]",
          side === "right" ? "right-0" : "left-0",
          wide ? "sm:max-w-xl" : "sm:max-w-md",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-3 py-2 md:px-3">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-2xl text-heading">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-1 text-sm text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted transition hover:bg-paper-2 hover:text-heading focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-2 sm:px-3 md:px-3">{children}</div>
      </aside>
    </div>
  );
}
