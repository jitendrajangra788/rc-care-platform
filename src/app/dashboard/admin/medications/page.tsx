import { requireOps } from "@/lib/auth";
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
  await requireOps();
  const db = await readDb();
  const meds = db.medications || [];
  const injections = meds.filter((m) => m.type === "injection" || m.type === "iv").length;
  const nurseIds = new Set(meds.map((m) => m.staffId || m.nurseId).filter(Boolean));

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Clinical · MAR"
        title="Medicine Chart"
        subtitle="All nurses’ medication records. Each nurse portal shows only their own entries."
      />

      <div className="dash-grid-stats cols-3">
        <StatCard label="Total entries" value={String(meds.length)} />
        <StatCard label="Inject / IV" value={String(injections)} tone="danger" />
        <StatCard label="Nurses logging" value={String(nurseIds.size)} tone="success" />
      </div>

      <Panel title="All chart entries" subtitle="Every dose logged across the care desk.">
        {meds.length === 0 ? (
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
                {meds.map((m) => {
                  const staff = db.staff.find((s) => s.id === m.staffId);
                  const nurseUser = db.users.find((u) => u.id === m.nurseId);
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
                      <td>
                        <p className="font-semibold text-heading">
                          {staff?.name || nurseUser?.name || "—"}
                        </p>
                        <p className="text-xs text-muted">{m.staffId || m.nurseId}</p>
                      </td>
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
