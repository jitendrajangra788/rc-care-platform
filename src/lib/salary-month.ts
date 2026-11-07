import {
  dailyAttendanceForMonth,
  LATE_DAY_DEDUCTION_INR,
} from "@/lib/attendance-rules";
import type { Attendance, MonthlySalary, Staff } from "./types";

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

/** Count unique duty dates with at least one attendance mark for a staff member. */
export function presentDaysForMonth(
  attendance: Attendance[],
  staffId: string,
  year: number,
  month: number,
) {
  return dailyAttendanceForMonth(attendance, staffId, year, month).length;
}

/**
 * Monthly salary — old HCMS parity:
 * perDay × sum(salary_multiplier) − (late_days × ₹50)
 */
export function buildMonthlySalary(
  staff: Staff,
  attendance: Attendance[],
  year: number,
  month: number,
  opts?: { deductions?: number; bonus?: number },
): Omit<MonthlySalary, "id" | "createdAt"> {
  const workingDays = daysInMonth(year, month);
  const days = dailyAttendanceForMonth(attendance, staff.id, year, month);
  const presentDays = days.filter((d) => d.status === "present").length;
  const lateDays = days.filter((d) => d.status === "late").length;
  const halfDays = days.filter((d) => d.status === "half-day").length;
  const salaryDays = days.length;
  const absentDays = Math.max(0, workingDays - salaryDays);

  const basic = staff.salaryMonthly || staff.salaryPerShift * 26;
  const perDay = workingDays > 0 ? basic / workingDays : 0;
  const totalMultiplier = days.reduce((s, d) => s + d.salaryMultiplier, 0);
  const calculated = perDay * (totalMultiplier || 0);
  const lateDeductions = lateDays * LATE_DAY_DEDUCTION_INR;
  const autoDeductions = Math.max(0, basic - calculated) + lateDeductions;
  const deductions =
    opts?.deductions !== undefined ? opts.deductions : Math.round(autoDeductions * 100) / 100;
  const bonus = opts?.bonus ?? 0;
  const netFromMultipliers = Math.max(0, calculated - lateDeductions + bonus);
  const net =
    opts?.deductions !== undefined
      ? Math.max(0, Math.round((basic - deductions + bonus) * 100) / 100)
      : Math.round(netFromMultipliers * 100) / 100;

  return {
    staffId: staff.id,
    month,
    year,
    workingDays,
    presentDays: presentDays + lateDays + halfDays,
    absentDays,
    lateDays,
    halfDays,
    basicSalary: Math.round(basic * 100) / 100,
    deductions,
    bonus,
    netSalary: net,
    status: "pending",
  };
}
