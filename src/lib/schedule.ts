import {
  addDays,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Booking, BookingStatus, LeaveRequest, NurseAvailability, Staff } from "./types";

export type ShiftKind = Booking["shift"];

export const SHIFT_PRESETS: Record<
  ShiftKind,
  { label: string; hours: number; start: string; end: string; crossesMidnight: boolean }
> = {
  "8hr": { label: "8 Hours", hours: 8, start: "08:00", end: "16:00", crossesMidnight: false },
  "12hr": { label: "12 Hours", hours: 12, start: "08:00", end: "20:00", crossesMidnight: false },
  "24hr": { label: "24 Hours", hours: 24, start: "08:00", end: "08:00", crossesMidnight: true },
};

export const ACTIVE_DUTY_STATUSES: BookingStatus[] = ["pending", "assigned", "active"];

export function todayISO(d = new Date()) {
  return format(d, "yyyy-MM-dd");
}

export function defaultShiftTimes(shift: ShiftKind) {
  const p = SHIFT_PRESETS[shift] || SHIFT_PRESETS["12hr"];
  return { start: p.start, end: p.end };
}

export function resolveShiftTimes(booking: Pick<Booking, "shift" | "shiftStartTime" | "shiftEndTime">) {
  const defaults = defaultShiftTimes(booking.shift);
  return {
    start: booking.shiftStartTime || defaults.start,
    end: booking.shiftEndTime || defaults.end,
  };
}

/** Inclusive calendar span for a booking. Ongoing duties without endDate run through today. */
export function bookingDateSpan(booking: Booking, asOf = todayISO()) {
  const from = booking.startDate;
  if (booking.endDate) {
    return { from, to: booking.endDate < from ? from : booking.endDate };
  }
  if (booking.status === "active" || booking.status === "assigned") {
    return { from, to: asOf > from ? asOf : from };
  }
  return { from, to: from };
}

export function validateBookingDates(startDate?: string, endDate?: string) {
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return "Valid start date is required (YYYY-MM-DD).";
  }
  if (endDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return "End date must be YYYY-MM-DD.";
    if (endDate < startDate) return "End date cannot be before start date.";
  }
  return null;
}

export function validateShiftTimes(
  shift: ShiftKind,
  startTime?: string,
  endTime?: string,
) {
  const start = startTime || defaultShiftTimes(shift).start;
  const end = endTime || defaultShiftTimes(shift).end;
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    return "Shift times must be HH:mm.";
  }
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const preset = SHIFT_PRESETS[shift];
  let duration = endMin - startMin;
  if (duration <= 0) duration += 24 * 60; // crosses midnight
  const hours = duration / 60;
  if (hours < 4 || hours > 26) return "Shift duration must be between 4 and 26 hours.";
  if (shift === "8hr" && (hours < 6 || hours > 10)) {
    return "8-hour shift duration should be about 6–10 hours.";
  }
  if (shift === "12hr" && (hours < 10 || hours > 14)) {
    return "12-hour shift duration should be about 10–14 hours.";
  }
  if (shift === "24hr" && (hours < 20 || hours > 26)) {
    return "24-hour shift duration should be about 20–26 hours.";
  }
  if (!preset) return "Unknown shift type.";
  return null;
}

