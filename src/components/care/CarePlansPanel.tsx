"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import type { CarePlan, Patient } from "@/lib/types";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, Input, Select, Textarea } from "@/components/ui/Input";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";
import { Panel } from "@/components/dashboard/DashboardShell";

export function CarePlansPanel({
  carePlans,
  patients,
  canWrite = true,
}: {
  carePlans: CarePlan[];
  patients: Patient[];
  canWrite?: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patientId: patients[0]?.id || "",
    title: "",
    goals: "",
    tasks: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/care-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: form.patientId,
        title: form.title,
        goals: form.goals,
        tasks: form.tasks
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error("Save failed", data.error);
      return;
    }
    toast.success("Care plan saved");
    setForm((prev) => ({ ...prev, title: "", goals: "", tasks: "" }));
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {canWrite ? (
        <Panel title="New care plan" subtitle="Goals and daily tasks for a patient.">
          <form onSubmit={onSubmit} className="grid gap-2 md:grid-cols-2">
            <FormField label="Patient *">
              <Select
                required
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Plan title *">
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </FormField>
            <FormField label="Goals" className="md:col-span-2">
              <Textarea value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} />
            </FormField>
            <FormField label="Tasks" hint="One task per line" className="md:col-span-2">
              <Textarea value={form.tasks} onChange={(e) => setForm({ ...form, tasks: e.target.value })} />
            </FormField>
            <div className="md:col-span-2">
              <Button type="submit" loading={saving} disabled={saving}>
                Create plan
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel title="Active plans" subtitle={`${carePlans.length} total`}>
        {carePlans.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-5 w-5" />}
            title="No care plans"
            description="Create a plan with goals and daily tasks for the care team."
          />
        ) : (
          <div className="space-y-1.5">
            {carePlans.map((p) => {
              const patient = patients.find((x) => x.id === p.patientId);
              return (
                <ListTile key={p.id} className="animate-dash-in">
                  <ListTileHeader>
                    <h3 className="font-display text-lg text-heading">{p.title}</h3>
                    <Badge tone={p.status === "active" ? "success" : "neutral"}>{p.status}</Badge>
                  </ListTileHeader>
                  <ListTileMeta>{patient?.name || p.patientId}</ListTileMeta>
                  {p.goals ? <p className="mt-2 text-sm text-heading">{p.goals}</p> : null}
                  {p.tasks.length ? (
                    <ul className="mt-3 space-y-1.5 border-t border-[var(--line)] pt-3 text-sm text-muted">
                      {p.tasks.map((t) => (
                        <li key={t} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </ListTile>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
