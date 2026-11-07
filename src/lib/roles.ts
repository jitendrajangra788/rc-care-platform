import { isStaffOpsRole, normalizeRole } from "@/lib/permissions";
import type { Role } from "@/lib/types";

export function dashboardPathForRole(role: Role) {
  const r = normalizeRole(role);
  if (isStaffOpsRole(r)) return "/dashboard/admin";
  if (r === "nurse") return "/dashboard/nurse";
  if (r === "patient") return "/dashboard/patient";
  return "/dashboard/family";
}
