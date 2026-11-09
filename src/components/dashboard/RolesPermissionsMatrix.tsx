import { Shield } from "lucide-react";
import type { Role } from "@/lib/types";
import { permissionsFor, type Permission } from "@/lib/permissions";
import { titleCase } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/dashboard/DashboardShell";

const ROLES: Role[] = [
  "super_admin",
  "admin",
  "care_coordinator",
  "nurse",
  "family",
];

function roleLabel(role: Role) {
  if (role === "family") return "Family / Patient";
  return titleCase(role.replace(/_/g, " "));
}

function permissionLabel(permission: Permission) {
  return permission;
}

/** Read-only role × permission matrix from lib/permissions. */
export function RolesPermissionsMatrix() {
  const permissionSet = new Set<Permission>();
  for (const role of ROLES) {
    for (const p of permissionsFor(role)) permissionSet.add(p);
  }
  const permissions = Array.from(permissionSet).sort();

  const granted = new Map<Role, Set<Permission>>();
  for (const role of ROLES) {
    granted.set(role, new Set(permissionsFor(role)));
  }

  return (
    <Panel
      title="Roles & permissions"
      subtitle="Read-only matrix of what each role can access."
    >
      {permissions.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-5 w-5" />}
          title="No permissions defined"
          description="Role access rules will appear here when configured."
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--line)]">
          <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-paper-2">
                <th className="sticky left-0 z-10 bg-paper-2 px-3 py-2.5 font-semibold text-heading">
                  Permission
                </th>
                {ROLES.map((role) => (
                  <th
                    key={role}
                    className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-heading"
                  >
                    {roleLabel(role)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr key={permission} className="border-b border-[var(--line)] last:border-b-0">
                  <td className="sticky left-0 z-10 bg-surface px-3 py-2 font-mono text-xs text-muted">
                    {permissionLabel(permission)}
                  </td>
                  {ROLES.map((role) => {
                    const ok = granted.get(role)?.has(permission);
                    return (
                      <td key={role} className="px-3 py-2 text-center">
                        <span
                          className={
                            ok
                              ? "inline-block h-2 w-2 rounded-full bg-[var(--success)]"
                              : "inline-block h-2 w-2 rounded-full bg-[var(--line)]"
                          }
                          title={ok ? "Granted" : "Denied"}
                          aria-label={ok ? "Granted" : "Denied"}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
