import { formatINR } from "@/lib/utils";
import { Panel, StatCard } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";

type ReportPayload = {
  asOf: string;
  kpis: {
    patients: number;
    activeBookings: number;
    openComplaints: number;
    openSos: number;
    dues: number;
    expensesMonth: number;
    payoutsMonth: number;
    paymentsMonth: number;
  };
  byStatus: Record<string, number>;
  staffLoad: { id: string; name: string; status: string; activeDuties: number }[];
};

export function ReportsOverview({ data }: { data: ReportPayload }) {
  const statusEntries = Object.entries(data.byStatus);

  return (
    <div className="space-y-2">
      <div className="dash-grid-stats cols-4">
        <StatCard label="Active patients" value={String(data.kpis.patients)} />
        <StatCard label="Active bookings" value={String(data.kpis.activeBookings)} tone="primary" />
        <StatCard label="Family dues" value={formatINR(data.kpis.dues)} tone="warning" />
        <StatCard label="Payments MTD" value={formatINR(data.kpis.paymentsMonth)} tone="success" />
      </div>
      <div className="dash-grid-stats cols-4">
        <StatCard label="Expenses MTD" value={formatINR(data.kpis.expensesMonth)} />
        <StatCard label="Payouts MTD" value={formatINR(data.kpis.payoutsMonth)} />
        <StatCard label="Open complaints" value={String(data.kpis.openComplaints)} />
        <StatCard label="Open SOS" value={String(data.kpis.openSos)} tone="danger" />
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <Panel title="Booking status mix" subtitle={`As of ${data.asOf}`}>
          {statusEntries.length === 0 ? (
            <EmptyState title="No bookings" description="Status mix appears once bookings exist." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {statusEntries.map(([k, v]) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-paper-2 px-3 py-1.5 text-sm"
                >
                  <span className="font-medium capitalize text-heading">{k}</span>
                  <span className="font-semibold text-primary">{v}</span>
                </span>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Staff duty load" subtitle="Active assignments per nurse">
          {data.staffLoad.length === 0 ? (
            <EmptyState title="No staff load" description="Duty counts appear when nurses are assigned." />
          ) : (
            <div className="space-y-1.5">
              {data.staffLoad.map((s) => (
                <ListTile key={s.id} className="animate-dash-in">
                  <ListTileHeader>
                    <div>
                      <h3 className="font-name text-base text-heading">{s.name}</h3>
                      <ListTileMeta>{s.activeDuties} active duties</ListTileMeta>
                    </div>
                    <Badge tone={s.status === "on-duty" ? "success" : "neutral"}>{s.status}</Badge>
                  </ListTileHeader>
                </ListTile>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
