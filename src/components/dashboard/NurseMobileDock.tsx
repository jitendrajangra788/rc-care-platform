"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Home,
  MapPinned,
  MoreHorizontal,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard/nurse", label: "Home", icon: Home, match: (p: string) => p === "/dashboard/nurse" },
  {
    href: "/dashboard/nurse/duties",
    label: "Duties",
    icon: ClipboardList,
    match: (p: string) => p.startsWith("/dashboard/nurse/duties"),
  },
  {
    href: "/dashboard/nurse/attendance",
    label: "Present",
    icon: MapPinned,
    match: (p: string) => p.startsWith("/dashboard/nurse/attendance"),
    primary: true,
  },
  {
    href: "/dashboard/nurse/patients",
    label: "Patients",
    icon: UserRound,
    match: (p: string) => p.startsWith("/dashboard/nurse/patients"),
  },
  {
    href: "/dashboard/nurse/schedule",
    label: "More",
    icon: MoreHorizontal,
    match: (p: string) =>
      p.startsWith("/dashboard/nurse/schedule") ||
      p.startsWith("/dashboard/nurse/medications") ||
      p.startsWith("/dashboard/nurse/notes") ||
      p.startsWith("/dashboard/nurse/salary") ||
      p.startsWith("/dashboard/nurse/hr") ||
      p.startsWith("/dashboard/nurse/profile") ||
      p.startsWith("/dashboard/nurse/care-plans") ||
      p.startsWith("/dashboard/nurse/reports") ||
      p.startsWith("/dashboard/nurse/vitals"),
  },
] as const;

/** Shared nurse floor dock — Present / Duties / Patients / More. */
export function NurseMobileDock() {
  const pathname = usePathname() || "";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-surface/95 px-2 py-2 backdrop-blur-xl md:hidden">
      <nav className="mx-auto grid max-w-[1200px] grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          const primary = "primary" in item && item.primary;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-[var(--radius-lg)] px-1 py-1.5 text-[10px] font-semibold transition",
                primary && !active
                  ? "bg-primary text-[var(--sidebar-fg)] shadow-[var(--shadow-xs)]"
                  : active
                    ? "bg-[var(--primary-soft)] text-primary"
                    : "text-muted hover:bg-paper-2 hover:text-heading",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
