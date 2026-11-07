import { dutyProgress, todayDutyDate } from "@/lib/duty";
import { staffForUser, patientIdsForUser } from "@/lib/scope";
import type {
  Attendance,
  Booking,
  CareNote,
  CareReport,
  DbShape,
  MedSchedule,
  Patient,
  SessionUser,
  Staff,
} from "@/lib/types";

export type NurseDeskContext = {
  user: SessionUser;
  staff: Staff | undefined;
  today: string;
  duties: Booking[];
  activeDuties: Booking[];
  todayDuties: Booking[];
  upcomingDuties: Booking[];
  completedDuties: Booking[];
  currentDuty: Booking | undefined;
  history: Attendance[];
  todayAttendanceCount: number;
  attendanceComplete: boolean;
  notes: CareNote[];
  pendingReports: CareReport[];
  medSchedules: MedSchedule[];
  pendingMedDuties: number;
  monthEarned: number;
  monthPaid: number;
};

/** Shared nurse desk aggregates — scoped to assigned staff only. */
export function buildNurseDesk(db: DbShape, user: SessionUser): NurseDeskContext {
  const staff = staffForUser(db, user);
  const today = todayDutyDate();
  const duties = db.bookings
    .filter((b) => b.assignedStaffId === staff?.id)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const activeDuties = duties.filter(
    (b) => b.status === "active" || b.status === "assigned",
  );
  const todayDuties = activeDuties.filter((d) => d.startDate <= today);
  const upcomingDuties = activeDuties
    .filter((d) => d.startDate > today)
    .slice(0, 8);
  const completedDuties = duties.filter((b) => b.status === "completed");

  const history = db.attendance.filter((a) => a.nurseId === user.id);
  const todayMarks = history.filter(
    (a) => (a.dutyDate || a.createdAt.slice(0, 10)) === today,
  );
  const todayAttendanceCount = todayMarks.length;

  const currentDuty =
    todayDuties.find((d) => {
      const p = dutyProgress(history, d.id, today);
      return !p.morningDone || !p.eveningDone;
    }) || todayDuties[0];

  const attendanceComplete =
    !!currentDuty &&
    (() => {
      const p = dutyProgress(history, currentDuty.id, today);
      return p.morningDone && p.eveningDone;
    })();

  const notes = db.careNotes.filter((n) => n.nurseId === user.id);
  const bookingIds = new Set(duties.map((d) => d.id));
  const reportsToday = new Set(
    (db.careReports || [])
      .filter((r) => r.dutyDate === today && r.bookingId && bookingIds.has(r.bookingId))
      .map((r) => r.bookingId as string),
  );
  const pendingReports = todayDuties.filter((d) => !reportsToday.has(d.id)).map(
    (d) =>
      ({
        id: `pending-${d.id}`,
        patientId: d.patientId || "",
        bookingId: d.id,
        dutyDate: today,
        summary: "",
        createdBy: user.id,
        createdByName: user.name,
        createdAt: "",
      }) satisfies CareReport,
  );

  const medSchedules = (db.medSchedules || []).filter((s) =>
    bookingIds.has(s.bookingId),
  );
  const medLogsToday = new Set(
    (db.medications || [])
      .filter(
        (m) =>
          m.nurseId === user.id &&
          (m.timeGiven || m.createdAt || "").slice(0, 10) === today,
      )
      .map((m) => m.bookingId),
  );
  const pendingMedDuties = todayDuties.filter(
    (d) =>
      medSchedules.some((s) => s.bookingId === d.id && s.active !== false) &&
      !medLogsToday.has(d.id),
  ).length;

  const monthKey = today.slice(0, 7);
  const payouts = (db.salaryPayouts || []).filter((p) => p.staffId === staff?.id);
  const monthPayouts = payouts.filter((p) =>
    (p.dutyDate || p.createdAt || "").startsWith(monthKey),
  );
  const monthEarned = monthPayouts
    .filter((p) => p.status === "earned" || p.status === "paid")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const monthPaid = monthPayouts
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + (p.amount || 0), 0);

  return {
    user,
    staff,
    today,
    duties,
    activeDuties,
    todayDuties,
    upcomingDuties,
    completedDuties,
    currentDuty,
    history,
    todayAttendanceCount,
    attendanceComplete,
    notes,
    pendingReports,
    medSchedules,
    pendingMedDuties,
    monthEarned,
    monthPaid,
  };
}

export type NursePatientRow = {
  patient: Patient;
  bookings: Booking[];
  activeBooking?: Booking;
  today: string;
  morningDone: boolean;
  eveningDone: boolean;
  attendanceComplete: boolean;
  isTodayDuty: boolean;
  urgent: boolean;
  latestReport?: CareReport;
  reportPendingToday: boolean;
  doctorPending: boolean;
  pendingTaskCount: number;
};

/** Caseload rows scoped to assigned patients — with attendance/report/doctor signals. */
export function nursePatients(db: DbShape, user: SessionUser): NursePatientRow[] {
  const ids = patientIdsForUser(db, user);
  const staff = staffForUser(db, user);
  const today = todayDutyDate();
  const history = db.attendance.filter((a) => a.nurseId === user.id);
  const patients = (db.patients || []).filter((p) => ids.has(p.id));
  const byPatient = new Map<string, Booking[]>();
  for (const b of db.bookings) {
    if (b.assignedStaffId !== staff?.id || !b.patientId) continue;
    const list = byPatient.get(b.patientId) || [];
    list.push(b);
    byPatient.set(b.patientId, list);
  }

  const reportsByPatient = new Map<string, CareReport[]>();
  for (const r of db.careReports || []) {
    if (!ids.has(r.patientId)) continue;
    const list = reportsByPatient.get(r.patientId) || [];
    list.push(r);
    reportsByPatient.set(r.patientId, list);
  }

  return patients.map((p) => {
    const bookings = (byPatient.get(p.id) || []).sort((a, b) =>
      b.startDate.localeCompare(a.startDate),
    );
    const active = bookings.find(
      (b) => b.status === "active" || b.status === "assigned",
    );
    const isTodayDuty = !!active && active.startDate <= today;
    const progress = active
      ? dutyProgress(history, active.id, today)
      : { morningDone: false, eveningDone: false, complete: false };
    const reports = (reportsByPatient.get(p.id) || []).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    const latestReport = reports[0];
    const reportForToday = reports.find(
      (r) =>
        r.dutyDate === today &&
        (!active || !r.bookingId || r.bookingId === active.id),
    );
    const reportPendingToday = isTodayDuty && !reportForToday;
    const doctorPending = reports.some((r) => !r.doctorChecked);
    const urgent = active?.priority === "urgent";
    const attendanceIncomplete = isTodayDuty && !progress.complete;
    let pendingTaskCount = 0;
    if (attendanceIncomplete) pendingTaskCount += 1;
    if (reportPendingToday) pendingTaskCount += 1;
    if (doctorPending) pendingTaskCount += 1;

    return {
      patient: p,
      bookings,
      activeBooking: active,
      today,
      morningDone: progress.morningDone,
      eveningDone: progress.eveningDone,
      attendanceComplete: progress.complete,
      isTodayDuty,
      urgent: !!urgent,
      latestReport,
      reportPendingToday,
      doctorPending,
      pendingTaskCount,
    };
  });
}
