import type { Attendance, Booking, DbShape, SessionUser, Staff } from "@/lib/types";
import { isStaffOpsRole, normalizeRole } from "@/lib/permissions";

/** Resolve staff row for a nurse user — prefer userId, unique name only as fallback. */
export function staffForUser(db: DbShape, user: SessionUser): Staff | undefined {
  const byUser = db.staff.find((s) => s.userId === user.id);
  if (byUser) return byUser;
  const byName = db.staff.filter((s) => s.name === user.name);
  return byName.length === 1 ? byName[0] : undefined;
}

/** Bookings assigned to this staff only — never match undefined === undefined. */
export function dutiesForStaff(db: DbShape, staff: Staff | undefined): Booking[] {
  if (!staff?.id) return [];
  return db.bookings.filter((b) => b.assignedStaffId === staff.id);
}

/** Present/attendance marks belonging to this staff only. */
export function attendanceForStaff(
  db: DbShape,
  staff: Staff | undefined,
  user?: SessionUser,
): Attendance[] {
  if (!staff?.id) return [];
  const dutyIds = new Set(dutiesForStaff(db, staff).map((b) => b.id));
  return db.attendance.filter((a) => {
    // Own marks by staff id
    if (a.staffId === staff.id) return true;
    // Legacy rows keyed by nurse user id — only if duty is still assigned to this staff
    if (user && a.nurseId === user.id && dutyIds.has(a.bookingId)) return true;
    return false;
  });
}

export function bookingsForUser(db: DbShape, user: SessionUser): Booking[] {
  const role = normalizeRole(user.role);
  if (isStaffOpsRole(role)) return db.bookings;

  if (role === "nurse") {
    return dutiesForStaff(db, staffForUser(db, user));
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
    if (!staff?.id) return new Set();
    const ids = db.bookings
      .filter((b) => b.assignedStaffId === staff.id && b.patientId)
      .map((b) => b.patientId!);
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
