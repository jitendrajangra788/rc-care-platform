"use client";

import { useEffect, useMemo, useState } from "react";
import { ScrollText } from "lucide-react";
import type { ActivityEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/dashboard/DashboardShell";

type AuditRow = {
  id: string;
  time: string;
  actor: string;
  action: string;
  detail: string;
};

function toRow(event: ActivityEvent): AuditRow {
  return {
    id: event.id,
    time: formatDateTime(event.createdAt),
    actor: event.actorName || "System",
    action: event.title || event.kind,
    detail: event.detail || "—",
  };
}

/** Audit-style activity table backed by GET /api/activity. */
export function AuditLogPanel() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/activity");
        if (!res.ok) {
          if (!cancelled) setError("Could not load audit activity.");
          return;
        }
        const data = (await res.json()) as { activities?: ActivityEvent[] };
        if (!cancelled) setRows((data.activities || []).map(toRow));
      } catch {
        if (!cancelled) setError("Could not load audit activity.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const columns = useMemo<DataTableColumn<AuditRow>[]>(
    () => [
      {
        accessorKey: "time",
        header: "Time",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted">{row.original.time}</span>
        ),
      },
      {
        accessorKey: "actor",
        header: "Actor",
        cell: ({ row }) => (
          <span className="font-medium text-heading">{row.original.actor}</span>
        ),
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => <span className="text-heading">{row.original.action}</span>,
      },
      {
        accessorKey: "detail",
        header: "Detail",
        cell: ({ row }) => (
          <span className="line-clamp-2 text-muted">{row.original.detail}</span>
        ),
      },
    ],
    [],
  );

  return (
    <Panel title="Audit log" subtitle="Recent system activity across the care desk.">
      {loading ? (
        <p className="py-3 text-center text-sm text-muted">Loading activity…</p>
      ) : error ? (
        <EmptyState
          icon={<ScrollText className="h-5 w-5" />}
          title="Audit log unavailable"
          description={error}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-5 w-5" />}
          title="No audit events"
          description="Activity will appear here as teams work across bookings, care, and billing."
        />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          getRowId={(row) => row.id}
          searchPlaceholder="Filter audit events…"
          emptyTitle="No matching events"
          emptyDescription="Try another search."
          exportFilename="audit-log.csv"
          pageSize={15}
        />
      )}
    </Panel>
  );
}
