import { readDb } from "@/lib/db";
import { StaffWorkspace } from "@/components/dashboard/StaffWorkspace";

export default async function AdminStaffPage() {
  const db = await readDb();
  const staff = db.staff.map((s) => {
    const user = db.users.find((u) => u.id === s.userId);
    return {
      ...s,
      email: s.email || user?.email || "",
      loginEmail: user?.email || s.email || "",
      hasLogin: Boolean(user),
    };
  });

  return (
    <StaffWorkspace
      staff={staff}
      attendance={db.attendance}
      payouts={db.salaryPayouts || []}
      bookings={db.bookings}
    />
  );
}
