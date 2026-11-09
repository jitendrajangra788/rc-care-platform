"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Search, Users } from "lucide-react";
import type { Role, SessionUser } from "@/lib/types";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, Input, Select } from "@/components/ui/Input";
import { Panel } from "@/components/dashboard/DashboardShell";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "care_coordinator", label: "Care Coordinator" },
  { value: "nurse", label: "Nurse" },
  { value: "family", label: "Family / Patient" },
];

type FormState = {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone: string;
};

const emptyForm = (): FormState => ({
  name: "",
  email: "",
  password: "",
  role: "care_coordinator",
  phone: "",
});

export function UsersManager({ users }: { users: SessionUser[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [oneTimePassword, setOneTimePassword] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchQ =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q);
      const matchR = roleFilter === "all" || u.role === roleFilter;
      return matchQ && matchR;
    });
  }, [users, query, roleFilter]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setShowPassword(false);
    setOneTimePassword(null);
  }

  function startEdit(u: SessionUser) {
    setEditingId(u.id);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      phone: u.phone || "",
    });
    setShowPassword(false);
    setOneTimePassword(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Missing fields", "Name and email are required");
      return;
    }
    if (!editingId && form.password.trim().length < 6) {
      toast.error("Password", "Min 6 characters required for new login");
      return;
    }
    if (editingId && form.password && form.password.trim().length < 6) {
      toast.error("Password", "New password must be at least 6 characters");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      phone: form.phone.trim(),
      ...(form.password.trim() ? { password: form.password.trim() } : {}),
    };

    const res = await fetch("/api/users", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...payload } : { ...payload, password: form.password.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed", data.error || "Could not save user");
      return;
    }

    if (form.password.trim()) {
      setOneTimePassword(form.password.trim());
      toast.success(
        editingId ? "Login password updated" : "User created",
        "Copy the password now — it won't be shown again",
      );
    } else {
      toast.success(editingId ? "User updated" : "User created", data.user?.email || form.email);
      setOneTimePassword(null);
    }

    setForm((f) => ({ ...f, password: "" }));
    setShowPassword(false);
    if (!editingId) {
      setEditingId(data.user?.id || null);
      setForm({
        name: data.user?.name || form.name,
        email: data.user?.email || form.email,
        password: "",
        role: (data.user?.role as Role) || form.role,
        phone: data.user?.phone || form.phone,
      });
    }
    router.refresh();
  }

  async function toggleActive(id: string, active: boolean) {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error("Failed", data.error || "Could not update status");
      return;
    }
    toast.success(active ? "User activated" : "User disabled");
    router.refresh();
  }

  return (
    <div className="grid gap-2 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
      <Panel
        title={editingId ? "Edit login" : "Create user"}
        subtitle={
          editingId
            ? "Update profile, role, or set a new password"
            : "Email + password for /login"
        }
        action={
          editingId ? (
            <Button type="button" size="sm" variant="ghost" onClick={startCreate}>
              New user
            </Button>
          ) : null
        }
      >
        <form onSubmit={onSubmit} className="space-y-2">
          <FormField label="Name *">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              autoComplete="off"
            />
          </FormField>
          <FormField label="Login email *" hint="Used on /login">
            <Input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@roshancare.in"
              autoComplete="off"
            />
          </FormField>
          <FormField
            label={editingId ? "New password" : "Password *"}
            hint={
              editingId
                ? "Leave blank to keep current password. Stored passwords are never shown."
                : "Min 6 characters · shown once after save"
            }
          >
            <div className="relative">
              <Input
                required={!editingId}
                type={showPassword ? "text" : "password"}
                minLength={editingId ? undefined : 6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? "Set new password (optional)" : "••••••••"}
                autoComplete="new-password"
                className="pr-11"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-[var(--surface-muted)] hover:text-heading"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>
          <div className="grid gap-2 sm:grid-cols-2">
            <FormField label="Role">
              <Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 …"
                autoComplete="off"
              />
            </FormField>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" loading={saving} disabled={saving}>
              {editingId ? "Save changes" : "Create login"}
            </Button>
            {editingId ? (
              <Button type="button" variant="secondary" onClick={startCreate}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>

        {oneTimePassword ? (
          <div className="mt-3 rounded-[0.85rem] border border-warning/30 bg-[var(--warning-soft)] px-3 py-2.5 text-sm">
            <p className="font-semibold text-heading">One-time login credentials</p>
            <p className="mt-1">
              <strong>Email:</strong> {form.email}
            </p>
            <p>
              <strong>Password:</strong> {oneTimePassword}
            </p>
            <p className="mt-1 text-xs text-muted">
              Copy now and share securely. Existing passwords cannot be viewed later (hashed).
            </p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => setOneTimePassword(null)}>
              Dismiss
            </Button>
          </div>
        ) : null}
      </Panel>

      <Panel title="Directory" subtitle={`${filtered.length} of ${users.length} accounts`}>
        <div className="mb-2 flex flex-col gap-1.5 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, role…"
              className="!pl-9"
              aria-label="Search users"
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="sm:w-44"
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>

        {users.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No users"
            description="Create the first account to open role access."
          />
        ) : filtered.length === 0 ? (
          <p className="py-3 text-sm text-muted">No accounts match this search.</p>
        ) : (
          <div className="max-h-[32rem] space-y-1.5 overflow-y-auto pr-0.5">
            {filtered.map((u) => {
              const selected = editingId === u.id;
              return (
                <div
                  key={u.id}
                  className={cn(
                    "rounded-[0.85rem] border px-2.5 py-2 transition",
                    selected
                      ? "border-primary bg-[var(--primary-soft)]"
                      : "border-[var(--line)] bg-surface",
                    u.active === false && "opacity-70",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-heading">
                        {titleCase(u.name)}
                      </p>
                      <p className="truncate text-[12px] text-muted">{u.email}</p>
                      {u.phone ? (
                        <p className="text-[11px] text-muted">{u.phone}</p>
                      ) : null}
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted">
                        Login · /login · password hashed
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={u.active === false ? "danger" : "primary"}>
                        {u.role.replace(/_/g, " ")}
                      </Badge>
                      {u.active === false ? <Badge tone="danger">Disabled</Badge> : null}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button type="button" size="sm" variant="secondary" onClick={() => startEdit(u)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit / password
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleActive(u.id, u.active === false)}
                    >
                      {u.active === false ? "Activate" : "Disable"}
                    </Button>
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
