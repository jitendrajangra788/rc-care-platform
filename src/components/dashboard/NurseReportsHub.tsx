"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Paperclip, Stethoscope } from "lucide-react";
import type { CareReport, Patient } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePagedList } from "@/hooks/usePagedList";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";
import { Pagination } from "@/components/ui/Pagination";

type Filter = "all" | "complete" | "daily" | "attached" | "pending" | "checked";

export function NurseReportsHub({
  reports,
  patients,
}: {
  reports: CareReport[];
  patients: Patient[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      const type = r.reportType || "daily";
      if (filter === "complete" && type !== "complete") return false;
      if (filter === "daily" && type !== "daily") return false;
      if (filter === "attached" && !r.attachmentUrl) return false;
      if (filter === "pending" && r.doctorChecked) return false;
      if (filter === "checked" && !r.doctorChecked) return false;
      if (!q) return true;
      const patient = patients.find((p) => p.id === r.patientId);
      return (
        (patient?.name || "").toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.patientId.toLowerCase().includes(q) ||
        (r.bookingId || "").toLowerCase().includes(q)
      );
    });
  }, [reports, patients, query, filter]);

  const { page, pageCount, pageSize, rows, setPage, setPageSize, resetPage } =
    usePagedList(filtered, 8);

  return (
    <div className="space-y-2">
      <div className="soft-panel flex flex-col gap-2 p-2.5 md:flex-row md:items-center md:justify-between">
        <input
          className="field min-w-0 flex-1"
          placeholder="Search patient, booking, summary…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            resetPage();
          }}
          aria-label="Search reports"
        />
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", "All"],
              ["complete", "Complete"],
              ["daily", "Daily"],
              ["pending", "Dr pending"],
              ["checked", "Dr checked"],
              ["attached", "With file"],
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
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No reports found"
          description="Upload a complete report from a patient page, or save a daily report from Care Plans."
        />
      ) : (
        <div className="space-y-1.5">
          {rows.map((r) => {
            const patient = patients.find((p) => p.id === r.patientId);
            const type = r.reportType || "daily";
            return (
              <ListTile key={r.id} className="animate-dash-in">
                <ListTileHeader>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-name text-lg text-heading">
                        {patient?.name || r.patientId}
                      </p>
                      <Badge tone={type === "complete" ? "primary" : "neutral"}>
                        {type === "complete" ? "Complete" : "Daily"}
                      </Badge>
                      <Badge tone={r.doctorChecked ? "success" : "warning"}>
                        {r.doctorChecked ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Dr checked
                          </>
                        ) : (
                          <>
                            <Stethoscope className="h-3 w-3" /> Dr pending
                          </>
                        )}
                      </Badge>
                      {r.attachmentUrl ? (
                        <Badge tone="neutral">
                          <Paperclip className="h-3 w-3" /> File
                        </Badge>
                      ) : null}
                    </div>
                    <ListTileMeta>
                      Duty {formatDate(r.dutyDate)} · {formatDateTime(r.createdAt)}
                      {r.bookingId ? ` · ${r.bookingId}` : ""}
                    </ListTileMeta>
                    <p className="mt-1.5 line-clamp-2 text-sm text-heading">{r.summary}</p>
                    {r.doctorChecked && r.doctorName ? (
                      <p className="mt-1 text-xs font-medium text-success">
                        Dr. {r.doctorName}
                        {r.doctorRemarks ? ` — ${r.doctorRemarks}` : ""}
                      </p>
                    ) : null}
                    {r.familyUpdate ? (
                      <p className="mt-1 text-xs text-muted">Family: {r.familyUpdate}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.attachmentUrl ? (
                      <a
                        href={r.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline btn-sm"
                      >
                        Open file
                      </a>
                    ) : null}
                    <Link
                      href={`/dashboard/nurse/patients/${r.patientId}`}
                      className="btn btn-ghost btn-sm"
                    >
                      Patient
                    </Link>
                  </div>
                </ListTileHeader>
              </ListTile>
            );
          })}
          <Pagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            total={reports.length}
            filteredCount={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 8, 15, 30]}
            noun="reports"
          />
        </div>
      )}
    </div>
  );
}
