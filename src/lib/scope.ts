import type { Booking, DbShape, SessionUser } from "@/lib/types";
import { isStaffOpsRole, normalizeRole } from "@/lib/permissions";

export function staffForUser(db: DbShape, user: SessionUser) {
  return db.staff.find((s) => s.userId === user.id || s.name === user.name);
}

export function bookingsForUser(db: DbShape, user: SessionUser): Booking[] {
  const role = normalizeRole(user.role);
  if (isStaffOpsRole(role)) return db.bookings;

  if (role === "nurse") {
    const staff = staffForUser(db, user);
    return db.bookings.filter((b) => b.assignedStaffId === staff?.id);
  }

  if (role === "family") {
    const patientIds = new Set(
      (db.patients || [])
        .filter((p) => (p.familyUserIds || []).includes(user.id))
        .map((p) => p.id),
    );
    return db.bookings.filter(
      (b) => b.familyUserId === user.id || (b.patientId && patientIds.has(b.patientId)),
    );
  }

  if (role === "patient") {
    const mine = (db.patients || []).filter((p) => p.userId === user.id).map((p) => p.id);
    const set = new Set(mine);
    return db.bookings.filter((b) => (b.patientId && set.has(b.patientId)) || b.phone === user.phone);
  }

  return [];
}

export function patientIdsForUser(db: DbShape, user: SessionUser): Set<string> {
  const role = normalizeRole(user.role);
  if (isStaffOpsRole(role)) return new Set((db.patients || []).map((p) => p.id));

  if (role === "nurse") {
    const staff = staffForUser(db, user);
    const ids = db.bookings
      .filter((b) => b.assignedStaffId === staff?.id && b.patientId)
      .map((b) => b.patientId!) ;
    return new Set(ids);
  }

  if (role === "family") {
    return new Set(
      (db.patients || [])
        .filter((p) => (p.familyUserIds || []).includes(user.id))
        .map((p) => p.id),
    );
  }

  if (role === "patient") {
    return new Set((db.patients || []).filter((p) => p.userId === user.id).map((p) => p.id));
  }

  return new Set();
}
