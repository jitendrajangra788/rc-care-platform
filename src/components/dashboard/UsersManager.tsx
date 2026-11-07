"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import type { Role, SessionUser } from "@/lib/types";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, Input, Select } from "@/components/ui/Input";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";
import { Panel } from "@/components/dashboard/DashboardShell";

export function UsersManager({ users }: { users: SessionUser[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "care_coordinator" as Role,
    phone: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed", data.error);
      return;
    }
    toast.success("User created", data.user?.email);
    setForm({
      name: "",
      email: "",
      password: "",
      role: "care_coordinator",
      phone: "",
    });
    router.refresh();
  }

  async function toggleActive(id: string, active: boolean) {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error("Failed", data.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-2 lg:grid-cols-2">
      <Panel title="Create user" subtitle="Invite a role into Roshan Care.">
        <form onSubmit={onSubmit} className="space-y-1.5">
          <FormField label="Name *">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Email *">
            <Input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FormField>
          <FormField label="Password *">
            <Input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </FormField>
          <FormField label="Role">
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="care_coordinator">Care Coordinator</option>
              <option value="nurse">Nurse</option>
              <option value="family">Family</option>
              <option value="patient">Patient</option>
            </Select>
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
          <Button type="submit" loading={saving} disabled={saving}>
            Create
          </Button>
        </form>
      </Panel>

      <Panel title="Directory" subtitle={`${users.length} accounts`}>
        {users.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No users"
            description="Create the first account to open role access."
          />
        ) : (
          <div className="space-y-1.5">
            {users.map((u) => (
              <ListTile key={u.id} className="animate-dash-in">
                <ListTileHeader>
                  <div>
                    <h3 className="font-name text-lg text-heading">{u.name}</h3>
                    <ListTileMeta>{u.email}</ListTileMeta>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={u.active === false ? "danger" : "primary"}>{u.role}</Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => toggleActive(u.id, u.active === false)}
                    >
                      {u.active === false ? "Activate" : "Disable"}
                    </Button>
                  </div>
                </ListTileHeader>
              </ListTile>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
