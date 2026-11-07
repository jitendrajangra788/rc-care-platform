"use client";

import Link from "next/link";
import type { MonthlySalary, SalaryPayout } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { usePagedList } from "@/hooks/usePagedList";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";
import { Pagination } from "@/components/ui/Pagination";
import { Panel } from "@/components/dashboard/DashboardShell";

export function NurseSalaryLists({
  monthly,
  payouts,
}: {
  monthly: MonthlySalary[];
  payouts: SalaryPayout[];
}) {
  const slips = usePagedList(monthly, 6);
  const duties = usePagedList(payouts, 8);

  return (
    <>
      <Panel title="Monthly slips" subtitle="Processed by admin for each month">
        {monthly.length === 0 ? (
          <EmptyState
            title="No monthly slips yet"
            description="When admin processes payroll, your slip will appear here."
          />
        ) : (
          <div className="space-y-1.5">
            {slips.rows.map((s) => (
              <ListTile key={s.id} className="animate-dash-in">
                <ListTileHeader>
                  <div>
                    <p className="font-display text-base text-heading">
                      {new Date(s.year, s.month - 1, 1).toLocaleString("en-IN", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <ListTileMeta>
                      Present {s.presentDays}/{s.workingDays}
                      {s.lateDays ? ` · Late ${s.lateDays}` : ""}
                      {s.halfDays ? ` · Half ${s.halfDays}` : ""}
                      {" · "}Net {formatINR(s.netSalary)}
                    </ListTileMeta>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={s.status === "paid" ? "success" : "warning"}>{s.status}</Badge>
                    <Link
                      href={`/dashboard/nurse/salary/slip/${s.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      View slip
                    </Link>
                  </div>
                </ListTileHeader>
              </ListTile>
            ))}
            <Pagination
              page={slips.page}
              pageCount={slips.pageCount}
              pageSize={slips.pageSize}
              total={monthly.length}
              filteredCount={monthly.length}
              onPageChange={slips.setPage}
              onPageSizeChange={slips.setPageSize}
              pageSizeOptions={[3, 6, 12]}
              noun="slips"
            />
          </div>
        )}
      </Panel>

      <Panel title="Duty payouts" subtitle="Morning + evening complete earnings">
        {payouts.length === 0 ? (
          <EmptyState title="No duty payouts" description="Complete AM + PM present to earn." />
        ) : (
          <div className="space-y-1.5">
            {duties.rows.map((p) => (
              <ListTile key={p.id} className="animate-dash-in">
                <ListTileHeader>
                  <div>
                    <p className="font-display text-base text-heading">{p.patientName}</p>
                    <ListTileMeta>{p.dutyDate}</ListTileMeta>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={p.status === "paid" ? "success" : "warning"}>{p.status}</Badge>
                    <p className="text-sm font-semibold text-heading">{formatINR(p.amount)}</p>
                  </div>
                </ListTileHeader>
              </ListTile>
            ))}
            <Pagination
              page={duties.page}
              pageCount={duties.pageCount}
              pageSize={duties.pageSize}
              total={payouts.length}
              filteredCount={payouts.length}
              onPageChange={duties.setPage}
              onPageSizeChange={duties.setPageSize}
              pageSizeOptions={[5, 8, 15, 30]}
              noun="payouts"
            />
          </div>
        )}
      </Panel>
    </>
  );
}
