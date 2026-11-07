"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import type { MonthlySalary, Staff } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/dashboard/DashboardShell";

type StaffLite = Pick<Staff, "id" | "name" | "role" | "salaryMonthly">;

export function MonthlySalaryPanel({
  salaries,
  staff,
  initialMonth,
  initialYear,
}: {
  salaries: MonthlySalary[];
  staff: StaffLite[];
  initialMonth: number;
  initialYear: number;
}) {
  const router = useRouter();
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(
    () => salaries.filter((s) => s.month === month && s.year === year),
    [salaries, month, year],
  );

  async function processMonth() {
    setBusy(true);
    const res = await fetch("/api/salary/monthly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year }),
    });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error("Process failed", data.error);
      return;
    }
    toast.success("Monthly salary processed", `${data.salaries?.length || 0} staff`);
    router.refresh();
  }

  async function markPaid(id: string) {
    setBusy(true);
    const res = await fetch("/api/salary/monthly", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "paid" }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error("Update failed", data.error);
      return;
    }
    toast.success("Salary marked paid");
    router.refresh();
  }

  function openSlip(id: string) {
    window.open(`/dashboard/admin/payroll/slip/${id}`, "_blank", "noopener,noreferrer");
  }

  return (
    <Panel
      title="Monthly salary (Process + Slip)"
      subtitle="Old PHP Process.php / Slip.php — attendance-based monthly net pay."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="field !w-auto !py-2"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1, 1).toLocaleString("en", { month: "short" })}
              </option>
            ))}
          </select>
          <input
            className="field !w-24 !py-2"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
          <Button size="sm" onClick={processMonth} loading={busy} disabled={busy}>
            Process month
          </Button>
        </div>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          title="No salary rows for this month"
          description="Click Process month to generate slips from attendance."
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--line)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-paper-2/80 text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Staff</th>
                <th className="px-4 py-3 font-semibold">Present</th>
                <th className="px-4 py-3 font-semibold">Absent</th>
                <th className="px-4 py-3 font-semibold">Basic</th>
                <th className="px-4 py-3 font-semibold">Net</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const member = staff.find((s) => s.id === r.staffId);
                return (
                  <tr key={r.id} className="border-t border-[var(--line)]">
                    <td className="font-name px-4 py-3.5 text-heading">
                      {member?.name || r.staffId}
                    </td>
                    <td className="px-4 py-3.5">
                      {r.presentDays}/{r.workingDays}
                    </td>
                    <td className="px-4 py-3.5">{r.absentDays}</td>
                    <td className="px-4 py-3.5">{formatINR(r.basicSalary)}</td>
                    <td className="px-4 py-3.5 font-semibold">{formatINR(r.netSalary)}</td>
                    <td className="px-4 py-3.5">
                      <Badge tone={r.status === "paid" ? "success" : "warning"}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => openSlip(r.id)}>
                          <Printer className="h-3.5 w-3.5" /> Slip
                        </Button>
                        {r.status !== "paid" ? (
                          <Button size="sm" disabled={busy} onClick={() => markPaid(r.id)}>
                            Mark paid
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
