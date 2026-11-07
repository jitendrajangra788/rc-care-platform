"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import type { ActivityEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ActivityBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ActivityEvent[]>([]);
  const [unread, setUnread] = useState(0);
  const loading = useRef(false);
  const openRef = useRef(false);

  const load = useCallback(async (full = false) => {
    if (loading.current) return;
    loading.current = true;
    try {
      const res = await fetch("/api/activity", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setUnread(data.unread || 0);
      if (full || openRef.current) setItems(data.activities || []);
    } finally {
      loading.current = false;
    }
  }, []);

  useEffect(() => {
    const boot = window.setTimeout(() => void load(false), 1200);
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(false);
    }, 90000);
    const onVis = () => {
      if (document.visibilityState === "visible") void load(false);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  async function markAllRead() {
    setUnread(0);
    await fetch("/api/activity", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          openRef.current = next;
          setOpen(next);
          if (next) {
            void load(true);
            if (unread > 0) void markAllRead();
          }
        }}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-[var(--line)] bg-surface text-heading transition hover:bg-paper-2"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-[var(--sidebar-fg)]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close notifications"
            onClick={() => {
              openRef.current = false;
              setOpen(false);
            }}
          />
          <div className="fixed inset-x-3 top-[4.5rem] z-50 max-h-[min(70vh,28rem)] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-surface shadow-[var(--shadow-lg)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[min(92vw,360px)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <p className="text-sm font-semibold text-heading">Activity</p>
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-semibold text-primary"
              >
                Mark read
              </button>
            </div>
            <div className="max-h-[min(60vh,22rem)] overflow-y-auto overscroll-contain">
              {items.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted">No activity yet</p>
              ) : (
                items.slice(0, 12).map((a) => (
                  <Link
                    key={a.id}
                    href={a.href || "#"}
                    prefetch={false}
                    onClick={() => {
                      openRef.current = false;
                      setOpen(false);
                    }}
                    className={cn(
                      "block border-b border-[var(--line)] px-4 py-3 transition hover:bg-paper-2",
                    )}
                  >
                    <p className="break-words text-sm font-semibold text-heading">{a.title}</p>
                    {a.detail ? (
                      <p className="mt-0.5 line-clamp-2 break-words text-xs text-muted">
                        {a.detail}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-muted">
                      {formatDateTime(a.createdAt)}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
