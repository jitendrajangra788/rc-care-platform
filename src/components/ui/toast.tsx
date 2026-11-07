"use client";

import { useSyncExternalStore } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastKind = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  detail?: string;
};

type Listener = () => void;

let items: ToastItem[] = [];
const listeners = new Set<Listener>();
const EMPTY: ToastItem[] = [];

function emit() {
  listeners.forEach((l) => l());
}

function push(kind: ToastKind, title: string, detail?: string) {
  const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  items = [{ id, kind, title, detail }, ...items].slice(0, 4);
  emit();
  window.setTimeout(() => dismiss(id), kind === "error" ? 5200 : 3400);
  return id;
}

function dismiss(id: string) {
  items = items.filter((t) => t.id !== id);
  emit();
}

function subscribe(onStoreChange: Listener) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot() {
  return items;
}

function getServerSnapshot() {
  return EMPTY;
}

export const toast = {
  success(title: string, detail?: string) {
    return push("success", title, detail);
  },
  error(title: string, detail?: string) {
    return push("error", title, detail);
  },
  info(title: string, detail?: string) {
    return push("info", title, detail);
  },
  dismiss,
};

export function ToastHost() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (list.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex flex-col items-center gap-2 px-4 pt-[max(0.85rem,env(safe-area-inset-top))] sm:items-end sm:px-6"
      aria-live="polite"
    >
      {list.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-[var(--radius-lg)] border bg-surface/95 px-4 py-3.5 shadow-[var(--shadow-lg)] backdrop-blur-xl animate-[toast-in_0.28s_ease-out]",
            t.kind === "success" && "border-success/25 text-heading",
            t.kind === "error" && "border-danger/25 text-heading",
            t.kind === "info" && "border-primary/25 text-heading",
          )}
        >
          <span
            className={cn(
              "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full",
              t.kind === "success" && "bg-[var(--success-soft)] text-success",
              t.kind === "error" && "bg-[var(--danger-soft)] text-danger",
              t.kind === "info" && "bg-[var(--primary-soft)] text-primary",
            )}
          >
            {t.kind === "success" ? <CheckCircle2 className="h-4 w-4" /> : null}
            {t.kind === "error" ? <XCircle className="h-4 w-4" /> : null}
            {t.kind === "info" ? <Info className="h-4 w-4" /> : null}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-heading">{t.title}</p>
            {t.detail ? <p className="mt-0.5 text-xs text-muted">{t.detail}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="rounded-full p-1 text-muted hover:bg-paper-2"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
