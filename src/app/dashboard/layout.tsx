import { requireUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const db = await readDb();
  const staff = db.staff.find((s) => s.userId === user.id || s.name === user.name);

  return (
    <DashboardShell user={user} avatarUrl={staff?.photoUrl}>
      {children}
    </DashboardShell>
  );
}