import { Wallet, CircleDollarSign, Banknote } from "lucide-react";
import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { buildNurseDesk } from "@/lib/nurse-desk";
import { formatINR } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { NurseMobileDock } from "@/components/dashboard/NurseMobileDock";
import { NurseSalaryLists } from "@/components/dashboard/NurseSalaryLists";
import { StatCard } from "@/components/ui/StatCard";

export default async function NurseSalaryPage() {
  await requireRole("nurse");
  const user = await getSession();
  if (!user) return null;
  const db = await readDb();
  const desk = buildNurseDesk(db, user);
  const staff = desk.staff;
  const payouts = (db.salaryPayouts || []).filter((p) => p.staffId === staff?.id);
  const monthly = (db.monthlySalaries || [])
    .filter((s) => s.staffId === staff?.id)
    .sort((a, b) => b.year - a.year || b.month - a.month);
  const earned = payouts.filter((p) => p.status === "earned").reduce((s, p) => s + p.amount, 0);
  const paidShift = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="dash-stack pb-20 md:pb-0">
      <PageHeader
        eyebrow="Nurse ops · Payroll"
        title="My salary"
        subtitle="Shift earnings, unpaid balance, and monthly slips processed by admin."
      />

      <div className="dash-grid-stats cols-3">
        <StatCard
          label="Per shift rate"
          value={formatINR(staff?.salaryPerShift || 0)}
          tone="primary"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Earned (unpaid)"
          value={formatINR(earned)}
          tone="warning"
          icon={<CircleDollarSign className="h-4 w-4" />}
          hint={`This month ${formatINR(desk.monthEarned)}`}
        />
        <StatCard
          label="Paid shifts"
          value={formatINR(paidShift)}
          tone="success"
          icon={<Banknote className="h-4 w-4" />}
          hint={`Month paid ${formatINR(desk.monthPaid)}`}
        />
      </div>

      <NurseSalaryLists monthly={monthly} payouts={payouts} />
      <NurseMobileDock />
    </div>
  );
}
