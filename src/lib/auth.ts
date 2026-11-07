import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readDb } from "./db";
import { isAdminLike, isStaffOpsRole, normalizeRole } from "./permissions";
import { dashboardPathForRole } from "./roles";
import { verifySessionToken } from "./session-token";
import type { Role, SessionUser } from "./types";

export const SESSION_COOKIE = "roshan_session";
export { dashboardPathForRole };

export type { SessionUser };

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = verifySessionToken(raw);
    if (!parsed?.id) return null;
    const db = await readDb();
    const user = db.users.find((u) => u.id === parsed.id);
    if (!user || user.active === false) return null;
    const { password: _, ...safe } = user;
    void _;
    return { ...safe, role: normalizeRole(safe.role) };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: Role | Role[]) {
  const user = await requireUser();
  const allowed = Array.isArray(role) ? role : [role];
  const normalized = normalizeRole(user.role);
  if (!allowed.map(normalizeRole).includes(normalized)) {
    // admin-like may access admin routes
    if (allowed.includes("admin") && isAdminLike(normalized)) return user;
    if (allowed.includes("admin") && normalized === "care_coordinator") return user;
    redirect(dashboardPathForRole(user.role));
  }
  return user;
}

export async function requireOps() {
  const user = await requireUser();
  if (!isStaffOpsRole(normalizeRole(user.role))) {
    redirect(dashboardPathForRole(user.role));
  }
  return user;
}
