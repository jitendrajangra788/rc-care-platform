import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { Panel } from "@/components/dashboard/DashboardShell";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";

export default async function FamilyUpdatesPage() {
  const user = await getSession();
  const db = await readDb();
  const bookings = db.bookings.filter((b) => b.familyUserId === user?.id);
  const bookingIds = new Set(bookings.map((b) => b.id));
  const notes = db.careNotes.filter((n) => bookingIds.has(n.bookingId));

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Family updates"
        title="Daily updates"
        subtitle="Vitals and notes shared by the nurse after each shift."
      />
      <Panel title="Care notes" subtitle={`${notes.length} updates`}>
        {notes.length === 0 ? (
          <EmptyState
            title="No care notes yet"
            description="Updates appear here after the nurse logs vitals from a shift."
          />
        ) : (
          <div className="space-y-1.5">
            {notes.map((n) => {
              const booking = bookings.find((b) => b.id === n.bookingId);
              return (
                <ListTile key={n.id} className="animate-dash-in">
                  <ListTileHeader>
                    <div>
                      <p className="font-name text-lg text-heading">
                        {booking?.patientName || n.bookingId}
                      </p>
                      <ListTileMeta>
                        {new Date(n.createdAt).toLocaleString("en-IN")}
                      </ListTileMeta>
                    </div>
                    <Badge tone="primary">Nurse update</Badge>
                  </ListTileHeader>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Vital label="BP" value={n.vitals.bp || "—"} />
                    <Vital label="Sugar" value={n.vitals.sugar || "—"} />
                    <Vital label="Pulse" value={n.vitals.pulse || "—"} />
                    <Vital label="Temp" value={n.vitals.temp || "—"} />
                  </div>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-heading">{n.notes}</p>
                </ListTile>
              );
            })}
          </div>
        )}
      </Panel>
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
