"use client";

import type { MonthlySalary } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function SalarySlipPrint({
  org,
  staffName,
  staffRole,
  phone,
  salary,
  netLabel,
  basicLabel,
  deductionsLabel,
  bonusLabel,
}: {
  org: string;
  staffName: string;
  staffRole: string;
  phone?: string;
  salary: MonthlySalary;
  netLabel: string;
  basicLabel: string;
  deductionsLabel: string;
  bonusLabel: string;
}) {
  const monthName = new Date(salary.year, salary.month - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-paper px-4 py-3 print:bg-white print:p-0">
      <div className="mx-auto mb-1.5 flex max-w-2xl justify-end gap-2 print:hidden">
        <Button onClick={() => window.print()}>Print / Save PDF</Button>
      </div>
      <article className="mx-auto max-w-2xl rounded-[var(--radius-xl)] border border-[var(--line)] bg-surface p-3 shadow-sm print:border-0 print:shadow-none">
        <header className="border-b border-[var(--line)] pb-4">
          <p className="text-label text-primary">{org}</p>
          <h1 className="font-display mt-2 text-3xl text-heading">Salary Slip</h1>
          <p className="mt-1 text-sm text-muted">{monthName}</p>
        </header>
        <div className="mt-6 grid gap-2 sm:grid-cols-2 text-sm">
          <p>
            <span className="text-muted">Employee</span>
            <br />
            <strong className="font-name text-heading">{staffName}</strong>
          </p>
          <p>
            <span className="text-muted">Role</span>
            <br />
            <strong>{staffRole}</strong>
          </p>
          {phone ? (
            <p>
              <span className="text-muted">Phone</span>
              <br />
              <strong>{phone}</strong>
            </p>
          ) : null}
          <p>
            <span className="text-muted">Status</span>
            <br />
            <strong className="uppercase">{salary.status}</strong>
          </p>
        </div>
        <table className="mt-8 w-full text-sm">
          <tbody>
            <Row label="Working days" value={String(salary.workingDays)} />
            <Row label="Present days" value={String(salary.presentDays)} />
            <Row label="Absent days" value={String(salary.absentDays)} />
            <Row label="Late / half days" value={`${salary.lateDays} / ${salary.halfDays}`} />
            <Row label="Basic salary" value={basicLabel} />
            <Row label="Deductions" value={deductionsLabel} />
            <Row label="Bonus" value={bonusLabel} />
            <tr className="border-t-2 border-[var(--line)]">
              <td className="py-3 font-semibold text-heading">Net salary</td>
              <td className="py-3 text-right text-lg font-semibold text-primary">{netLabel}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-8 text-xs text-muted">
          Slip ID {salary.id} · Generated {new Date().toLocaleString("en-IN")}
        </p>
      </article>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-t border-[var(--line)]">
      <td className="py-2.5 text-muted">{label}</td>
      <td className="py-2.5 text-right font-medium text-heading">{value}</td>
    </tr>
  );
}
