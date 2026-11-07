import { addDays, format, parseISO, startOfWeek } from "date-fns";
import type { Booking, LeaveRequest, NurseAvailability, Staff } from "@/lib/types";
import {
  SHIFT_PRESETS,
  bookingTouchesDay,
  findAssignmentConflicts,
  resolveShiftTimes,
  todayISO,
} from "@/lib/schedule";
import type { StatusFilter } from "./types";

export function shortPatientName(name: string, max = 14) {
  const s = String(name || "").trim();
  if (!s) return "—";
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/** Shift block colors: morning/8hr amber, evening/12hr info, night indigo, 24h teal. */
export function shiftBlockClass(booking: Pick<Booking, "shift" | "shiftStartTime" | "shiftEndTime">) {
  if (booking.shift === "24hr") {
    return "bg-[var(--primary-soft)] text-primary border-[color-mix(in_srgb,var(--primary)_35%,transparent)]";
  }
  const { start } = resolveShiftTimes(booking);
  const hour = Number(start.slice(0, 2));
  if (booking.shift === "8hr" || (hour >= 5 && hour < 12)) {
    return "bg-[var(--warning-soft)] text-[color-mix(in_srgb,var(--warning)_85%,var(--heading))] border-[color-mix(in_srgb,var(--warning)_30%,transparent)]";
  }
  if (hour >= 18 || hour < 5) {
    return "bg-[color-mix(in_srgb,var(--info)_18%,transparent)] text-[var(--info)] border-[color-mix(in_srgb,var(--info)_35%,transparent)]";
  }
  return "bg-[var(--info-soft)] text-[var(--info)] border-[color-mix(in_srgb,var(--info)_30%,transparent)]";
}

export function statusDotClass(status: Booking["status"]) {
  switch (status) {
    case "active":
      return "bg-[var(--success)]";
    case "assigned":
      return "bg-[var(--primary)]";
    case "pending":
      return "bg-[var(--warning)]";
    case "cancelled":
      return "bg-[var(--danger)]";
    default:
      return "bg-[var(--muted)]";
  }
}

export function weekStartISO(day: string) {
  const d = parseISO(day + "T12:00:00");
  return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function weekDayISOs(anchorDay: string) {
  const start = weekStartISO(anchorDay);
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(parseISO(start + "T12:00:00"), i), "yyyy-MM-dd"),
  );
}

/** Sum SHIFT_PRESETS hours for duties that touch each day in the week. */
export function weeklyHoursForNurse(
  staffId: string,
  weekDays: string[],
  bookings: Booking[],
  asOf = todayISO(),
) {
  let hours = 0;
  for (const day of weekDays) {
    for (const b of bookings) {
      if (b.assignedStaffId !== staffId) continue;
      if (b.status === "cancelled" || b.status === "completed") continue;
      if (!bookingTouchesDay(b, day, asOf)) continue;
      hours += SHIFT_PRESETS[b.shift]?.hours ?? 0;
    }
  }
  return hours;
}

export function hoursOnDay(
  staffId: string,
  day: string,
  bookings: Booking[],
  asOf = todayISO(),
) {
  let hours = 0;
  for (const b of bookings) {
    if (b.assignedStaffId !== staffId) continue;
    if (b.status === "cancelled" || b.status === "completed") continue;
    if (!bookingTouchesDay(b, day, asOf)) continue;
    hours += SHIFT_PRESETS[b.shift]?.hours ?? 0;
  }
  return hours;
}

export function dutyHasConflict(
  booking: Booking,
  bookings: Booking[],
  leaves: LeaveRequest[],
  availability: NurseAvailability[],
  asOf = todayISO(),
) {
  if (!booking.assignedStaffId) return false;
  return (
    findAssignmentConflicts({
      staffId: booking.assignedStaffId,
      booking,
      bookings,
      leaves,
      availability,
      asOf,
    }).length > 0
  );
}

export function countDayConflicts(
  dayBookings: Booking[],
  bookings: Booking[],
  leaves: LeaveRequest[],
  availability: NurseAvailability[],
  asOf = todayISO(),
) {
  return dayBookings.filter(
    (b) =>
      !!b.assignedStaffId &&
      dutyHasConflict(b, bookings, leaves, availability, asOf),
  ).length;
}

export function filterBookings(
  bookings: Booking[],
  staff: Staff[],
  opts: {
    query: string;
    nurseFilter: string;
    statusFilter: StatusFilter;
    unassignedOnly: boolean;
  },
) {
  const q = opts.query.trim().toLowerCase();
  return bookings.filter((b) => {
    if (opts.unassignedOnly || opts.statusFilter === "unassigned") {
      if (b.assignedStaffId || b.status === "completed" || b.status === "cancelled") {
        return false;
      }
    } else if (opts.statusFilter && b.status !== opts.statusFilter) {
      return false;
    }
    if (opts.nurseFilter && b.assignedStaffId !== opts.nurseFilter) return false;
    if (!q) return true;
    const nurseName = staff.find((s) => s.id === b.assignedStaffId)?.name || "";
    return (
      b.patientName.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      b.area.toLowerCase().includes(q) ||
      nurseName.toLowerCase().includes(q)
    );
  });
}

export function smartReplaceCandidates(input: {
  booking: Booking;
  staff: Staff[];
  bookings: Booking[];
  leaves: LeaveRequest[];
  availability: NurseAvailability[];
  asOf?: string;
}) {
  const { booking, staff, bookings, leaves, availability, asOf = todayISO() } = input;
  const weekDays = weekDayISOs(booking.startDate);
  return staff
    .filter((s) => s.id !== booking.assignedStaffId)
    .map((s) => {
      const conflicts = findAssignmentConflicts({
        staffId: s.id,
        booking,
        bookings,
        leaves,
        availability,
        asOf,
      });
      return {
        staff: s,
        conflicts,
        sameArea: s.area?.toLowerCase() === booking.area?.toLowerCase(),
        weekHours: weeklyHoursForNurse(s.id, weekDays, bookings, asOf),
      };
    })
    .filter((r) => r.conflicts.length === 0)
    .sort((a, b) => {
      if (a.sameArea !== b.sameArea) return a.sameArea ? -1 : 1;
      return a.weekHours - b.weekHours;
    });
}

export function cellDropId(staffId: string, day: string) {
  return `cell:${staffId}:${day}`;
}

export function parseCellDropId(id: string) {
  if (!id.startsWith("cell:")) return null;
  const parts = id.split(":");
  if (parts.length < 3) return null;
  return { staffId: parts[1], day: parts.slice(2).join(":") };
}

export function bookingDragId(bookingId: string) {
  return `booking:${bookingId}`;
}

export function parseBookingDragId(id: string) {
  if (!id.startsWith("booking:")) return null;
  return id.slice("booking:".length);
}

/** Absolute % placement for a shift within a 0–24h day bar. */
export function shiftDayPercent(booking: Pick<Booking, "shift" | "shiftStartTime" | "shiftEndTime">) {
  const { start, end } = resolveShiftTimes(booking);
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const s = toMin(start);
  let e = toMin(end);
  if (e <= s) e = 24 * 60;
  const left = (s / (24 * 60)) * 100;
  const width = ((e - s) / (24 * 60)) * 100;
  return { left, width: Math.max(width, 2) };
}

export const HATCH_UNAVAILABLE =
  "bg-[repeating-linear-gradient(-45deg,var(--surface-muted),var(--surface-muted)_6px,transparent_6px,transparent_12px)]";
