import { requireOps } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { normalizeRole } from "@/lib/permissions";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { RolesPermissionsMatrix } from "@/components/dashboard/RolesPermissionsMatrix";
import { UsersManager } from "@/components/dashboard/UsersManager";

export default async function AdminUsersPage() {
  await requireOps();
  const db = await readDb();
  const users = db.users.map(({ password: _, ...safe }) => {
    void _;
    return { ...safe, role: normalizeRole(safe.role) };
  });
  return (
    <div className="dash-stack">
      <PageHeader eyebrow="Access" title="Users & roles" subtitle="Create accounts and manage role access." />
      <UsersManager users={users} />
      <RolesPermissionsMatrix />
    </div>
  );
}
