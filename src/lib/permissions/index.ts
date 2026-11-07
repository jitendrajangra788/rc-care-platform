import type { Role, SessionUser } from "@/lib/types";

export type Permission =
  | "settings.read"
  | "settings.write"
  | "users.manage"
  | "patients.read"
  | "patients.write"
  | "bookings.read"
  | "bookings.write"
  | "bookings.assign"
  | "schedule.read"
  | "schedule.write"
  | "staff.read"
  | "staff.write"
  | "attendance.read"
  | "attendance.write"
  | "attendance.admin_mark"
  | "clinical.read"
  | "clinical.write"
  | "billing.read"
  | "billing.write"
  | "payroll.read"
  | "payroll.write"
  | "expenses.read"
  | "expenses.write"
  | "payments.read"
  | "payments.write"
  | "leads.read"
  | "leads.write"
  | "complaints.read"
  | "complaints.write"
  | "sos.manage"
  | "audit.read"
  | "reports.read"
  | "notifications.read"
  | "locations.write"
  | "ops.read";

const ALL: Permission[] = [
  "settings.read",
  "settings.write",
  "users.manage",
  "patients.read",
  "patients.write",
  "bookings.read",
  "bookings.write",
  "bookings.assign",
  "schedule.read",
  "schedule.write",
  "staff.read",
  "staff.write",
  "attendance.read",
  "attendance.write",
  "attendance.admin_mark",
  "clinical.read",
  "clinical.write",
  "billing.read",
  "billing.write",
  "payroll.read",
  "payroll.write",
  "expenses.read",
  "expenses.write",
  "payments.read",
  "payments.write",
  "leads.read",
  "leads.write",
  "complaints.read",
  "complaints.write",
  "sos.manage",
  "audit.read",
  "reports.read",
  "notifications.read",
  "locations.write",
  "ops.read",
];

const MATRIX: Record<Role, Permission[]> = {
  super_admin: [...ALL],
  admin: ALL.filter((p) => p !== "settings.write"),
  care_coordinator: [
    "patients.read",
    "patients.write",
    "bookings.read",
    "bookings.write",
    "bookings.assign",
    "schedule.read",
    "schedule.write",
    "staff.read",
    "attendance.read",
    "attendance.write",
    "attendance.admin_mark",
    "clinical.read",
    "clinical.write",
    "billing.read",
    "leads.read",
    "leads.write",
    "complaints.read",
    "complaints.write",
    "sos.manage",
    "reports.read",
    "notifications.read",
    "locations.write",
    "ops.read",
    "payroll.read",
  ],
  nurse: [
    "bookings.read",
    "schedule.read",
    "attendance.read",
    "attendance.write",
    "clinical.read",
    "clinical.write",
    "payroll.read",
    "complaints.write",
    "notifications.read",
    "patients.read",
  ],
  family: [
    "patients.read",
    "bookings.read",
    "bookings.write",
    "billing.read",
    "clinical.read",
    "complaints.write",
    "complaints.read",
    "notifications.read",
  ],
  patient: [
    "patients.read",
    "bookings.read",
    "clinical.read",
    "billing.read",
    "complaints.write",
    "complaints.read",
    "notifications.read",
  ],
};

export function normalizeRole(role: string | undefined): Role {
  if (
    role === "super_admin" ||
    role === "care_coordinator" ||
    role === "patient" ||
    role === "nurse" ||
    role === "family" ||
    role === "admin"
  ) {
    return role;
  }
  return "family";
}

export function isStaffOpsRole(role: Role) {
  return role === "super_admin" || role === "admin" || role === "care_coordinator";
}

export function isAdminLike(role: Role) {
  return role === "super_admin" || role === "admin";
}

export function can(user: SessionUser | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return (MATRIX[role] || []).includes(permission);
}

export function canAny(user: SessionUser | null | undefined, permissions: Permission[]) {
  return permissions.some((p) => can(user, p));
}

export function permissionsFor(role: Role): Permission[] {
  return [...(MATRIX[normalizeRole(role)] || [])];
}
