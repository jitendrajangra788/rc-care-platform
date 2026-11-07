import Link from "next/link";
import { readDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/DashboardShell";
import { AttendanceExportBar } from "@/components/dashboard/AttendanceExportBar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function AdminAttendanceReportPage() {
  const db = await readDb();
  const rows = [...db.attendance].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Attendance"
        title="Attendance report"
        subtitle="List + Excel/PDF export — mirrors old Report.php / export-excel / export-pdf."
        action={
          <Link href="/dashboard/admin/attendance" className="btn btn-outline btn-sm">
            Back to desk
          </Link>
        }
      />
      <AttendanceExportBar attendance={db.attendance} staff={db.staff} bookings={db.bookings} />
      <Panel title="All marks" subtitle={`${rows.length} records`}>
        {rows.length === 0 ? (
          <EmptyState title="No attendance yet" description="Marks appear after staff check-in." />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Slot</th>
                  <th>Staff</th>
                  <th>Patient</th>
                  <th>Distance</th>
                  <th>GPS</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const member = db.staff.find((s) => s.id === a.staffId);
                  const booking = db.bookings.find((b) => b.id === a.bookingId);
                  return (
                    <tr key={a.id}>
                      <td>{a.dutyDate || a.createdAt.slice(0, 10)}</td>
                      <td className="capitalize">{a.type}</td>
                      <td className="font-name">{member?.name || a.staffId}</td>
                      <td>{booking?.patientName || a.bookingId}</td>
                      <td>{a.distanceMeters}m</td>
                      <td>{a.gpsQuality || "—"}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <Badge tone={a.withinGeofence ? "success" : "warning"}>
                            {a.withinGeofence ? "in" : "out"}
                          </Badge>
                          {a.markedByAdmin ? <Badge tone="primary">desk</Badge> : null}
                        </div>
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
