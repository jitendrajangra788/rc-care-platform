"use client";

import type { CareNote } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { usePagedList } from "@/hooks/usePagedList";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";
import { Pagination } from "@/components/ui/Pagination";

type NoteRow = CareNote & { patientName?: string };

export function NurseNotesList({ notes }: { notes: NoteRow[] }) {
  const { page, pageCount, pageSize, rows, setPage, setPageSize } = usePagedList(notes, 8);

  if (notes.length === 0) {
    return (
      <EmptyState
        title="No notes yet"
        description="Log vitals and shift notes from My Duties after each care visit."
      />
    );
  }

  return (
    <div className="space-y-1.5">
      {rows.map((n) => (
        <ListTile key={n.id} className="animate-dash-in">
          <ListTileHeader>
            <div>
              <p className="font-name text-lg text-heading">{n.patientName || n.bookingId}</p>
              <ListTileMeta>
                {n.bookingId} · {formatDateTime(n.createdAt)}
              </ListTileMeta>
            </div>
            <Badge tone="primary">Shift note</Badge>
          </ListTileHeader>
          <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Vital label="BP" value={n.vitals.bp || "—"} />
            <Vital label="Sugar" value={n.vitals.sugar || "—"} />
            <Vital label="Pulse" value={n.vitals.pulse || "—"} />
            <Vital label="Temp" value={n.vitals.temp || "—"} />
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-heading">{n.notes}</p>
        </ListTile>
      ))}
      <Pagination
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        total={notes.length}
        filteredCount={notes.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[5, 8, 15, 30]}
        noun="notes"
      />
    </div>
  );
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <div className="vital-chip">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <span className="text-sm font-semibold text-heading">{value}</span>
    </div>
  );
}
