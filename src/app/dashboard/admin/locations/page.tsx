import { readDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { LocationsManager } from "@/components/dashboard/LocationsManager";
import { StatCard } from "@/components/dashboard/DashboardShell";

export default async function AdminLocationsPage() {
  const db = await readDb();
  const activeAllot = (db.siteAllotments || []).filter((a) => a.status === "active").length;

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Sites"
        title="Care locations"
        subtitle="Add GPS care sites and allot staff — same flow as old locations / allot_site."
      />
      <div className="dash-grid-stats cols-3">
        <StatCard label="Locations" value={String((db.careLocations || []).length)} />
        <StatCard label="Active allotments" value={String(activeAllot)} tone="primary" />
        <StatCard label="Staff roster" value={String(db.staff.length)} />
      </div>
      <LocationsManager
        locations={db.careLocations || []}
        allotments={db.siteAllotments || []}
        staff={db.staff.map((s) => ({
          id: s.id,
          name: s.name,
          role: s.role,
          status: s.status,
        }))}
        bookings={db.bookings.map((b) => ({
          id: b.id,
          patientName: b.patientName,
          address: b.address,
          status: b.status,
          assignedStaffId: b.assignedStaffId,
        }))}
      />
    </div>
  );
}
