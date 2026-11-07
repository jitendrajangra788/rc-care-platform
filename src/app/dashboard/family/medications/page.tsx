import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, StatCard } from "@/components/dashboard/DashboardShell";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";

const typeTone: Record<string, BadgeTone> = {
  injection: "danger",
  tablet: "primary",
  syrup: "success",
  iv: "accent",
  ointment: "warning",
  other: "neutral",
};

export default async function FamilyMedicationsPage() {
  const user = await getSession();
  const db = await readDb();
  const bookings = db.bookings.filter((b) => b.familyUserId === user?.id);
  const bookingIds = new Set(bookings.map((b) => b.id));
  const logs = db.medications.filter((m) => bookingIds.has(m.bookingId));
  const schedules = (db.medSchedules || []).filter((s) => bookingIds.has(s.bookingId));

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Patient care · MAR"
        title="Medicine Chart"
        subtitle="Schedule and administered medicines recorded by the assigned nurse."
      />

      <div className="dash-grid-stats cols-3">
        <StatCard label="Administered" value={String(logs.length)} />
        <StatCard label="Scheduled" value={String(schedules.length)} tone="primary" />
        <StatCard
          label="Inject / IV"
          value={String(logs.filter((m) => m.type === "injection" || m.type === "iv").length)}
          tone="danger"
        />
      </div>

      {schedules.length > 0 ? (
        <Panel title="Medicine schedule" subtitle="Planned dose times for your patient.">
          <div className="space-y-1.5">
            {schedules.map((s) => (
              <ListTile key={s.id} className="animate-dash-in">
                <ListTileHeader>
                  <div>
                    <p className="font-display text-base text-heading">
                      {s.medicineName} · {s.dose}
                    </p>
                    <ListTileMeta>
                      {s.patientName || s.bookingId} · Times: {s.times.join(", ")}
                    </ListTileMeta>
                  </div>
                </ListTileHeader>
              </ListTile>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel title="Administered drugs" subtitle="Logged by nursing staff.">
        {logs.length === 0 ? (
          <EmptyState
            title="No medicine chart entries yet"
            description="Entries appear after the nurse records a dose for your patient."
          />
        ) : (
          <div className="space-y-1.5">
            {logs.map((m) => (
              <ListTile key={m.id} className="animate-dash-in">
                <ListTileHeader>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-base text-heading">{m.medicineName}</p>
                      <Badge tone={typeTone[m.type] || "neutral"}>{m.type}</Badge>
                    </div>
                    <ListTileMeta>
                      {m.patientName} · Dose <strong className="text-heading">{m.dose}</strong>
                      {m.route ? ` · ${m.route}` : ""}
                    </ListTileMeta>
                    <ListTileMeta>
                      {new Date(m.timeGiven).toLocaleString("en-IN")}
                    </ListTileMeta>
                    {m.notes ? <p className="mt-2 text-sm text-muted">{m.notes}</p> : null}
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
