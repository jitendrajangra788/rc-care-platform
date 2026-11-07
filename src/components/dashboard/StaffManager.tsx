"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { Staff } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

type StaffRow = Staff & { loginEmail?: string; hasLogin?: boolean };

const emptyForm = {
  name: "",
  role: "Nurse" as Staff["role"],
  phone: "",
  area: "",
  skills: "",
  status: "available" as Staff["status"],
  email: "",
  password: "",
  salaryMonthly: "20000",
  salaryPerShift: "700",
};

export function StaffManager({ staff }: { staff: StaffRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdCred, setCreatedCred] = useState<{ email: string; password: string } | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setCreatedCred(null);
    setOpen(true);
  }

  function openEdit(s: StaffRow) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      role: s.role,
      phone: s.phone,
      area: s.area,
      skills: s.skills.join(", "),
      status: s.status,
      email: s.email || s.loginEmail || "",
      password: "",
      salaryMonthly: String(s.salaryMonthly ?? 20000),
      salaryPerShift: String(s.salaryPerShift ?? 700),
    });
    setError("");
    setCreatedCred(null);
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      id: editingId || undefined,
      salaryMonthly: form.salaryMonthly ? Number(form.salaryMonthly) : undefined,
      salaryPerShift: form.salaryPerShift ? Number(form.salaryPerShift) : undefined,
    };
    const res = await fetch("/api/staff", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Save failed");
      toast.error("Staff save failed", data.error || "Check required fields");
      return;
    }
    if (!editingId && form.password) {
      setCreatedCred({ email: form.email, password: form.password });
      toast.success("Staff saved successfully", "Login credentials ready below");
    } else {
      setOpen(false);
      toast.success(editingId ? "Staff updated successfully" : "Staff saved successfully");
    }
    router.refresh();
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Delete staff "${name}" and their login?`)) return;
    const res = await fetch(`/api/staff?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error("Delete failed", data.error);
      return;
    }
    toast.success("Staff deleted successfully", name);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-soft">{staff.length} staff members</p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Add staff
        </button>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {staff.map((s) => (
          <article key={s.id} className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-paper-2">
                  {s.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photoUrl} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-sm font-semibold text-sea">
                      {s.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-name">{s.name}</h3>
                  <p className="text-sm text-ink-soft">
                    {s.role} · {s.area}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-paper-2 px-3 py-1 text-xs font-semibold uppercase text-sea">
                {s.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-ink-soft">{s.skills.join(" · ") || "No skills listed"}</p>
            <p className="mt-2 text-sm">{s.phone}</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              Shift pay {formatINR(s.salaryPerShift || 0)}
              {s.salaryMonthly ? ` · Monthly ${formatINR(s.salaryMonthly)}` : ""}
            </p>
            <p className="mt-1 text-sm text-sea">
              Login: {s.email || s.loginEmail || (s.hasLogin ? "Linked" : "No login yet")}
            </p>
            <div className="mt-1.5 flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(s)}
                className="inline-flex items-center gap-1 rounded-full bg-paper-2 px-3 py-1.5 text-xs font-semibold"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(s.id, s.name)}
                className="inline-flex items-center gap-1 rounded-full bg-[#fde8e4] px-3 py-1.5 text-xs font-semibold text-[#c45c4a]"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.5rem] bg-white p-3 shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-2xl">
                {editingId ? "Edit staff" : "Add staff + login"}
              </h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-paper-2">
                <X className="h-5 w-5" />
              </button>
            </div>

            {createdCred ? (
              <div className="mt-2 space-y-1.5 rounded-2xl bg-paper-2 p-4">
                <p className="font-semibold text-mint">Staff created</p>
                <p className="text-sm">Share these login details with the staff member:</p>
                <p className="text-sm">
                  <strong>Email:</strong> {createdCred.email}
                </p>
                <p className="text-sm">
                  <strong>Password:</strong> {createdCred.password}
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-sea px-4 py-2 text-sm font-semibold text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-2 space-y-1.5">
                <input
                  className="field"
                  placeholder="Full name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    className="field"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as Staff["role"] })}
                  >
                    <option value="Nurse">Nurse</option>
                    <option value="Attendant">Attendant</option>
                    <option value="Physio">Physio</option>
                  </select>
                  <select
                    className="field"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as Staff["status"] })
                    }
                  >
                    <option value="available">available</option>
                    <option value="on-duty">on-duty</option>
                    <option value="leave">leave</option>
                  </select>
                </div>
                <input
                  className="field"
                  placeholder="Phone *"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
                <input
                  className="field"
                  placeholder="Area (e.g. Subhash Nagar)"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                />
                <input
                  className="field"
                  placeholder="Skills (comma separated)"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="field"
                    type="number"
                    min={0}
                    placeholder="Monthly salary"
                    value={form.salaryMonthly}
                    onChange={(e) => setForm({ ...form, salaryMonthly: e.target.value })}
                  />
                  <input
                    className="field"
                    type="number"
                    min={1}
                    placeholder="Per-shift salary *"
                    value={form.salaryPerShift}
                    onChange={(e) => setForm({ ...form, salaryPerShift: e.target.value })}
                    required
                  />
                </div>
                <p className="text-xs text-ink-soft">
                  Duty complete (morning + evening) hone pe per-shift salary credit hoti hai.
                </p>
                <input
                  className="field"
                  type="email"
                  placeholder="Login email / username *"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <input
                  className="field"
                  type="text"
                  placeholder={editingId ? "New password (leave blank to keep)" : "Login password *"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingId}
                />
                {error ? <p className="text-sm text-[#c45c4a]">{error}</p> : null}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-full bg-sea px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update staff" : "Create staff + login"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}