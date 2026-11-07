import type { Attendance, AttendanceSlot } from "./types";

export function todayDutyDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function normalizeSlot(type: Attendance["type"]): AttendanceSlot | null {
  if (type === "morning" || type === "present") return "morning";
  if (type === "evening" || type === "checkout") return "evening";
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
) {
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
