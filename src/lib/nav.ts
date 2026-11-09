import { can, isStaffOpsRole, normalizeRole, type Permission } from "@/lib/permissions";
import type { Role, SessionUser } from "@/lib/types";

export type NavIcon =
  | "overview"
  | "bookings"
  | "staff"
  | "billing"
  | "leads"
  | "duties"
  | "notes"
  | "profile"
  | "updates"
  | "request"
  | "attendance"
  | "medications"
  | "payroll"
  | "ops"
  | "hr"
  | "live"
  | "locations"
  | "salary"
  | "schedule"
  | "patients"
  | "care"
  | "vitals"
  | "complaints"
  | "expenses"
  | "reports"
  | "notifications"
  | "settings"
  | "users"
  | "clinical"
  | "finance"
  | "operations"
  | "system";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  permission?: Permission | Permission[];
};

export type NavGroup = {
  id: string;
  label: string;
  icon: NavIcon;
  children: NavItem[];
};

export type NavEntry = NavItem | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

const adminNav: NavEntry[] = [
  { href: "/dashboard/admin", label: "Overview", icon: "overview" },
  {
    id: "crm",
    label: "CRM",
    icon: "patients",
    children: [
      { href: "/dashboard/admin/patients", label: "Patients", icon: "patients", permission: "patients.read" },
      { href: "/dashboard/admin/leads", label: "Leads", icon: "leads", permission: "leads.read" },
      { href: "/dashboard/admin/bookings", label: "Bookings", icon: "bookings", permission: "bookings.read" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: "operations",
    children: [
      { href: "/dashboard/admin/schedule", label: "Schedule", icon: "schedule", permission: "schedule.read" },
      { href: "/dashboard/admin/locations", label: "Locations", icon: "locations", permission: "locations.write" },
      { href: "/dashboard/admin/ops", label: "Ops Hub", icon: "ops", permission: "ops.read" },
    ],
  },
  {
    id: "clinical",
    label: "Clinical",
    icon: "clinical",
    children: [
      { href: "/dashboard/admin/care-plans", label: "Care Plans", icon: "care", permission: "clinical.read" },
      { href: "/dashboard/admin/vitals", label: "Vitals", icon: "vitals", permission: "clinical.read" },
      { href: "/dashboard/admin/medications", label: "Medicine Chart", icon: "medications", permission: "clinical.read" },
    ],
  },
  {
    id: "staff",
    label: "Staff & HR",
    icon: "staff",
    children: [
      { href: "/dashboard/admin/staff", label: "Staff", icon: "staff", permission: "staff.read" },
      { href: "/dashboard/admin/attendance", label: "Attendance", icon: "attendance", permission: "attendance.read" },
      { href: "/dashboard/admin/payroll", label: "Payroll", icon: "payroll", permission: "payroll.read" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: "finance",
    children: [
      { href: "/dashboard/admin/billing", label: "Billing", icon: "billing", permission: "billing.read" },
      { href: "/dashboard/admin/payments", label: "Payments", icon: "billing", permission: "payments.read" },
      { href: "/dashboard/admin/expenses", label: "Expenses", icon: "expenses", permission: "expenses.read" },
    ],
  },
  {
    id: "support",
    label: "Support",
    icon: "complaints",
    children: [
      { href: "/dashboard/admin/complaints", label: "Complaints", icon: "complaints", permission: "complaints.read" },
      { href: "/dashboard/admin/notifications", label: "Notifications", icon: "notifications", permission: "notifications.read" },
      { href: "/dashboard/admin/reports", label: "Reports", icon: "reports", permission: "reports.read" },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: "system",
    children: [
      { href: "/dashboard/admin/users", label: "Users", icon: "users", permission: "users.manage" },
      { href: "/dashboard/admin/settings", label: "Settings", icon: "settings", permission: "settings.read" },
    ],
  },
];

const nurseNav: NavEntry[] = [
  { href: "/dashboard/nurse", label: "Overview", icon: "overview" },
  { href: "/dashboard/nurse/duties", label: "My Duties", icon: "duties" },
  {
    id: "nurse-duty",
    label: "Duty desk",
    icon: "schedule",
    children: [
      { href: "/dashboard/nurse/schedule", label: "My Schedule", icon: "schedule" },
      { href: "/dashboard/nurse/attendance", label: "Attendance", icon: "attendance" },
      { href: "/dashboard/nurse/attendance/history", label: "History", icon: "attendance" },
      { href: "/dashboard/nurse/patients", label: "My Patients", icon: "patients" },
    ],
  },
  {
    id: "nurse-clinical",
    label: "Clinical",
    icon: "clinical",
    children: [
      { href: "/dashboard/nurse/care-plans", label: "Care Plans", icon: "care" },
      { href: "/dashboard/nurse/reports", label: "Care Reports", icon: "notes" },
      { href: "/dashboard/nurse/vitals", label: "Vitals", icon: "vitals" },
      { href: "/dashboard/nurse/medications", label: "Medicine", icon: "medications" },
      { href: "/dashboard/nurse/notes", label: "Care Notes", icon: "notes" },
    ],
  },
  {
    id: "nurse-account",
    label: "My account",
    icon: "profile",
    children: [
      { href: "/dashboard/nurse/salary", label: "My Salary", icon: "salary" },
      { href: "/dashboard/nurse/hr", label: "Leave & Docs", icon: "hr" },
      { href: "/dashboard/nurse/profile", label: "Profile", icon: "profile" },
    ],
  },
];

const familyNav: NavEntry[] = [
  { href: "/dashboard/family", label: "Overview", icon: "overview" },
  {
    id: "family-care",
    label: "Care",
    icon: "live",
    children: [
      { href: "/dashboard/family/live", label: "Live Care", icon: "live" },
      { href: "/dashboard/family/updates", label: "Updates", icon: "updates" },
      { href: "/dashboard/family/medications", label: "Medicine Chart", icon: "medications" },
    ],
  },
  {
    id: "family-account",
    label: "Account",
    icon: "billing",
    children: [
      { href: "/dashboard/family/billing", label: "Billing", icon: "billing" },
      { href: "/dashboard/family/complaints", label: "Complaints", icon: "complaints" },
      { href: "/book", label: "Request Care", icon: "request" },
    ],
  },
];

export const navByRole: Record<Role, NavEntry[]> = {
  super_admin: adminNav,
  admin: adminNav,
  care_coordinator: adminNav,
  nurse: nurseNav,
  family: familyNav,
  // Legacy — normalizeRole maps patient → family
  patient: familyNav,
};

function itemAllowed(user: SessionUser, item: NavItem) {
  if (!item.permission) return true;
  const perms = Array.isArray(item.permission) ? item.permission : [item.permission];
  return perms.some((p) => can(user, p));
}

export function navForUser(user: SessionUser): NavEntry[] {
  const role = normalizeRole(user.role);
  const items = navByRole[role] || familyNav;
  if (!isStaffOpsRole(role)) return items;

  return items
    .map((entry) => {
      if (!isNavGroup(entry)) {
        return itemAllowed(user, entry) ? entry : null;
      }
      const children = entry.children.filter((c) => itemAllowed(user, c));
      if (!children.length) return null;
      return { ...entry, children };
    })
    .filter(Boolean) as NavEntry[];
}

/** Flat links for search / command palette */
export function flattenNav(entries: NavEntry[]): NavItem[] {
  const out: NavItem[] = [];
  for (const entry of entries) {
    if (isNavGroup(entry)) out.push(...entry.children);
    else out.push(entry);
  }
  return out;
}

export function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/book") return false;
  const bases = [
    "/dashboard/admin",
    "/dashboard/nurse",
    "/dashboard/family",
    "/dashboard/patient",
  ];
  if (bases.includes(href)) return false;
  return pathname.startsWith(href);
}

export function groupHasActive(pathname: string, group: NavGroup) {
  return group.children.some((c) => isNavActive(pathname, c.href));
}
