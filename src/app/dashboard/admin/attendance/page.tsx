import { readDb } from "@/lib/db";
import { AdminAttendanceWorkspace } from "@/components/dashboard/AdminAttendanceWorkspace";

export default async function AdminAttendancePage() {
  const db = await readDb();

  return (
    <AdminAttendanceWorkspace
      attendance={db.attendance}
      bookings={db.bookings}
      staff={db.staff}
    />
  );
}
