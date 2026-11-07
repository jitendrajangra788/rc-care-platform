import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { patientIdsForUser } from "@/lib/scope";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";

export default async function PatientCareHistoryPage() {
  const user = await getSession();
  const db = await readDb();
  const ids = patientIdsForUser(db, user!);
  const notes = db.careNotes.filter((n) => {
    const booking = db.bookings.find((b) => b.id === n.bookingId);
    return booking?.patientId && ids.has(booking.patientId);
  });
  const vitals = (db.vitals || []).filter((v) => ids.has(v.patientId));
  const reports = (db.careReports || []).filter((r) => ids.has(r.patientId));

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="History"
        title="Care history"
        subtitle="Notes, vitals, and daily reports."
      />

      <Panel title="Daily reports" subtitle={`${reports.length} reports`}>
        {reports.length === 0 ? (
          <EmptyState title="No reports yet" description="End-of-day summaries appear after nurses submit them." />
        ) : (
          <div className="space-y-1.5">
            {reports.map((r) => (
              <ListTile key={r.id} className="animate-dash-in">
                <ListTileHeader>
                  <div>
                    <h3 className="font-display text-base text-heading">{r.dutyDate}</h3>
                    <ListTileMeta>{r.summary}</ListTileMeta>
                  </div>
                </ListTileHeader>
              </ListTile>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Vitals" subtitle="Recent readings">
        {vitals.length === 0 ? (
          <EmptyState title="No vitals yet" description="Recorded vitals will show here." />
        ) : (
          <div className="space-y-1.5">
            {vitals.slice(0, 20).map((v) => (
              <ListTile key={v.id} className="animate-dash-in">
                <ListTileHeader>
                  <div>
                    <h3 className="font-display text-base text-heading">
                      {new Date(v.recordedAt).toLocaleString()}
                    </h3>
                    <ListTileMeta>
                      BP {v.bp || "—"} · Sugar {v.sugar || "—"}
                    </ListTileMeta>
                  </div>
                </ListTileHeader>
              </ListTile>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Care notes" subtitle="Shift notes from nursing staff">
        {notes.length === 0 ? (
          <EmptyState title="No care notes yet" description="Nurse updates will appear in this list." />
        ) : (
          <div className="space-y-1.5">
            {notes.slice(0, 20).map((n) => (
              <ListTile key={n.id} className="animate-dash-in">
                <ListTileHeader>
                  <div>
                    <h3 className="font-display text-base text-heading">
                      {new Date(n.createdAt).toLocaleString()}
                    </h3>
                    <ListTileMeta>{n.notes}</ListTileMeta>
                  </div>
                </ListTileHeader>
              </ListTile>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
