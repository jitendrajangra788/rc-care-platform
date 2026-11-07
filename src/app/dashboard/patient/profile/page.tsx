import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { patientIdsForUser } from "@/lib/scope";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";

export default async function PatientProfilePage() {
  const user = await getSession();
  const db = await readDb();
  const ids = patientIdsForUser(db, user!);
  const patients = (db.patients || []).filter((p) => ids.has(p.id));

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        subtitle="Your login and linked patient record."
      />
      <Panel title="Account details" subtitle="Login information for this portal.">
        <div className="grid gap-2 sm:grid-cols-3">
          <div>
            <p className="text-label text-muted">Name</p>
            <p className="font-display mt-1 text-lg text-heading">{user?.name}</p>
          </div>
          <div>
            <p className="text-label text-muted">Email</p>
            <p className="font-display mt-1 text-lg text-heading">{user?.email}</p>
          </div>
          <div>
            <p className="text-label text-muted">Phone</p>
            <p className="font-display mt-1 text-lg text-heading">{user?.phone || "—"}</p>
          </div>
        </div>
      </Panel>

      <Panel title="Linked patients" subtitle={`${patients.length} profiles`}>
        {patients.length === 0 ? (
          <EmptyState
            title="No linked patients"
            description="Ask the care desk to link a patient record to your account."
          />
        ) : (
          <div className="space-y-1.5">
            {patients.map((p) => (
              <ListTile key={p.id} className="animate-dash-in">
                <ListTileHeader>
                  <div>
                    <h2 className="font-display text-xl text-heading">{p.name}</h2>
                    <ListTileMeta>{p.address}</ListTileMeta>
                    <ListTileMeta>{p.phone}</ListTileMeta>
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
