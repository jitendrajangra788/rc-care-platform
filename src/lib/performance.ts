import type { Attendance, DbShape, Staff } from "./types";
import { normalizeSlot } from "./duty";

export function computeStaffPerformance(db: DbShape, staffId: string) {
  const mine = db.attendance.filter((a) => a.staffId === staffId);
  const byDate = new Map<string, { morning?: Attendance; evening?: Attendance }>();
  for (const a of mine) {
    const date = a.dutyDate || a.createdAt.slice(0, 10);
    const key = `${a.bookingId}:${date}`;
    const slot = normalizeSlot(a.type);
    if (!slot) continue;
    const cur = byDate.get(key) || {};
    if (slot === "morning") cur.morning = a;
    if (slot === "evening") cur.evening = a;
    byDate.set(key, cur);
  }
  const days = [...byDate.values()];
  const complete = days.filter((d) => d.morning && d.evening).length;
  const onTimeMorning = days.filter((d) => {
    if (!d.morning) return false;
    const h = new Date(d.morning.createdAt).getHours();
    return h <= 11;
  }).length;
  const score =
    days.length === 0
      ? 80
      : Math.round(
          (complete / Math.max(days.length, 1)) * 60 +
            (onTimeMorning / Math.max(days.length, 1)) * 40,
        );
  return {
    dutyDays: days.length,
    completeDays: complete,
    onTimeMorning,
    score: Math.min(100, Math.max(40, score)),
  };
}

export function refreshAllPerformance(db: DbShape) {
  db.staff = db.staff.map((s: Staff) => ({
    ...s,
    performanceScore: computeStaffPerformance(db, s.id).score,
  }));
}
