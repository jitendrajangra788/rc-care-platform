import type { Attendance, AttendanceSlot, Booking } from "@/lib/types";
import { resolveShiftTimes } from "@/lib/schedule";

/** Old Roshan_HCMS parity constants */
export const EARLY_CHECKIN_MINUTES = 15;
export const GRACE_MINUTES = 10;
export const LATE_UNTIL_MINUTES = 30;
export const LATE_DAY_DEDUCTION_INR = 50;

export type PunctualityStatus = "present" | "late" | "half-day";

export type CheckInTiming = {
  ok: true;
  status: PunctualityStatus;
  minutesLate: number;
  salaryMultiplier: number;
  expectedAt: Date;
  message: string;
} | {
  ok: false;
  error: string;
  expectedAt?: Date;
};

function parseHmOnDate(dayIso: string, hm: string, now: Date) {
  const [h, m] = hm.split(":").map(Number);
  const d = new Date(now);
  const [y, mo, da] = dayIso.split("-").map(Number);
  d.setFullYear(y, mo - 1, da);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

/** Minutes from midnight for HH:mm */
function minutesOf(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Expected check-in clock for a slot (old shift windows adapted to 8/12/24hr).
 * Morning → shift start; Evening → midpoint (or start+6h), night spill handled.
 */
export function expectedSlotTime(
  booking: Pick<Booking, "shift" | "shiftStartTime" | "shiftEndTime">,
  slot: AttendanceSlot,
  dutyDate: string,
  now = new Date(),
) {
  const { start, end } = resolveShiftTimes(booking);
  if (slot === "morning") {
    return parseHmOnDate(dutyDate, start, now);
  }

  const s = minutesOf(start);
  let e = minutesOf(end);
  if (e <= s) e += 24 * 60; // crosses midnight
  const mid = s + Math.floor((e - s) / 2);
  const midHm = `${String(Math.floor((mid % (24 * 60)) / 60)).padStart(2, "0")}:${String(mid % 60).padStart(2, "0")}`;
  const expected = parseHmOnDate(dutyDate, midHm, now);
  // Midpoint past midnight → next calendar day label still dutyDate morning-based; bump if needed
  if (mid >= 24 * 60) {
    expected.setDate(expected.getDate() + 1);
  }
  return expected;
}

export function baseShiftMultiplier(shift: Booking["shift"] | string) {
  if (shift === "24hr" || shift === "24 Hours") return 2;
  return 1;
}

export function statusMultiplier(status: PunctualityStatus) {
  return status === "half-day" ? 0.5 : 1;
}

export function computeSalaryMultiplier(
  shift: Booking["shift"],
  status: PunctualityStatus,
) {
  return baseShiftMultiplier(shift) * statusMultiplier(status);
}

export function evaluateCheckInTiming(input: {
  booking: Pick<Booking, "shift" | "shiftStartTime" | "shiftEndTime">;
  slot: AttendanceSlot;
  dutyDate: string;
  now?: Date;
  /** Admin desk mark — skip early/late windows */
  skipWindow?: boolean;
}): CheckInTiming {
  const now = input.now || new Date();
  const expectedAt = expectedSlotTime(input.booking, input.slot, input.dutyDate, now);

  if (input.skipWindow) {
    const status: PunctualityStatus = "present";
    const salaryMultiplier = computeSalaryMultiplier(input.booking.shift, status);
    return {
      ok: true,
      status,
      minutesLate: 0,
      salaryMultiplier,
      expectedAt,
      message: "Desk mark · counted as present.",
    };
  }

  const earlyFrom = new Date(expectedAt.getTime() - EARLY_CHECKIN_MINUTES * 60_000);
  if (now < earlyFrom) {
    return {
      ok: false,
      error: `Bahut jaldi ho. Check-in shift se ${EARLY_CHECKIN_MINUTES} minute pehle open hota hai (expected ${expectedAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}).`,
      expectedAt,
    };
  }

  let minutesLate = 0;
  if (now > expectedAt) {
    minutesLate = Math.floor((now.getTime() - expectedAt.getTime()) / 60_000);
  }

  let status: PunctualityStatus = "present";
  if (minutesLate > GRACE_MINUTES && minutesLate <= LATE_UNTIL_MINUTES) {
    status = "late";
  } else if (minutesLate > LATE_UNTIL_MINUTES) {
    status = "half-day";
  }

  const salaryMultiplier = computeSalaryMultiplier(input.booking.shift, status);
  let message = "Attendance marked successfully.";
  if (status === "late") {
    message = `Marked as late. You are ${minutesLate} minutes late.`;
  } else if (status === "half-day") {
    message = `Marked as half day. You are ${minutesLate} minutes late.`;
  } else if (minutesLate > 0) {
    message = `On time (grace). ${minutesLate} min after start — still present.`;
  }

  return {
    ok: true,
    status,
    minutesLate,
    salaryMultiplier,
    expectedAt,
    message,
  };
}

/** One effective day row for monthly salary (prefer morning mark). */
export function dailyAttendanceForMonth(
  attendance: Attendance[],
  staffId: string,
  year: number,
  month: number,
) {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const byDay = new Map<string, Attendance>();
  for (const a of attendance) {
    if (a.staffId !== staffId) continue;
    const d = a.dutyDate || a.createdAt.slice(0, 10);
    if (!d.startsWith(prefix)) continue;
    const prev = byDay.get(d);
    if (!prev) {
      byDay.set(d, a);
      continue;
    }
    // Prefer morning over evening for punctuality / multiplier
    const prevMorning = prev.type === "morning" || prev.type === "present";
    const nextMorning = a.type === "morning" || a.type === "present";
    if (nextMorning && !prevMorning) byDay.set(d, a);
  }
  return Array.from(byDay.entries()).map(([date, a]) => ({
    date,
    status: (a.punctualityStatus || "present") as PunctualityStatus,
    salaryMultiplier:
      typeof a.salaryMultiplier === "number" ? a.salaryMultiplier : 1,
  }));
}

export function punctualityBadgeTone(
  status?: PunctualityStatus | string,
): "success" | "warning" | "danger" | "neutral" {
  if (status === "present") return "success";
  if (status === "late") return "warning";
  if (status === "half-day") return "danger";
  return "neutral";
}
