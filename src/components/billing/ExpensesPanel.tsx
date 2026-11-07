"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Receipt } from "lucide-react";
import type { Expense, Staff } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { todayISO } from "@/lib/schedule";
import { usePagedList } from "@/hooks/usePagedList";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FormField, Input, Select } from "@/components/ui/Input";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Pagination } from "@/components/ui/Pagination";
import { Panel, StatCard } from "@/components/dashboard/DashboardShell";

const categories = [
  "Transport",
  "Supplies",
  "Medicine stock",
  "Staff advance",
  "Office",
  "Marketing",
  "Other",
];

export function ExpensesPanel({ expenses, staff }: { expenses: Expense[]; staff: Staff[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [form, setForm] = useState({
    category: "Transport",
    amount: "",
    date: todayISO(),
    note: "",
    staffId: "",
  });

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const thisMonth = todayISO().slice(0, 7);
  const monthTotal = expenses
    .filter((e) => e.date.startsWith(thisMonth))
    .reduce((s, e) => s + e.amount, 0);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) map[e.category] = (map[e.category] || 0) + e.amount;
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const q = query.trim().toLowerCase();
      const matchQ =
        !q ||
        e.category.toLowerCase().includes(q) ||
        (e.note || "").toLowerCase().includes(q) ||
        e.date.includes(q);
      const matchC = categoryFilter === "all" || e.category === categoryFilter;
      return matchQ && matchC;
    });
  }, [expenses, query, categoryFilter]);

  const { page, pageCount, pageSize, rows, setPage, setPageSize, resetPage } =
    usePagedList(filtered, 10);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
        staffId: form.staffId || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not record expense");
      toast.error("Failed", data.error);
      return;
    }
    toast.success("Expense recorded");
    setForm((prev) => ({ ...prev, amount: "", note: "" }));
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {error ? (
        <ErrorState
          title="Expense failed"
          description={error}
          onRetry={() => setError("")}
          retryLabel="Dismiss"
        />
      ) : null}

      <div className="dash-grid-stats cols-3">
        <StatCard label="All-time expenses" value={formatCurrency(total)} />
        <StatCard label="This month" value={formatCurrency(monthTotal)} tone="warning" />
        <StatCard label="Entries" value={String(expenses.length)} tone="primary" />
      </div>

      <div className="grid gap-2 lg:grid-cols-[0.95fr_1.15fr]">
        <Panel title="Add expense" subtitle="Ops costs against the month.">
          <form onSubmit={onSubmit} className="space-y-1.5">
            <FormField label="Category *">
              <Select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Amount *">
              <Input
                required
                type="number"
                min={1}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </FormField>
            <FormField label="Date">
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </FormField>
            <FormField label="Staff">
              <Select
                value={form.staffId}
                onChange={(e) => setForm({ ...form, staffId: e.target.value })}
              >
                <option value="">Optional</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Note">
              <Input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </FormField>
            <Button type="submit" loading={saving} disabled={saving}>
              Add expense
            </Button>
          </form>

          {byCategory.length ? (
            <div className="mt-6 border-t border-[var(--line)] pt-5">
              <p className="text-label text-primary">By category</p>
              <div className="mt-3 space-y-2">
                {byCategory.slice(0, 6).map(([cat, amt]) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span className="text-muted">{cat}</span>
                    <span className="font-semibold text-heading">{formatCurrency(amt)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>

        <Panel title="Expense log" subtitle={`${filtered.length} shown`}>
          <ListToolbar
            className="mb-1.5"
            query={query}
            onQueryChange={(v) => {
              setQuery(v);
              resetPage();
            }}
            placeholder="Search category, note, date…"
            filters={[
              { id: "all", label: "All" },
              ...byCategory.slice(0, 5).map(([cat]) => ({ id: cat, label: cat })),
            ]}
            activeFilter={categoryFilter}
            onFilterChange={(id) => {
              setCategoryFilter(id);
              resetPage();
            }}
          />

          {expenses.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-5 w-5" />}
              title="No expenses"
              description="Ops costs will show here once recorded."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-5 w-5" />}
              title="No expenses match"
              description="Try another search or category filter."
            />
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Note</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => {
                    const who = staff.find((s) => s.id === e.staffId);
                    return (
                      <tr key={e.id}>
                        <td className="font-semibold text-heading">{e.category}</td>
                        <td className="text-muted">{formatDate(e.date)}</td>
                        <td className="text-sm text-muted">
                          {e.note || "—"}
                          {who ? ` · ${who.name}` : ""}
                        </td>
                        <td className="font-display text-base text-heading">
                          {formatCurrency(e.amount)}
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
              total={expenses.length}
              filteredCount={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              noun="expenses"
            />
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
