"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Wallet } from "lucide-react";
import type { Invoice, PaymentRecord } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { usePagedList } from "@/hooks/usePagedList";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FormField, Input, Select } from "@/components/ui/Input";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Pagination } from "@/components/ui/Pagination";
import { Panel, StatCard } from "@/components/dashboard/DashboardShell";

export function PaymentsPanel({
  payments,
  invoices,
}: {
  payments: PaymentRecord[];
  invoices: Invoice[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState<"all" | PaymentRecord["method"]>("all");
  const openInvoices = invoices.filter((i) => i.status !== "paid");
  const [form, setForm] = useState({
    invoiceId: openInvoices[0]?.id || invoices[0]?.id || "",
    amount: "",
    method: "upi" as PaymentRecord["method"],
    note: "",
  });

  const total = payments.reduce((s, p) => s + p.amount, 0);
  const byMethod = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of payments) map[p.method] = (map[p.method] || 0) + p.amount;
    return map;
  }, [payments]);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const q = query.trim().toLowerCase();
      const inv = invoices.find((i) => i.id === p.invoiceId);
      const matchQ =
        !q ||
        p.invoiceId.toLowerCase().includes(q) ||
        p.recordedByName.toLowerCase().includes(q) ||
        (inv?.patientName || "").toLowerCase().includes(q) ||
        (p.note || "").toLowerCase().includes(q);
      const matchM = method === "all" || p.method === method;
      return matchQ && matchM;
    });
  }, [payments, invoices, query, method]);

  const { page, pageCount, pageSize, rows, setPage, setPageSize, resetPage } =
    usePagedList(filtered, 10);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId: form.invoiceId,
        amount: Number(form.amount),
        method: form.method,
        note: form.note,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not record payment");
      toast.error("Failed", data.error);
      return;
    }
    toast.success("Payment recorded", formatCurrency(Number(form.amount)));
    setForm((prev) => ({ ...prev, amount: "", note: "" }));
    router.refresh();
  }

  function fillBalance() {
    const inv = invoices.find((i) => i.id === form.invoiceId);
    if (!inv) return;
    setForm((f) => ({ ...f, amount: String(Math.max(0, inv.amount - inv.paid)) }));
  }

  return (
    <div className="space-y-2">
      {error ? (
        <ErrorState
          title="Payment failed"
          description={error}
          onRetry={() => setError("")}
          retryLabel="Dismiss"
        />
      ) : null}

      <div className="dash-grid-stats cols-4">
        <StatCard label="Ledger total" value={formatCurrency(total)} tone="success" />
        <StatCard label="Entries" value={String(payments.length)} />
        <StatCard label="UPI" value={formatCurrency(byMethod.upi || 0)} tone="primary" />
        <StatCard label="Cash" value={formatCurrency(byMethod.cash || 0)} />
      </div>

      <div className="grid gap-2 lg:grid-cols-[0.95fr_1.15fr]">
        <Panel title="Record payment" subtitle="Posts to ledger and updates invoice balance.">
          {invoices.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title="No invoices to collect"
              description="Create an invoice in Billing before recording a payment."
              className="py-3"
            />
          ) : (
            <form onSubmit={onSubmit} className="space-y-1.5">
              <FormField label="Invoice *">
                <Select
                  required
                  value={form.invoiceId}
                  onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}
                >
                  {invoices.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.id} · {i.patientName} · due {formatCurrency(i.amount - i.paid)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Amount *" hint="Use Fill balance for remaining dues">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                  <Button type="button" variant="secondary" onClick={fillBalance}>
                    Fill
                  </Button>
                </div>
              </FormField>
              <FormField label="Method">
                <Select
                  value={form.method}
                  onChange={(e) =>
                    setForm({ ...form, method: e.target.value as PaymentRecord["method"] })
                  }
                >
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="other">Other</option>
                </Select>
              </FormField>
              <FormField label="Note">
                <Input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </FormField>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" loading={saving} disabled={saving}>
                  Save payment
                </Button>
                <Link href="/dashboard/admin/billing" className="btn btn-outline">
                  Open billing
                </Link>
              </div>
            </form>
          )}
        </Panel>

        <Panel title="Payment ledger" subtitle={`${filtered.length} shown`}>
          <ListToolbar
            className="mb-1.5"
            query={query}
            onQueryChange={(v) => {
              setQuery(v);
              resetPage();
            }}
            placeholder="Search invoice, patient, note…"
            filters={[
              { id: "all", label: "all" },
              { id: "upi", label: "upi" },
              { id: "cash", label: "cash" },
              { id: "bank", label: "bank" },
              { id: "other", label: "other" },
            ]}
            activeFilter={method}
            onFilterChange={(id) => {
              setMethod(id as "all" | PaymentRecord["method"]);
              resetPage();
            }}
          />

          {payments.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-5 w-5" />}
              title="No payments yet"
              description="Collections from Billing or this form appear here."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-5 w-5" />}
              title="No payments match"
              description="Try another search or method filter."
            />
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Invoice</th>
                    <th>Method</th>
                    <th>By</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const inv = invoices.find((i) => i.id === p.invoiceId);
                    return (
                      <tr key={p.id}>
                        <td className="font-display text-base text-heading">
                          {formatCurrency(p.amount)}
                        </td>
                        <td>
                          <p className="font-semibold text-heading">{p.invoiceId}</p>
                          <p className="text-xs text-muted">{inv?.patientName || "—"}</p>
                          {p.note ? <p className="text-xs text-muted">{p.note}</p> : null}
                        </td>
                        <td>
                          <Badge tone="primary">{p.method}</Badge>
                        </td>
                        <td className="text-sm text-muted">{p.recordedByName}</td>
                        <td className="text-xs text-muted">{formatDateTime(p.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {filtered.length > 0 ? (
            <Pagination
              page={page}
              pageCount={pageCount}
              pageSize={pageSize}
              total={payments.length}
              filteredCount={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              noun="payments"
            />
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
