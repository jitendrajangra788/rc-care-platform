"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { SalaryPayout, Staff } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel, StatCard } from "@/components/dashboard/DashboardShell";

type StaffPay = Pick<
  Staff,
  "id" | "name" | "role" | "salaryMonthly" | "salaryPerShift" | "shiftsCompleted"
>;

export function PayrollPanel({
  payouts,
  staff,
}: {
  payouts: SalaryPayout[];
  staff: StaffPay[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "earned" | "paid">("all");

  const earned = payouts.filter((p) => p.status === "earned");
  const paid = payouts.filter((p) => p.status === "paid");
  const earnedTotal = earned.reduce((s, p) => s + p.amount, 0);
  const paidTotal = paid.reduce((s, p) => s + p.amount, 0);

  const filtered = useMemo(() => {
    return payouts.filter((p) => {
      const member = staff.find((s) => s.id === p.staffId);
      const q = query.trim().toLowerCase();
      const matchQ =
        !q ||
        (member?.name || "").toLowerCase().includes(q) ||
        p.patientName.toLowerCase().includes(q) ||
        p.bookingId.toLowerCase().includes(q) ||
        p.dutyDate.includes(q);
      const matchS = status === "all" || p.status === status;
      return matchQ && matchS;
    });
  }, [payouts, staff, query, status]);

  async function markPaid(id: string) {
    setBusy(id);
    const res = await fetch("/api/payroll", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "paid" }),
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json();
      toast.error("Update failed", data.error);
      return;
    }
    toast.success("Salary marked paid successfully");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="dash-grid-stats cols-3">
        <StatCard label="Earned (unpaid)" value={formatINR(earnedTotal)} tone="warning" />
        <StatCard label="Paid out" value={formatINR(paidTotal)} tone="success" />
        <StatCard label="Completed duties" value={String(payouts.length)} />
      </div>

      <Panel title="Staff salary rates" subtitle="Monthly and per-shift rates used for duty payouts.">
        {staff.length === 0 ? (
          <EmptyState title="No staff rates" description="Add staff to configure salary." />
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--line)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-paper-2/80 text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Staff</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Monthly</th>
                  <th className="px-4 py-3 font-semibold">Per shift</th>
                  <th className="px-4 py-3 font-semibold">Shifts done</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-t border-[var(--line)]">
                    <td className="font-name px-4 py-3.5 text-heading">{s.name}</td>
                    <td className="px-4 py-3.5 capitalize">{s.role}</td>
                    <td className="px-4 py-3.5">{formatINR(s.salaryMonthly || 0)}</td>
                    <td className="px-4 py-3.5 font-semibold text-heading">
                      {formatINR(s.salaryPerShift || 0)}
                    </td>
                    <td className="px-4 py-3.5">{s.shiftsCompleted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="Duty payouts"
        subtitle="Morning + evening complete hone pe automatic earn entry banti hai."
      >
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="field field-with-icon"
              placeholder="Search staff, patient, booking, date…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {(["all", "earned", "paid"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={status === s ? "btn btn-primary btn-sm capitalize" : "btn btn-outline btn-sm capitalize"}
            >
              {s}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No payouts yet"
            description="Complete morning and evening attendance to unlock duty earnings."
          />
        ) : (
          <div className="space-y-1.5">
            {filtered.map((p) => {
              const member = staff.find((s) => s.id === p.staffId);
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-xl)] border border-[var(--line)] bg-surface px-4 py-2"
                >
                  <div>
                    <p className="font-name text-heading">{member?.name || p.staffId}</p>
                    <p className="mt-1 text-sm text-muted">
                      {p.patientName} · {p.bookingId} · {p.dutyDate}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-heading">{formatINR(p.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={p.status === "paid" ? "success" : "warning"}>{p.status}</Badge>
                    {p.status === "earned" ? (
                      <Button
                        size="sm"
                        disabled={busy === p.id}
                        onClick={() => markPaid(p.id)}
                      >
                        Mark paid
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
