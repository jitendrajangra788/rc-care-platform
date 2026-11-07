"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  nurse: "Nurse",
  family: "Family",
  bookings: "Bookings",
  staff: "Staff",
  attendance: "Attendance",
  medications: "Medicine Chart",
  billing: "Billing",
  payroll: "Payroll",
  ops: "Ops Hub",
  leads: "Leads",
  notes: "Care Notes",
  profile: "Profile",
  hr: "Leave & Docs",
  live: "Live Care",
  updates: "Updates",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  const crumbs = parts.map((part, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    const label = labelMap[part] || part.replace(/-/g, " ");
    return { href, label, last: i === parts.length - 1 };
  });

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-xs text-muted sm:flex">
      <Link
        href={crumbs[0]?.href?.startsWith("/dashboard") ? crumbs[0].href : "/dashboard"}
        className="grid h-6 w-6 place-items-center rounded-md hover:bg-paper-2 hover:text-heading"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((c) => (
        <span key={c.href} className="inline-flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-[var(--line-strong)]" />
          {c.last ? (
            <span className="font-semibold capitalize text-heading">{c.label}</span>
          ) : (
            <Link href={c.href} className="capitalize transition hover:text-heading">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
