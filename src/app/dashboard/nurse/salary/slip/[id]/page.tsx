import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { staffForUser } from "@/lib/scope";
import { formatINR } from "@/lib/utils";
import { SalarySlipPrint } from "@/components/dashboard/SalarySlipPrint";

export default async function NurseSalarySlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("nurse");
  const user = await getSession();
  if (!user) return null;
  const { id } = await params;
  const db = await readDb();
  const staff = staffForUser(db, user);
  const salary = (db.monthlySalaries || []).find((s) => s.id === id);
  if (!salary || !staff || salary.staffId !== staff.id) notFound();

  return (
    <div className="dash-stack">
      <div className="print:hidden">
        <Link href="/dashboard/nurse/salary" className="btn btn-outline btn-sm">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to salary
        </Link>
      </div>
      <SalarySlipPrint
        org="Roshan Care"
        staffName={staff.name}
        staffRole={staff.role}
        phone={staff.phone}
        salary={salary}
        netLabel={formatINR(salary.netSalary)}
        basicLabel={formatINR(salary.basicSalary)}
        deductionsLabel={formatINR(salary.deductions)}
        bonusLabel={formatINR(salary.bonus)}
      />
    </div>
  );
}
