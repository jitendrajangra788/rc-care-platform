"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPinned, Search, Syringe } from "lucide-react";
import type { Attendance, Booking, MedSchedule } from "@/lib/types";
import { dutyProgress } from "@/lib/duty";
import { formatDate, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePagedList } from "@/hooks/usePagedList";
import { CareNoteForm } from "@/components/dashboard/CareNoteForm";
import { NurseStatusPill } from "@/components/dashboard/NurseStatusPill";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListTile, ListTileMeta } from "@/components/ui/ListTile";
import { Pagination } from "@/components/ui/Pagination";

type Filter = "today" | "active" | "upcoming" | "all";

export function NurseDutiesBoard({
  today,
  duties,
  history,
  medSchedules,
}: {
  today: string;
  duties: Booking[];
  history: Attendance[];
  medSchedules: MedSchedule[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("today");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return duties.filter((b) => {
      if (filter === "today" && !(b.startDate <= today && (b.status === "active" || b.status === "assigned"))) {
        return false;
      }
      if (filter === "active" && !(b.status === "active" || b.status === "assigned")) return false;
      if (filter === "upcoming" && !(b.startDate > today && (b.status === "active" || b.status === "assigned"))) {
        return false;
      }
      if (!q) return true;
      return (
        b.patientName.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.careType.toLowerCase().includes(q) ||
        b.area.toLowerCase().includes(q) ||
        b.phone.includes(q)
      );
    });
  }, [duties, filter, query, today]);

  const { page, pageCount, pageSize, rows, setPage, setPageSize, resetPage } =
    usePagedList(filtered, 5);

  const counts = useMemo(
    () => ({
      today: duties.filter(
        (b) => b.startDate <= today && (b.status === "active" || b.status === "assigned"),
      ).length,
      active: duties.filter((b) => b.status === "active" || b.status === "assigned").length,
      upcoming: duties.filter(
        (b) => b.startDate > today && (b.status === "active" || b.status === "assigned"),
      ).length,
      all: duties.length,
    }),
    [duties, today],
  );

  return (
    <div className="space-y-2">
      <div className="soft-panel flex flex-col gap-2 p-2 md:flex-row md:items-center md:justify-between md:p-2.5">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className="field field-with-icon"
            placeholder="Search patient, booking, area…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetPage();
            }}
            aria-label="Search duties"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["today", "Today", counts.today],
              ["active", "Active", counts.active],
              ["upcoming", "Upcoming", counts.upcoming],
              ["all", "All", counts.all],
            ] as const
          ).map(([key, label, n]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setFilter(key);
                resetPage();
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                filter === key
                  ? "bg-primary text-[var(--sidebar-fg)]"
                  : "bg-paper-2 text-heading hover:bg-secondary",
              )}
            >
              {label} · {n}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching duties"
          description="Try another filter, or wait for care desk to assign a patient."
        />
      ) : (
        <div className="space-y-2">
          {rows.map((d) => {
            const progress = dutyProgress(history, d.id, today);
            const schedules = medSchedules.filter((s) => s.bookingId === d.id);
            return (
              <ListTile key={d.id} className="animate-dash-in !p-0 overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-2 p-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-name text-xl text-heading">{d.patientName}</h3>
                      <Badge tone={d.status === "active" ? "success" : d.status === "assigned" ? "primary" : "neutral"}>
                        {d.status}
                      </Badge>
                      {d.priority === "urgent" ? <Badge tone="danger">Urgent</Badge> : null}
                    </div>
                    <ListTileMeta>
                      {d.careType} · {d.shift} · {d.id} · Start {formatDate(d.startDate)}
                      {d.endDate ? ` → ${formatDate(d.endDate)}` : ""}
                    </ListTileMeta>
                    <ListTileMeta>
                      {d.address}
                      {d.area ? ` · ${d.area}` : ""}
                      {d.phone ? ` · ${formatPhone(d.phone)}` : ""}
                    </ListTileMeta>
                    {d.notes ? (
                      <p className="mt-2 rounded-[var(--radius-lg)] bg-paper-2 px-3 py-2 text-sm text-heading">
                        Care brief: {d.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <NurseStatusPill label="AM" ok={progress.morningDone} />
                    <NurseStatusPill label="PM" ok={progress.eveningDone} />
                  </div>
                </div>

                {schedules.length > 0 ? (
                  <div className="border-t border-[var(--line)] bg-paper-2/50 px-2.5 py-2">
                    <p className="text-label text-muted">Medicine schedule</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {schedules.map((s) => (
                        <span
                          key={s.id}
                          className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-heading"
                        >
                          {s.medicineName} · {s.dose} · {s.times.join(", ")}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-1.5 border-t border-[var(--line)] px-2.5 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Link href="/dashboard/nurse/attendance" className="btn btn-primary btn-sm">
                      <MapPinned className="h-3.5 w-3.5" /> Check in
                    </Link>
                    <Link href="/dashboard/nurse/medications" className="btn btn-outline btn-sm">
                      <Syringe className="h-3.5 w-3.5" /> Log medicine
                    </Link>
                    {d.patientId ? (
                      <Link
                        href={`/dashboard/nurse/patients/${d.patientId}`}
                        className="btn btn-ghost btn-sm"
                      >
                        Patient
                      </Link>
                    ) : null}
                  </div>
                  <CareNoteForm bookingId={d.id} />
                </div>
              </ListTile>
            );
          })}
          <Pagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            total={duties.length}
            filteredCount={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20]}
            noun="duties"
          />
        </div>
      )}
    </div>
  );
}
