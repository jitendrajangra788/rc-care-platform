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
    <div className="dash-stack !gap-1.5 md:!gap-2">
      <PageHeader
        eyebrow="Access"
        title="Users & roles"
        subtitle="Create logins, edit accounts, and reset passwords. Stored passwords stay hashed."
      />
      <UsersManager users={users} />
      <RolesPermissionsMatrix />
    </div>
  );
}
