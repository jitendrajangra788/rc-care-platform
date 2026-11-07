import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { ScheduleWorkspace } from "@/components/dashboard/ScheduleWorkspace";

export default async function AdminSchedulePage() {
  await requireRole("admin");
  const db = await readDb();

  return (
    <ScheduleWorkspace
      bookings={db.bookings}
      staff={db.staff}
      leaves={db.leaves || []}
      availability={db.nurseAvailability || []}
    />
  );
}
