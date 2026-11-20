import type {
  Attendance,
  Booking,
  DbShape,
  MedicationLog,
  Patient,
  SessionUser,
  Staff,
} from "@/lib/types";
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
    const patientIds = patientIdsForUser(db, user);
    return db.bookings.filter(
      (b) =>
        b.familyUserId === user.id ||
        (b.patientId && patientIds.has(b.patientId)) ||
        (!!user.phone && b.phone === user.phone),
    );
  }

  return [];
}

/** Medicine chart (MAR): nurse sees only own entries; admin/ops see all. */
export function medicationsForUser(db: DbShape, user: SessionUser): MedicationLog[] {
  const role = normalizeRole(user.role);
  if (isStaffOpsRole(role)) return db.medications || [];

  if (role === "nurse") {
    const staff = staffForUser(db, user);
    return (db.medications || []).filter(
      (m) => (staff && m.staffId === staff.id) || m.nurseId === user.id,
    );
  }

  if (role === "family") {
    const bookingIds = new Set(bookingsForUser(db, user).map((b) => b.id));
    return (db.medications || []).filter((m) => bookingIds.has(m.bookingId));
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
        .filter(
          (p) =>
            p.userId === user.id ||
            (p.familyUserIds || []).includes(user.id) ||
            (!!user.phone && p.phone === user.phone),
        )
        .map((p) => p.id),
    );
  }

  return new Set();
}

const PHONE_IN_TEXT = /(?:\+?\d{1,3}[\s-]?)?[6-9]\d{9}/g;

/** Stable duty label. Never the patient's name. */
export function dutyLabel(bookingId: string) {
  return `Duty ${bookingId}`;
}

/** Remove phone numbers and a known patient name from care text. */
export function stripIdentityText(text: string | undefined, names: string[] = []) {
  if (!text) return text;
  let out = text;
  for (const name of names) {
    const trimmed = name.trim();
    if (trimmed.length >= 3 && !trimmed.startsWith("Duty ")) {
      out = out.split(trimmed).join("the patient");
    }
  }
  return out.replace(PHONE_IN_TEXT, "").replace(/[ \t]{2,}/g, " ").trim();
}

/** Nurse-safe booking: location, shift, status, and care notes. No identity or billing. */
export function redactNurseBooking(booking: Booking): Booking {
  return {
    ...booking,
    patientName: dutyLabel(booking.id),
    phone: "",
    guardianName: undefined,
    familyUserId: undefined,
    amount: 0,
    upiId: undefined,
    staffPayPerShift: undefined,
    patientAge: undefined,
    gender: undefined,
    notes: stripIdentityText(booking.notes, [booking.patientName]),
  };
}

/** Nurse-safe patient row keyed to a duty. Address stays so the nurse can reach the site. */
export function redactNursePatient(patient: Patient, bookingId?: string): Patient {
  return {
    ...patient,
    name: bookingId ? dutyLabel(bookingId) : "Assigned duty",
    phone: "",
    age: undefined,
    gender: undefined,
    notes: undefined,
    familyUserIds: [],
    userId: undefined,
  };
}

/**
 * Read-only projection for nurse server pages.
 * Never pass the result to writeDb — it is a filtered copy, not the database.
 */
export function nurseView(db: DbShape, user: SessionUser): DbShape {
  if (normalizeRole(user.role) !== "nurse") return db;

  const staff = staffForUser(db, user);
  const duties = dutiesForStaff(db, staff);
  const dutyIds = new Set(duties.map((b) => b.id));
  const patientIds = new Set(
    duties.map((b) => b.patientId).filter((id): id is string => Boolean(id)),
  );

  return {
    ...db,
    users: db.users
      .filter((u) => u.id === user.id)
      .map((u) => ({ ...u, password: "" })),
    staff: staff ? [staff] : [],
    bookings: duties.map(redactNurseBooking),
    patients: (db.patients || [])
      .filter((p) => patientIds.has(p.id))
      .map((p) => {
        const duty = duties.find((d) => d.patientId === p.id);
        return redactNursePatient(p, duty?.id);
      }),
    invoices: [],
    leads: [],
    payments: [],
    expenses: [],
    auditLogs: [],
    doctorNotes: [],
    callLogs: [],
    homeCareRequests: [],
    careerApplications: [],
    salaryPayouts: (db.salaryPayouts || [])
      .filter((p) => staff && p.staffId === staff.id)
      .map((p) => ({ ...p, patientName: dutyLabel(p.bookingId) })),
    medications: (db.medications || [])
      .filter((m) => (staff && m.staffId === staff.id) || m.nurseId === user.id)
      .map((m) => ({
        ...m,
        patientName: dutyLabel(m.bookingId),
        photoUrl: undefined,
      })),
    medSchedules: (db.medSchedules || [])
      .filter((m) => dutyIds.has(m.bookingId))
      .map((m) => ({ ...m, patientName: dutyLabel(m.bookingId) })),
    sosAlerts: (db.sosAlerts || [])
      .filter((s) => dutyIds.has(s.bookingId) || s.raisedByUserId === user.id)
      .map((s) => ({ ...s, patientName: dutyLabel(s.bookingId) })),
    careReports: (db.careReports || [])
      .filter((r) => patientIds.has(r.patientId))
      .map((r) => ({ ...r, attachmentUrl: undefined, attachmentName: undefined })),
    attendance: attendanceForStaff(db, staff, user),
    leaves: (db.leaves || []).filter((l) => staff && l.staffId === staff.id),
    documents: (db.documents || []).filter((d) => staff && d.staffId === staff.id),
    advances: (db.advances || []).filter((a) => staff && a.staffId === staff.id),
    activities: (db.activities || []).filter((a) => a.actorId === user.id),
    notifications: (db.notifications || []).filter((n) => n.userId === user.id),
    complaints: (db.complaints || []).filter((c) => c.raisedByUserId === user.id),
    nurseAvailability: (db.nurseAvailability || []).filter(
      (a) => staff && a.staffId === staff.id,
    ),
    settings: {
      ...db.settings,
      upiId: undefined,
      gstin: undefined,
    },
  };
}