function minutesOnDay(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Half-open [start, end) intervals in minutes from day start; may include next-day spill. */
export function shiftIntervalsForDay(
  booking: Pick<Booking, "shift" | "shiftStartTime" | "shiftEndTime">,
  day: string,
) {
  const { start, end } = resolveShiftTimes(booking);
  const s = minutesOnDay(start);
  const e = minutesOnDay(end);
  if (e > s) return [{ day, startMin: s, endMin: e }];
  // crosses midnight → remainder of day + next morning
  return [
    { day, startMin: s, endMin: 24 * 60 },
    { day: format(addDays(parseISO(day), 1), "yyyy-MM-dd"), startMin: 0, endMin: e || 24 * 60 },
  ];
}

function intervalsOverlap(
  a: { day: string; startMin: number; endMin: number },
  b: { day: string; startMin: number; endMin: number },
) {
  if (a.day !== b.day) return false;
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

export function bookingsOverlapOnDuty(a: Booking, b: Booking, asOf = todayISO()) {
  const spanA = bookingDateSpan(a, asOf);
  const spanB = bookingDateSpan(b, asOf);
  if (spanA.to < spanB.from || spanB.to < spanA.from) return false;

  const from = spanA.from > spanB.from ? spanA.from : spanB.from;
  const to = spanA.to < spanB.to ? spanA.to : spanB.to;
  const days = eachDayOfInterval({ start: parseISO(from), end: parseISO(to) });
  for (const d of days) {
    const day = format(d, "yyyy-MM-dd");
    const ia = shiftIntervalsForDay(a, day);
    const ib = shiftIntervalsForDay(b, day);
    for (const x of ia) {
      for (const y of ib) {
        if (intervalsOverlap(x, y)) return true;
      }
    }
  }
  return false;
}

export type ScheduleConflict = {
  type: "overlap" | "leave" | "unavailable" | "dates" | "shift";
  message: string;
  bookingId?: string;
  leaveId?: string;
};

export function findAssignmentConflicts(input: {
  staffId: string;
  booking: Booking;
  bookings: Booking[];
  leaves: LeaveRequest[];
  availability?: NurseAvailability[];
  asOf?: string;
}): ScheduleConflict[] {
  const { staffId, booking, bookings, leaves, availability = [], asOf = todayISO() } = input;
  const conflicts: ScheduleConflict[] = [];

  const dateErr = validateBookingDates(booking.startDate, booking.endDate);
  if (dateErr) conflicts.push({ type: "dates", message: dateErr });

  const shiftErr = validateShiftTimes(booking.shift, booking.shiftStartTime, booking.shiftEndTime);
  if (shiftErr) conflicts.push({ type: "shift", message: shiftErr });

  const span = bookingDateSpan(booking, asOf);

  for (const leave of leaves) {
    if (leave.staffId !== staffId || leave.status !== "approved") continue;
    if (leave.toDate < span.from || leave.fromDate > span.to) continue;
    conflicts.push({
      type: "leave",
      leaveId: leave.id,
      message: `Approved leave ${leave.fromDate} → ${leave.toDate} overlaps this duty.`,
    });
  }

  for (const block of availability) {
    if (block.staffId !== staffId || block.status !== "unavailable") continue;
    if (block.date < span.from || block.date > span.to) continue;
    conflicts.push({
      type: "unavailable",
      message: `Nurse marked unavailable on ${block.date}${block.note ? ` (${block.note})` : ""}.`,
    });
  }

  for (const other of bookings) {
    if (other.id === booking.id) continue;
    if (other.assignedStaffId !== staffId) continue;
    if (other.status === "completed" || other.status === "cancelled") continue;
    if (!bookingsOverlapOnDuty(booking, other, asOf)) continue;
    const otherSpan = other.endDate
      ? `${other.startDate}→${other.endDate}`
      : `${other.startDate}→ongoing`;
    conflicts.push({
      type: "overlap",
      bookingId: other.id,
      message: `Overlaps duty ${other.id} · ${other.patientName} (${other.shift}, ${otherSpan}). End or reassign that booking, pick another nurse, or save anyway.`,
    });
  }

  return conflicts;
}

export function bookingTouchesDay(booking: Booking, day: string, asOf = todayISO()) {
  const span = bookingDateSpan(booking, asOf);
  return day >= span.from && day <= span.to;
}

export function bookingsForDay(bookings: Booking[], day: string, asOf = todayISO()) {
  return bookings.filter((b) => bookingTouchesDay(b, day, asOf));
}

export type NurseDayStatus = "available" | "on-duty" | "leave" | "unavailable" | "off-roster";

export function nurseStatusOnDay(input: {
  staff: Staff;
  day: string;
  bookings: Booking[];
  leaves: LeaveRequest[];
  availability?: NurseAvailability[];
  asOf?: string;
}): { status: NurseDayStatus; duties: Booking[]; leave?: LeaveRequest; note?: string } {
  const { staff, day, bookings, leaves, availability = [], asOf = todayISO() } = input;
  const leave = leaves.find(
    (l) =>
      l.staffId === staff.id &&
      l.status === "approved" &&
      day >= l.fromDate &&
      day <= l.toDate,
  );
  if (leave) return { status: "leave", duties: [], leave };

  const block = availability.find((a) => a.staffId === staff.id && a.date === day);
  if (block?.status === "unavailable") {
    return { status: "unavailable", duties: [], note: block.note };
  }

  const duties = bookings.filter(
    (b) =>
      b.assignedStaffId === staff.id &&
      b.status !== "cancelled" &&
      b.status !== "completed" &&
      bookingTouchesDay(b, day, asOf),
  );
  if (duties.length) return { status: "on-duty", duties };

  if (staff.status === "leave") return { status: "leave", duties: [] };
  return { status: "available", duties: [], note: block?.note };
}

export function dailyWorkload(
  bookings: Booking[],
  day: string,
  asOf = todayISO(),
) {
  const dayBookings = bookingsForDay(bookings, day, asOf).filter(
    (b) => b.status !== "cancelled",
  );
  const assigned = dayBookings.filter((b) => b.assignedStaffId);
  const unassigned = dayBookings.filter((b) => !b.assignedStaffId && b.status !== "completed");
  const byShift = { "8hr": 0, "12hr": 0, "24hr": 0 } as Record<ShiftKind, number>;
  for (const b of dayBookings) byShift[b.shift] = (byShift[b.shift] || 0) + 1;
  return {
    total: dayBookings.length,
    assigned: assigned.length,
    unassigned: unassigned.length,
    byShift,
    bookings: dayBookings,
  };
}

export function calendarRange(mode: "day" | "week" | "month", anchor: Date) {
  if (mode === "day") {
    const d = startOfDay(anchor);
    return { from: d, to: endOfDay(anchor), days: [d] };
  }
  if (mode === "week") {
    const from = startOfWeek(anchor, { weekStartsOn: 1 });
    const to = endOfWeek(anchor, { weekStartsOn: 1 });
    return { from, to, days: eachDayOfInterval({ start: from, end: to }) };
  }
  const from = startOfMonth(anchor);
  const to = endOfMonth(anchor);
  const gridStart = startOfWeek(from, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(to, { weekStartsOn: 1 });
  return {
    from,
    to,
    days: eachDayOfInterval({ start: gridStart, end: gridEnd }),
  };
}

export function isDateInRange(day: string, from: string, to: string) {
  return day >= from && day <= to;
}

export function formatShiftLabel(booking: Pick<Booking, "shift" | "shiftStartTime" | "shiftEndTime">) {
  const t = resolveShiftTimes(booking);
  return `${SHIFT_PRESETS[booking.shift].label} · ${t.start}–${t.end}`;
}

export function dayInIntervalISO(day: string, start: Date, end: Date) {
  const d = parseISO(day);
  return isWithinInterval(d, { start: startOfDay(start), end: endOfDay(end) });
}
