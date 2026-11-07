import { normalizeSlot } from "./duty";
import type { Attendance, SalaryPayout } from "./types";

export type DayPresence = {
  date: string;
  morning: boolean;
  evening: boolean;
  complete: boolean;
  bookingIds: string[];
};

export function staffAttendanceStats(
  attendance: Attendance[],
  staffId: string,
  monthPrefix?: string,
) {
  const rows = attendance.filter((a) => {
    if (a.staffId !== staffId) return false;
    if (!monthPrefix) return true;
    const d = a.dutyDate || a.createdAt.slice(0, 10);
    return d.startsWith(monthPrefix);
  });

  let morning = 0;
  let evening = 0;
  const byDay = new Map<string, { morning: boolean; evening: boolean; bookingIds: Set<string> }>();

  for (const a of rows) {
    const slot = normalizeSlot(a.type);
    if (!slot) continue;
    const date = a.dutyDate || a.createdAt.slice(0, 10);
    if (slot === "morning") morning += 1;
    if (slot === "evening") evening += 1;
    const cur = byDay.get(date) || {
      morning: false,
      evening: false,
      bookingIds: new Set<string>(),
    };
    if (slot === "morning") cur.morning = true;
    if (slot === "evening") cur.evening = true;
    cur.bookingIds.add(a.bookingId);
    byDay.set(date, cur);
  }

  const days: DayPresence[] = [...byDay.entries()]
    .map(([date, v]) => ({
      date,
      morning: v.morning,
      evening: v.evening,
      complete: v.morning && v.evening,
      bookingIds: [...v.bookingIds],
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const completeDays = days.filter((d) => d.complete).length;

  return {
    totalMarks: rows.length,
    morningCount: morning,
    eveningCount: evening,
    completeDays,
    presentDays: days.length,
    days,
  };
}

export function staffSalaryStats(payouts: SalaryPayout[], staffId: string, monthPrefix?: string) {
  const rows = payouts.filter((p) => {
    if (p.staffId !== staffId) return false;
    if (!monthPrefix) return true;
    return (p.dutyDate || p.createdAt.slice(0, 10)).startsWith(monthPrefix);
  });
  const earned = rows.reduce((s, p) => s + (p.amount || 0), 0);
  const paid = rows.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const pending = earned - paid;
  return { earned, paid, pending, count: rows.length, rows };
}

export function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

export function calendarCells(month: string) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const startPad = first.getUTCDay(); // 0 Sun
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${month}-${String(d).padStart(2, "0")}`);
  }
  return cells;
}
