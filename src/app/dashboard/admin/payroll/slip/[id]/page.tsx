import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";
import { formatINR } from "@/lib/utils";
import { SalarySlipPrint } from "@/components/dashboard/SalarySlipPrint";

export default async function AdminSalarySlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const salary = (db.monthlySalaries || []).find((s) => s.id === id);
  if (!salary) notFound();
  const staff = db.staff.find((s) => s.id === salary.staffId);

  return (
    <SalarySlipPrint
      org="Roshan Care"
      staffName={staff?.name || salary.staffId}
      staffRole={staff?.role || "Staff"}
      phone={staff?.phone}
      salary={salary}
      netLabel={formatINR(salary.netSalary)}
      basicLabel={formatINR(salary.basicSalary)}
      deductionsLabel={formatINR(salary.deductions)}
      bonusLabel={formatINR(salary.bonus)}
    />
  );
}
