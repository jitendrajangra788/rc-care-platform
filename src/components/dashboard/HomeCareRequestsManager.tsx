"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatCard } from "@/components/ui/StatCard";
import { usePagedList } from "@/hooks/usePagedList";
import { HOME_STATUS_LABEL, HOME_STATUSES } from "@/lib/enquiry-options";
import type { DocumentMeta, HomeCareRequest, HomeCareRequestStatus } from "@/lib/types";

type Row = Omit<HomeCareRequest, "documents"> & { documents: DocumentMeta[] };
type StaffOption = { id: string; name: string; role: string };

const tone: Record<HomeCareRequestStatus, "warning" | "primary" | "accent" | "success" | "danger" | "neutral"> = {
  new: "warning",
  contacted: "primary",
  assessment_scheduled: "primary",
  quotation_sent: "accent",
  confirmed: "success",
  converted: "success",
  rejected: "danger",
  cancelled: "danger",
};

function label(status: string) {
  return HOME_STATUS_LABEL[status as HomeCareRequestStatus] || status;
}

export function HomeCareRequestsManager({
  requests,
  staff,
}: {
  requests: Row[];
  staff: StaffOption[];
}) {
  const rows = requests;
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const stats = useMemo(() => {
    const open = rows.filter((row) =>
      ["contacted", "assessment_scheduled", "quotation_sent", "confirmed"].includes(row.status),
    ).length;
    return {
      total: rows.length,
      fresh: rows.filter((row) => row.status === "new").length,
      open,
      converted: rows.filter((row) => row.status === "converted").length,
      urgent: rows.filter(
        (row) =>
          row.urgency === "Urgent" &&
          row.status !== "converted" &&
          row.status !== "rejected" &&
          row.status !== "cancelled",
      ).length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status === "open") {
        if (!["contacted", "assessment_scheduled", "quotation_sent", "confirmed"].includes(row.status)) {
          return false;
        }
      } else if (status === "urgent") {
        if (row.urgency !== "Urgent") return false;
      } else if (status !== "all" && row.status !== status) return false;
      const day = row.createdAt.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (!q) return true;
      return [row.id, row.contactName, row.patientName, row.mobile, row.area, row.city, row.service]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, query, status, from, to]);

  const {
    page,
    pageCount,
    pageSize,
    rows: pageRows,
    setPage,
    setPageSize,
    resetPage,
  } = usePagedList(filtered, 8);

  const lanes = [
    { id: "all", label: "All", count: stats.total },
    { id: "new", label: "New", count: stats.fresh },
    { id: "open", label: "In progress", count: stats.open },
    { id: "urgent", label: "Urgent", count: stats.urgent },
    { id: "converted", label: "Converted", count: stats.converted },
  ] as const;

  return (
    <div className="space-y-3">
      <div className="dash-grid-stats cols-4">
        <StatCard label="Total" value={String(stats.total)} />
        <StatCard label="New" value={String(stats.fresh)} tone="warning" />
        <StatCard label="In progress" value={String(stats.open)} tone="primary" />
        <StatCard label="Converted" value={String(stats.converted)} tone="success" hint={`${stats.urgent} urgent open`} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
        {lanes.map((lane) => (
          <button
            key={lane.id}
            type="button"
            onClick={() => {
              setStatus(lane.id);
              resetPage();
            }}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              status === lane.id
                ? "bg-[#087F8C] text-white"
                : "bg-white text-[#172D3A] ring-1 ring-[var(--line)] hover:bg-[#F7FAF9]"
            }`}
          >
            {lane.label}
            <span className="ml-1.5 opacity-80">{lane.count}</span>
          </button>
        ))}
        </div>
        <ViewToggle
          value={layout}
          onChange={setLayout}
          options={[
            { id: "list", label: "List view", icon: List },
            { id: "grid", label: "Grid view", icon: LayoutGrid },
          ]}
        />
      </div>

      <div className="grid gap-2 rounded-xl border border-[var(--line)] bg-white p-2.5 md:grid-cols-[1.4fr_1fr_auto_auto]">
        <SearchInput
          value={query}
          onChange={(value) => {
            setQuery(value);
            resetPage();
          }}
          placeholder="Search name, mobile, area, reference"
          aria-label="Search home care requests"
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            resetPage();
          }}
          aria-label="Status"
        >
          <option value="all">All statuses</option>
          <option value="open">In progress</option>
          <option value="urgent">Urgent</option>
          {HOME_STATUSES.map((item) => (
            <option key={item} value={item}>
              {HOME_STATUS_LABEL[item]}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            resetPage();
          }}
          aria-label="From date"
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            resetPage();
          }}
          aria-label="To date"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
        {filtered.length === 0 ? (
          <EmptyState title="No requests" description="Try another search or status filter." />
        ) : (
          <>
            <ul
              className={
                layout === "grid"
                  ? "grid gap-2 p-2 sm:grid-cols-2 xl:grid-cols-3"
                  : "divide-y divide-[var(--line)]"
              }
            >
              {pageRows.map((row) => {
                const owner = staff.find((member) => member.id === row.assignedStaffId);
                return (
                  <li key={row.id}>
                    <Link
                      href={`/dashboard/admin/home-care-requests/${row.id}`}
                      className={
                        layout === "grid"
                          ? "flex h-full flex-col gap-2 rounded-xl border border-[var(--line)] bg-white p-3 transition hover:border-primary hover:bg-[#F7FAF9]"
                          : "grid gap-2 px-3 py-2.5 transition hover:bg-[#F7FAF9] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_auto] sm:items-center"
                      }
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#172D3A]">
                          {row.patientName}
                          <span className="ml-2 text-xs font-medium text-muted">{row.id}</span>
                        </p>
                        <p className="truncate text-xs text-muted">
                          {row.contactName} · {row.mobile}
                        </p>
                      </div>
                      <p className="truncate text-xs text-[#172D3A]">
                        {row.service} · {row.dutyHours} · {row.area}
                        <span className="mt-0.5 block text-muted">
                          Starts {row.preferredStartDate} · {row.preferredShift}
                          {owner ? ` · ${owner.name}` : ""}
                        </span>
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                        {row.urgency === "Urgent" ? <Badge tone="danger">Urgent</Badge> : null}
                        <Badge tone={tone[row.status]}>{label(row.status)}</Badge>
                        <span className="btn btn-primary btn-sm">Open</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Pagination
              page={page}
              pageCount={pageCount}
              total={rows.length}
              filteredCount={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[8, 16, 32]}
              noun="requests"
              className="px-3 pb-3"
            />
          </>
        )}
      </div>
    </div>
  );
}
