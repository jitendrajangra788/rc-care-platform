"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPulse, Users } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Patient, VitalRecord } from "@/lib/types";
import { colors } from "@/lib/design-tokens";
import { formatDate, formatDateTime } from "@/lib/format";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FormField, Input, Select } from "@/components/ui/Input";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";
import { Panel } from "@/components/dashboard/DashboardShell";

function parseVitalNum(value?: string) {
  if (!value) return null;
  const match = String(value).match(/[\d.]+/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function parseBpSystolic(bp?: string) {
  if (!bp) return null;
  const left = String(bp).split("/")[0];
  return parseVitalNum(left);
}

export function VitalsPanel({
  vitals,
  patients,
  canWrite = true,
}: {
  vitals: VitalRecord[];
  patients: Patient[];
  canWrite?: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    patientId: patients[0]?.id || "",
    bp: "",
    sugar: "",
    pulse: "",
    temp: "",
    spo2: "",
    notes: "",
  });

  const chartData = useMemo(() => {
    return vitals
      .slice()
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
      .slice(-12)
      .map((v) => ({
        label: formatDate(v.recordedAt),
        pulse: parseVitalNum(v.pulse),
        sugar: parseVitalNum(v.sugar),
        spo2: parseVitalNum(v.spo2),
        bp: parseBpSystolic(v.bp),
      }))
      .filter((row) => row.pulse != null || row.sugar != null || row.spo2 != null || row.bp != null);
  }, [vitals]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save vitals");
      toast.error("Save failed", data.error);
      return;
    }
    toast.success("Vitals recorded");
    setForm((prev) => ({
      ...prev,
      bp: "",
      sugar: "",
      pulse: "",
      temp: "",
      spo2: "",
      notes: "",
    }));
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {error ? (
        <ErrorState
          title="Could not record vitals"
          description={error}
          onRetry={() => setError("")}
          retryLabel="Dismiss"
        />
      ) : null}

      {canWrite ? (
        <Panel title="Record vitals" subtitle="Capture BP, sugar, pulse, temperature, and SpO2.">
          {patients.length === 0 ? (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title="No patients available"
              description="Add or assign a patient before recording vitals."
            />
          ) : (
            <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-3">
              <FormField label="Patient *" className="sm:col-span-3">
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
              <FormField label="BP">
                <Input
                  placeholder="120/80"
                  value={form.bp}
                  onChange={(e) => setForm({ ...form, bp: e.target.value })}
                />
              </FormField>
              <FormField label="Sugar">
                <Input
                  value={form.sugar}
                  onChange={(e) => setForm({ ...form, sugar: e.target.value })}
                />
              </FormField>
              <FormField label="Pulse">
                <Input
                  value={form.pulse}
                  onChange={(e) => setForm({ ...form, pulse: e.target.value })}
                />
              </FormField>
              <FormField label="Temp">
                <Input
                  value={form.temp}
                  onChange={(e) => setForm({ ...form, temp: e.target.value })}
                />
              </FormField>
              <FormField label="SpO2">
                <Input
                  value={form.spo2}
                  onChange={(e) => setForm({ ...form, spo2: e.target.value })}
                />
              </FormField>
              <FormField label="Notes">
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </FormField>
              <div className="sm:col-span-3">
                <Button type="submit" loading={saving} disabled={saving}>
                  Record vitals
                </Button>
              </div>
            </form>
          )}
        </Panel>
      ) : null}

      {vitals.length > 0 && chartData.length > 0 ? (
        <Panel title="Trend sparkline" subtitle="Recent numeric readings (last 12)">
          <div className="h-52 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={colors.surfaceMuted} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: colors.muted }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: colors.muted }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: `1px solid ${colors.surfaceMuted}`,
                    background: colors.surface,
                    color: colors.heading,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: colors.muted }} />
                <Line
                  type="monotone"
                  dataKey="pulse"
                  name="Pulse"
                  stroke={colors.primary}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: colors.primary }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="sugar"
                  name="Sugar"
                  stroke={colors.accent}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: colors.accent }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="spo2"
                  name="SpO2"
                  stroke={colors.info}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: colors.info }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="bp"
                  name="BP (sys)"
                  stroke={colors.success}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={{ r: 2, fill: colors.success }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      ) : null}

      <Panel title="Vitals timeline" subtitle={`${vitals.length} entries`}>
        {vitals.length === 0 ? (
          <EmptyState
            icon={<HeartPulse className="h-5 w-5" />}
            title="No vitals yet"
            description="Record the first reading to start the clinical timeline."
          />
        ) : (
          <div className="space-y-1.5">
            {vitals.map((v) => {
              const patient = patients.find((p) => p.id === v.patientId);
              return (
                <ListTile key={v.id} className="animate-dash-in">
                  <ListTileHeader>
                    <h3 className="font-display text-lg text-heading">
                      {patient?.name || v.patientId}
                    </h3>
                    <span className="text-xs text-muted">{formatDateTime(v.recordedAt)}</span>
                  </ListTileHeader>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="vital-chip">
                      <span>BP</span>
                      <span>{v.bp || "—"}</span>
                    </div>
                    <div className="vital-chip">
                      <span>Sugar</span>
                      <span>{v.sugar || "—"}</span>
                    </div>
                    <div className="vital-chip">
                      <span>Pulse</span>
                      <span>{v.pulse || "—"}</span>
                    </div>
                    <div className="vital-chip">
                      <span>Temp</span>
                      <span>{v.temp || "—"}</span>
                    </div>
                    <div className="vital-chip">
                      <span>SpO2</span>
                      <span>{v.spo2 || "—"}</span>
                    </div>
                  </div>
                  {v.notes ? <p className="mt-3 text-sm text-heading">{v.notes}</p> : null}
                  <ListTileMeta className="mt-2">{v.recordedByName}</ListTileMeta>
                </ListTile>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
