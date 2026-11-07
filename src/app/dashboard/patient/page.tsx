import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { bookingsForUser, patientIdsForUser } from "@/lib/scope";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, StatCard } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";

export default async function PatientOverviewPage() {
  const user = await getSession();
  const db = await readDb();
  const ids = patientIdsForUser(db, user!);
  const patients = (db.patients || []).filter((p) => ids.has(p.id));
  const bookings = bookingsForUser(db, user!);
  const active = bookings.filter((b) => b.status === "active" || b.status === "assigned");

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Patient portal"
        title={`Hello, ${user?.name || "Patient"}`}
        subtitle="Your care overview, appointments, and history."
      />
      <div className="dash-grid-stats cols-3">
        <StatCard label="Linked profiles" value={String(patients.length)} />
        <StatCard label="Active care" value={String(active.length)} tone="primary" />
        <StatCard label="Total bookings" value={String(bookings.length)} />
      </div>
      <Panel title="My care" subtitle="Linked patient profiles on your account.">
        {patients.length === 0 ? (
          <EmptyState
            title="No linked profiles"
            description="Ask the care desk to link your patient record."
          />
        ) : (
          <div className="space-y-1.5">
            {patients.map((p) => (
              <ListTile key={p.id} className="animate-dash-in">
                <ListTileHeader>
                  <div>
                    <h3 className="font-name text-lg text-heading">{p.name}</h3>
                    <ListTileMeta>{p.address || p.area}</ListTileMeta>
                  </div>
                  <Badge tone={p.status === "active" ? "success" : "neutral"}>{p.status}</Badge>
                </ListTileHeader>
              </ListTile>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
