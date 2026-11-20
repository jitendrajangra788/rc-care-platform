import type { Attendance, AttendanceSlot, Booking } from "./types";

export function isSingleShift(shift?: Booking["shift"]) {
  return shift === "Morning" || shift === "Night" || shift === "Visit";
}

export function slotForShift(shift?: Booking["shift"]): AttendanceSlot | null {
  if (shift === "Morning") return "morning";
  if (shift === "Night") return "night";
  if (shift === "Visit") return "visit";
  return null;
}

export function todayDutyDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function normalizeSlot(type: Attendance["type"]): AttendanceSlot | null {
  if (type === "morning" || type === "present") return "morning";
  if (type === "evening" || type === "checkout") return "evening";
  if (type === "night" || type === "visit") return type;
  return null;
}

export function slotForDay(
  records: Attendance[],
  bookingId: string,
  dutyDate: string,
  slot: AttendanceSlot,
) {
  return records.find((a) => {
    const s = normalizeSlot(a.type);
    const date = a.dutyDate || a.createdAt.slice(0, 10);
    return a.bookingId === bookingId && date === dutyDate && s === slot;
  });
}

export function dutyProgress(
  records: Attendance[],
  bookingId: string,
  dutyDate: string,
  shift?: Booking["shift"],
) {
  const single = slotForShift(shift);
  if (single) {
    const mark = slotForDay(records, bookingId, dutyDate, single);
    const done = Boolean(mark);
    return {
      morning: single === "morning" ? mark : undefined,
      evening: undefined,
      morningDone: done,
      eveningDone: done,
      complete: done,
      nextSlot: (done ? null : single) as AttendanceSlot | null,
    };
  }

  const morning = slotForDay(records, bookingId, dutyDate, "morning");
  const evening = slotForDay(records, bookingId, dutyDate, "evening");
  return {
    morning,
    evening,
    morningDone: Boolean(morning),
    eveningDone: Boolean(evening),
    complete: Boolean(morning && evening),
    nextSlot: (!morning ? "morning" : !evening ? "evening" : null) as AttendanceSlot | null,
  };
}
