import { readDb } from "@/lib/db";
import { OpsHub } from "@/components/dashboard/OpsHub";
import { refreshAllPerformance } from "@/lib/performance";

export default async function AdminOpsPage() {
  const db = await readDb();
  refreshAllPerformance(db);

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      <OpsHub
        bookings={db.bookings}
        staff={db.staff}
        attendance={db.attendance}
        leaves={db.leaves}
        documents={db.documents}
        sosAlerts={db.sosAlerts}
        medSchedules={db.medSchedules}
        advances={db.advances}
        doctorNotes={db.doctorNotes}
        callLogs={db.callLogs}
        auditLogs={db.auditLogs}
        invoices={db.invoices}
      />
    </div>
  );
}
