"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Globe, LogOut, Settings, UserRound } from "lucide-react";
import type { SessionUser } from "@/lib/types";
import { dashboardPathForRole } from "@/lib/roles";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function UserMenu({
  user,
  avatarUrl,
  onLogout,
}: {
  user: SessionUser;
  avatarUrl?: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { locale, toggle, t } = useLocale();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-surface py-1 pl-1 pr-2.5 text-sm font-semibold text-heading transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
      >
        <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-secondary text-xs font-bold text-primary">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            user.name.slice(0, 1)
          )}
        </span>
        <span className="hidden max-w-[8rem] truncate sm:inline">{user.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close user menu"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 max-h-[min(24rem,70vh)] w-56 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--line)] bg-surface shadow-[var(--shadow-lg)]"
          >
            <div className="border-b border-[var(--line)] px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-heading">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <Link
              role="menuitem"
              href={dashboardPathForRole(user.role)}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-heading hover:bg-[var(--surface-muted)]"
            >
              <UserRound className="h-4 w-4 text-muted" /> {t.profile}
            </Link>
            <Link
              role="menuitem"
              href="/dashboard/admin/settings"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 text-sm text-heading hover:bg-[var(--surface-muted)]",
                user.role !== "admin" && "pointer-events-none opacity-40",
              )}
            >
              <Settings className="h-4 w-4 text-muted" /> {t.settings}
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                toggle();
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-heading hover:bg-[var(--surface-muted)]"
            >
              <Globe className="h-4 w-4 text-muted" />
              {t.language}: {locale === "en" ? "English" : "हिन्दी"}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2 border-t border-[var(--line)] px-3 py-2.5 text-left text-sm font-semibold text-danger hover:bg-[var(--danger-soft)]"
            >
              <LogOut className="h-4 w-4" /> {t.logout}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
