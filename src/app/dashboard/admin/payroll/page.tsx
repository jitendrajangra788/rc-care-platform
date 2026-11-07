import { readDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PayrollPanel } from "@/components/dashboard/PayrollPanel";
import { MonthlySalaryPanel } from "@/components/dashboard/MonthlySalaryPanel";

export default async function AdminPayrollPage() {
  const db = await readDb();
  const now = new Date();

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Finance"
        title="Staff salary & payroll"
        subtitle="Per-shift duty payouts plus monthly Process / Slip — same as old salary module."
      />
      <MonthlySalaryPanel
        salaries={db.monthlySalaries || []}
        staff={db.staff.map((s) => ({
          id: s.id,
          name: s.name,
          role: s.role,
          salaryMonthly: s.salaryMonthly,
        }))}
        initialMonth={now.getMonth() + 1}
        initialYear={now.getFullYear()}
      />
      <PayrollPanel
        payouts={db.salaryPayouts || []}
        staff={db.staff.map((s) => ({
          id: s.id,
          name: s.name,
          role: s.role,
          salaryMonthly: s.salaryMonthly,
          salaryPerShift: s.salaryPerShift,
          shiftsCompleted: s.shiftsCompleted,
        }))}
      />
    </div>
  );
}
