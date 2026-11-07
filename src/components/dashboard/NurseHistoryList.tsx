"use client";

import { useMemo, useState } from "react";
import type { Attendance } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePagedList } from "@/hooks/usePagedList";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";
import { Pagination } from "@/components/ui/Pagination";

type Row = Attendance & { patientName?: string };
type Filter = "all" | "morning" | "evening" | "late";

function slotOf(a: Attendance) {
  if (a.type === "present") return "morning";
  if (a.type === "checkout") return "evening";
  return a.type;
}

export function NurseHistoryList({ history }: { history: Row[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    return history.filter((a) => {
      const slot = slotOf(a);
      if (filter === "morning") return slot === "morning";
      if (filter === "evening") return slot === "evening";
      if (filter === "late") return a.punctualityStatus === "late";
      return true;
    });
  }, [history, filter]);

  const { page, pageCount, pageSize, rows, setPage, setPageSize, resetPage } =
    usePagedList(filtered, 10);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["all", "All"],
            ["morning", "Morning"],
            ["evening", "Evening"],
            ["late", "Late"],
          ] as const
        ).map(([key, label]) => (
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
                : "bg-paper-2 text-heading hover:bg-[var(--secondary)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No history yet"
          description="Check-ins will appear here after you mark present."
        />
      ) : (
        <div className="space-y-1.5">
          {rows.map((a) => (
            <ListTile key={a.id} className="animate-dash-in">
              <ListTileHeader>
                <div>
                  <p className="font-display text-base capitalize text-heading">
                    {slotOf(a)} · {a.dutyDate || a.createdAt.slice(0, 10)}
                  </p>
                  <ListTileMeta>
                    {a.patientName || a.bookingId} · {a.distanceMeters}m ·{" "}
                    {formatDateTime(a.createdAt)}
                  </ListTileMeta>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {a.punctualityStatus ? (
                    <Badge
                      tone={
                        a.punctualityStatus === "present"
                          ? "success"
                          : a.punctualityStatus === "late"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {a.punctualityStatus}
                      {a.minutesLate ? ` · ${a.minutesLate}m` : ""}
                    </Badge>
                  ) : null}
                  {typeof a.salaryMultiplier === "number" && a.salaryMultiplier !== 1 ? (
                    <Badge tone="neutral">×{a.salaryMultiplier}</Badge>
                  ) : null}
                  <Badge tone={a.withinGeofence ? "success" : "warning"}>
                    {a.withinGeofence ? "On site" : "Outside"}
                  </Badge>
                  {a.gpsQuality ? <Badge tone="neutral">{a.gpsQuality}</Badge> : null}
                </div>
              </ListTileHeader>
            </ListTile>
          ))}
          <Pagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            total={history.length}
            filteredCount={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            noun="marks"
          />
        </div>
      )}
    </div>
  );
}
