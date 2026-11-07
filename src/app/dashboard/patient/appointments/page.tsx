import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { bookingsForUser } from "@/lib/scope";
import { formatShiftLabel } from "@/lib/schedule";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";

export default async function PatientAppointmentsPage() {
  const user = await getSession();
  const db = await readDb();
  const bookings = bookingsForUser(db, user!).sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Schedule"
        title="Appointments"
        subtitle="Bookings linked to your patient profile."
      />
      <Panel title="Bookings" subtitle={`${bookings.length} appointments`}>
        {bookings.length === 0 ? (
          <EmptyState
            title="No appointments yet"
            description="Bookings appear here once the care desk schedules care for you."
          />
        ) : (
          <div className="space-y-1.5">
            {bookings.map((b) => (
              <ListTile key={b.id} className="animate-dash-in">
                <ListTileHeader>
                  <div>
                    <h3 className="font-display text-lg text-heading">{b.careType}</h3>
                    <ListTileMeta>
                      {formatShiftLabel(b)} · {b.startDate}
                      {b.endDate ? ` → ${b.endDate}` : ""}
                    </ListTileMeta>
                    <ListTileMeta>{b.address}</ListTileMeta>
                  </div>
                  <Badge tone={b.status === "active" ? "success" : "primary"}>{b.status}</Badge>
                </ListTileHeader>
              </ListTile>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
