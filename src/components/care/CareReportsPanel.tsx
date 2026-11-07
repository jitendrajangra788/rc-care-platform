"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import type { CareReport, Patient } from "@/lib/types";
import { todayISO } from "@/lib/schedule";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, Input, Select, Textarea } from "@/components/ui/Input";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";
import { Panel } from "@/components/dashboard/DashboardShell";

export function CareReportsPanel({
  reports,
  patients,
  canWrite = true,
}: {
  reports: CareReport[];
  patients: Patient[];
  canWrite?: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patientId: patients[0]?.id || "",
    dutyDate: todayISO(),
    summary: "",
    vitalsNote: "",
    medsNote: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/care-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error("Save failed", data.error);
      return;
    }
    toast.success("Care report saved");
    setForm((prev) => ({ ...prev, summary: "", vitalsNote: "", medsNote: "" }));
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {canWrite ? (
        <Panel title="Daily care report" subtitle="End-of-shift summary for the family and desk.">
          <form onSubmit={onSubmit} className="space-y-1.5">
            <div className="grid gap-2 sm:grid-cols-2">
              <FormField label="Patient *">
                <Select
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
              <FormField label="Duty date">
                <Input
                  type="date"
                  value={form.dutyDate}
                  onChange={(e) => setForm({ ...form, dutyDate: e.target.value })}
                />
              </FormField>
            </div>
            <FormField label="Daily summary *">
              <Textarea
                required
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </FormField>
            <div className="grid gap-2 sm:grid-cols-2">
              <FormField label="Vitals note">
                <Input
                  value={form.vitalsNote}
                  onChange={(e) => setForm({ ...form, vitalsNote: e.target.value })}
                />
              </FormField>
              <FormField label="Meds note">
                <Input
                  value={form.medsNote}
                  onChange={(e) => setForm({ ...form, medsNote: e.target.value })}
                />
              </FormField>
            </div>
            <Button type="submit" loading={saving} disabled={saving}>
              Save daily report
            </Button>
          </form>
        </Panel>
      ) : null}

      <Panel title="Report history" subtitle={`${reports.length} reports`}>
        {reports.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No care reports"
            description="Daily shift summaries will appear here for the care team and family."
          />
        ) : (
          <div className="space-y-1.5">
            {reports.map((r) => {
              const patient = patients.find((p) => p.id === r.patientId);
              const type = r.reportType || "daily";
              return (
                <ListTile key={r.id} className="animate-dash-in">
                  <ListTileHeader>
                    <div>
                      <h3 className="font-display text-lg text-heading">
                        {patient?.name || r.patientId}
                      </h3>
                      <ListTileMeta>
                        {type === "complete" ? "Complete report" : "Daily report"}
                        {r.attachmentName ? ` · ${r.attachmentName}` : ""}
                      </ListTileMeta>
                    </div>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                      {r.dutyDate}
                    </span>
                  </ListTileHeader>
                  <p className="mt-3 text-sm leading-relaxed text-heading">{r.summary}</p>
                  {(r.vitalsNote || r.medsNote || r.conditionNote || r.tasksDone) && (
                    <div className="mt-3 grid gap-2 border-t border-[var(--line)] pt-3 text-sm text-muted sm:grid-cols-2">
                      {r.conditionNote ? <p>Condition: {r.conditionNote}</p> : null}
                      {r.vitalsNote ? <p>Vitals: {r.vitalsNote}</p> : null}
                      {r.medsNote ? <p>Meds: {r.medsNote}</p> : null}
                      {r.tasksDone ? <p>Tasks: {r.tasksDone}</p> : null}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ListTileMeta>{r.createdByName}</ListTileMeta>
                    {r.attachmentUrl ? (
                      <a
                        href={r.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-primary"
                      >
                        Open attachment
                      </a>
                    ) : null}
                  </div>
                </ListTile>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
