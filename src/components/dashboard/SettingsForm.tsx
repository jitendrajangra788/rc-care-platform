"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppSettings } from "@/lib/types";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";
import { Panel } from "@/components/dashboard/DashboardShell";

export function SettingsForm({ settings, canWrite }: { settings: AppSettings; canWrite: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(settings);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed", data.error);
      return;
    }
    toast.success("Settings saved");
    router.refresh();
  }

  return (
    <Panel
      title="Organization settings"
      subtitle={canWrite ? "Desk defaults for support and geofence." : "Read-only for your role."}
    >
      <form onSubmit={onSubmit} className="max-w-xl space-y-2">
        <FormField label="Organization">
          <Input
            disabled={!canWrite}
            value={form.orgName}
            onChange={(e) => setForm({ ...form, orgName: e.target.value })}
          />
        </FormField>
        <FormField label="Support phone">
          <Input
            disabled={!canWrite}
            value={form.supportPhone}
            onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
          />
        </FormField>
        <FormField label="Support email">
          <Input
            disabled={!canWrite}
            value={form.supportEmail}
            onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
          />
        </FormField>
        <FormField label="City">
          <Input
            disabled={!canWrite}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </FormField>
        <FormField label="Default geofence (m)" hint="Used when a booking has no custom radius">
          <Input
            type="number"
            disabled={!canWrite}
            value={form.defaultGeofenceM}
            onChange={(e) => setForm({ ...form, defaultGeofenceM: Number(e.target.value) })}
          />
        </FormField>
        <label className="flex items-center gap-2 rounded-[var(--radius-lg)] bg-paper-2 px-4 py-3 text-sm text-heading">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--primary)]"
            disabled={!canWrite}
            checked={form.demoLogins}
            onChange={(e) => setForm({ ...form, demoLogins: e.target.checked })}
          />
          Allow demo login hints in development
        </label>
        {canWrite ? (
          <Button type="submit" loading={saving} disabled={saving}>
            Save settings
          </Button>
        ) : (
          <p className="text-sm text-muted">You can view settings but not change them.</p>
        )}
      </form>
    </Panel>
  );
}
