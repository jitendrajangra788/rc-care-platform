"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, Wallet } from "lucide-react";
import type { Booking, Invoice, Patient } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePagedList } from "@/hooks/usePagedList";
import { toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FormField, Input, Select } from "@/components/ui/Input";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Pagination } from "@/components/ui/Pagination";
import { Panel } from "@/components/dashboard/DashboardShell";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(inv: Invoice) {
  return inv.status !== "paid" && inv.dueDate < todayISO();
}

export function BillingManager({
  invoices,
  bookings = [],
  patients = [],
}: {
  invoices: Invoice[];
  bookings?: Booking[];
  patients?: Patient[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | Invoice["status"] | "overdue">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [collectId, setCollectId] = useState<string | null>(null);
  const [collectAmount, setCollectAmount] = useState("");
  const [collectMethod, setCollectMethod] = useState("upi");
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    bookingId: "",
    amount: "",
    dueDate: "",
  });

  const unbilledBookings = useMemo(() => {
    const billed = new Set(invoices.map((i) => i.bookingId));
    return bookings.filter(
      (b) => !billed.has(b.id) && b.status !== "cancelled",
    );
  }, [bookings, invoices]);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const q = query.trim().toLowerCase();
      const matchQ =
        !q ||
        inv.id.toLowerCase().includes(q) ||
        inv.patientName.toLowerCase().includes(q) ||
        inv.bookingId.toLowerCase().includes(q);
      const matchS =
        status === "all"
          ? true
          : status === "overdue"
            ? isOverdue(inv)
            : inv.status === status;
      return matchQ && matchS;
    });
  }, [invoices, query, status]);

  const { page, pageCount, pageSize, rows, setPage, setPageSize, resetPage } =
    usePagedList(filtered, 10);

  function patientHref(inv: Invoice) {
    const booking = bookings.find((b) => b.id === inv.bookingId);
    const patient =
      patients.find((p) => p.id === booking?.patientId) ||
      patients.find(
        (p) =>
          p.name.toLowerCase() === inv.patientName.toLowerCase() ||
          (booking &&
            p.phone.replace(/\s/g, "") === booking.phone.replace(/\s/g, "")),
      );
    return patient ? `/dashboard/admin/patients/${patient.id}` : null;
  }

  async function update(id: string, payload: Record<string, unknown>) {
    setBusy(id);
    setError("");
    const res = await fetch("/api/billing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(data.error || "Update failed");
      toast.error("Billing update failed", data.error);
      return;
    }
    toast.success(
      payload.markPaid
        ? "Invoice marked paid"
        : payload.collectAmount
          ? "Payment collected"
          : "Invoice updated",
      id,
    );
    setCollectId(null);
    setCollectAmount("");
    router.refresh();
  }

  async function createInvoice(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: createForm.bookingId,
        amount: createForm.amount ? Number(createForm.amount) : undefined,
        dueDate: createForm.dueDate,
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      setError(data.error || "Create failed");
      toast.error("Invoice create failed", data.error);
      return;
    }
    toast.success("Invoice created", data.invoice?.id);
    setShowCreate(false);
    setCreateForm({
      bookingId: "",
      amount: "",
      dueDate: "",
    });
    router.refresh();
  }

  function openCollect(inv: Invoice) {
    setCollectId(inv.id);
    setCollectAmount(String(Math.max(0, inv.amount - inv.paid)));
    setCollectMethod("upi");
  }

  return (
    <div className="space-y-1.5">
      {error ? (
        <ErrorState
          title="Billing request failed"
          description={error}
          onRetry={() => setError("")}
          retryLabel="Dismiss"
        />
      ) : null}

      <ListToolbar
        query={query}
        onQueryChange={(v) => {
          setQuery(v);
          resetPage();
        }}
        placeholder="Search invoice, patient, booking…"
        filters={[
          { id: "all", label: "all" },
          { id: "unpaid", label: "unpaid" },
          { id: "partial", label: "partial" },
          { id: "paid", label: "paid" },
          { id: "overdue", label: "overdue" },
        ]}
        activeFilter={status}
        onFilterChange={(id) => {
          setStatus(id as "all" | Invoice["status"] | "overdue");
          resetPage();
        }}
        actions={
          <>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setShowCreate((v) => {
                  const next = !v;
                  if (next) {
                    const d = new Date();
                    d.setDate(d.getDate() + 7);
                    setCreateForm((f) => ({
                      ...f,
                      dueDate: d.toISOString().slice(0, 10),
                    }));
                  }
                  return next;
                });
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              {showCreate ? "Close" : "Create invoice"}
            </Button>
            <Link href="/dashboard/admin/payments" className="btn btn-secondary btn-sm">
              <Wallet className="h-3.5 w-3.5" /> Ledger
            </Link>
          </>
        }
      />

      {showCreate ? (
        <Panel
          title="Create invoice"
          subtitle={
            unbilledBookings.length
              ? `${unbilledBookings.length} bookings without invoice`
              : "All active bookings already billed"
          }
        >
          {unbilledBookings.length === 0 ? (
            <EmptyState
              title="Nothing to bill"
              description="Every non-cancelled booking already has an invoice."
            />
          ) : (
            <form onSubmit={createInvoice} className="grid gap-2 sm:grid-cols-3">
              <FormField label="Booking *" className="sm:col-span-2">
                <Select
                  required
                  value={createForm.bookingId}
                  onChange={(e) => {
                    const b = unbilledBookings.find((x) => x.id === e.target.value);
                    setCreateForm({
                      ...createForm,
                      bookingId: e.target.value,
                      amount: b ? String(b.amount) : createForm.amount,
                    });
                  }}
                >
                  <option value="">Select booking</option>
                  {unbilledBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} · {b.patientName} · {b.careType} · {formatCurrency(b.amount)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Amount (₹)">
                <Input
                  type="number"
                  min={1}
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                />
              </FormField>
              <FormField label="Due date">
                <Input
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                />
              </FormField>
              <div className="sm:col-span-3">
                <Button type="submit" loading={creating} disabled={creating}>
                  Create invoice
                </Button>
              </div>
            </form>
          )}
        </Panel>
      ) : null}

      {invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No invoices yet"
          description="Create an invoice from an unbilled booking to start receivables."
          actionLabel="Create invoice"
          onAction={() => {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            setCreateForm((f) => ({ ...f, dueDate: d.toISOString().slice(0, 10) }));
            setShowCreate(true);
          }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No invoices match"
          description="Try another search or status filter."
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Patient</th>
                <th>Amount</th>
                <th>Collected</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Due</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => {
                const balance = Math.max(0, inv.amount - inv.paid);
                const pct = inv.amount > 0 ? Math.round((inv.paid / inv.amount) * 100) : 0;
                const overdue = isOverdue(inv);
                const href = patientHref(inv);
                return (
                  <tr key={inv.id}>
                    <td>
                      <p className="font-semibold text-heading">{inv.id}</p>
                      <p className="text-xs text-muted">{inv.bookingId}</p>
                    </td>
                    <td>
                      {href ? (
                        <Link href={href} className="font-name text-heading hover:text-primary">
                          {inv.patientName}
                        </Link>
                      ) : (
                        <span className="font-name text-heading">{inv.patientName}</span>
                      )}
                    </td>
                    <td className="font-semibold">{formatCurrency(inv.amount)}</td>
                    <td>
                      <p>{formatCurrency(inv.paid)}</p>
                      <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-paper-2">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                    <td className={cn("font-semibold", balance > 0 ? "text-warning" : "text-success")}>
                      {formatCurrency(balance)}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          tone={
                            inv.status === "paid"
                              ? "success"
                              : inv.status === "partial"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {inv.status}
                        </Badge>
                        {overdue ? <Badge tone="danger">Overdue</Badge> : null}
                      </div>
                    </td>
                    <td className={cn("text-sm", overdue ? "font-semibold text-danger" : "text-muted")}>
                      {formatDate(inv.dueDate)}
                    </td>
                    <td>
                      {inv.status === "paid" ? (
                        <span className="text-xs font-semibold text-success">Settled</span>
                      ) : collectId === inv.id ? (
                        <div className="flex min-w-[14rem] flex-col gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={balance}
                            value={collectAmount}
                            onChange={(e) => setCollectAmount(e.target.value)}
                            placeholder="Amount"
                          />
                          <Select
                            value={collectMethod}
                            onChange={(e) => setCollectMethod(e.target.value)}
                          >
                            <option value="upi">UPI</option>
                            <option value="cash">Cash</option>
                            <option value="bank">Bank</option>
                            <option value="other">Other</option>
                          </Select>
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              size="sm"
                              disabled={busy === inv.id}
                              onClick={() =>
                                update(inv.id, {
                                  collectAmount: Number(collectAmount),
                                  method: collectMethod,
                                })
                              }
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setCollectId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy === inv.id}
                            onClick={() => openCollect(inv)}
                          >
                            Collect
                          </Button>
                          <Button
                            size="sm"
                            disabled={busy === inv.id}
                            onClick={() => update(inv.id, { markPaid: true, method: "upi" })}
                          >
                            Mark paid
                          </Button>
                        </div>
                      )}
                    </td>
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
          total={invoices.length}
          filteredCount={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          noun="invoices"
        />
      ) : null}
    </div>
  );
}
