import { readDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, StatCard } from "@/components/dashboard/DashboardShell";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

const typeTone: Record<string, BadgeTone> = {
  injection: "danger",
  tablet: "primary",
  syrup: "success",
  iv: "accent",
  ointment: "warning",
  other: "neutral",
};

export default async function AdminMedicationsPage() {
  const db = await readDb();
  const injections = db.medications.filter((m) => m.type === "injection" || m.type === "iv").length;

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Clinical · MAR"
        title="Medicine Chart"
        subtitle="All medication administration records submitted by nursing staff across active and past duties."
      />

      <div className="dash-grid-stats cols-3">
        <StatCard label="Total entries" value={String(db.medications.length)} />
        <StatCard label="Inject / IV" value={String(injections)} tone="danger" />
        <StatCard
          label="Oral / other"
          value={String(db.medications.length - injections)}
          tone="success"
        />
      </div>

      <Panel title="All chart entries" subtitle="Dose, route, nurse and administration time.">
        {db.medications.length === 0 ? (
          <EmptyState
            title="No medicine chart entries yet"
            description="Nurses log doses from their duty medicines screen."
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Drug</th>
                  <th>Patient</th>
                  <th>Dose / Route</th>
                  <th>Nurse</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {db.medications.map((m) => {
                  const staff = db.staff.find((s) => s.id === m.staffId);
                  return (
                    <tr key={m.id}>
                      <td>
                        <p className="font-semibold text-heading">{m.medicineName}</p>
                        <Badge className="mt-1" tone={typeTone[m.type] || "neutral"}>
                          {m.type}
                        </Badge>
                      </td>
                      <td>
                        <p className="font-name text-heading">{m.patientName}</p>
                        <p className="text-xs text-muted">{m.bookingId}</p>
                      </td>
                      <td>
                        {m.dose}
                        {m.route ? ` · ${m.route}` : ""}
                      </td>
                      <td>{staff?.name || "—"}</td>
                      <td className="text-muted">
                        {new Date(m.timeGiven).toLocaleString("en-IN")}
                        {m.notes ? (
                          <p className="mt-1 max-w-[220px] text-xs">{m.notes}</p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
