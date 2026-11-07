"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Paperclip, Upload } from "lucide-react";
import type { Booking } from "@/lib/types";
import { todayISO } from "@/lib/schedule";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Input";
import { Panel } from "@/components/dashboard/DashboardShell";

export function NurseCompleteReportForm({
  patientId,
  patientName,
  bookings,
  defaultBookingId,
}: {
  patientId: string;
  patientName: string;
  bookings: Booking[];
  defaultBookingId?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    bookingId: defaultBookingId || bookings[0]?.id || "",
    dutyDate: todayISO(),
    summary: "",
    conditionNote: "",
    vitalsNote: "",
    medsNote: "",
    tasksDone: "",
    familyUpdate: "",
  });

  async function onFile(file: File | null) {
    if (!file) {
      setFileName("");
      setFileDataUrl(null);
      return;
    }
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Invalid file", "Upload image or PDF only");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("File too large", "Keep under 6 MB");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });
    setFileName(file.name);
    setFileDataUrl(dataUrl);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/care-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId,
        bookingId: form.bookingId || undefined,
        dutyDate: form.dutyDate,
        reportType: "complete",
        summary: form.summary,
        conditionNote: form.conditionNote || undefined,
        vitalsNote: form.vitalsNote || undefined,
        medsNote: form.medsNote || undefined,
        tasksDone: form.tasksDone || undefined,
        familyUpdate: form.familyUpdate || undefined,
        attachmentName: fileName || undefined,
        fileDataUrl: fileDataUrl || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error("Report upload failed", data.error);
      return;
    }
    toast.success("Complete care report uploaded", patientName);
    setForm((prev) => ({
      ...prev,
      summary: "",
      conditionNote: "",
      vitalsNote: "",
      medsNote: "",
      tasksDone: "",
      familyUpdate: "",
    }));
    setFileName("");
    setFileDataUrl(null);
    router.refresh();
  }

  return (
    <Panel
      title="Complete care report"
      subtitle="Full shift report with optional PDF/image attachment for desk & family."
      action={<FileUp className="h-5 w-5 text-primary" />}
    >
      <form onSubmit={onSubmit} className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <FormField label="Linked duty">
            <Select
              value={form.bookingId}
              onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
            >
              <option value="">No booking link</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id} · {b.careType} · {b.status}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Duty date *">
            <Input
              type="date"
              required
              value={form.dutyDate}
              onChange={(e) => setForm({ ...form, dutyDate: e.target.value })}
            />
          </FormField>
        </div>

        <FormField label="Complete summary *">
          <Textarea
            required
            rows={4}
            placeholder="Patient condition, care given, observations, handover notes…"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
        </FormField>

        <FormField label="Patient condition">
          <Textarea
            rows={2}
            placeholder="Mobility, appetite, pain, mood, sleep…"
            value={form.conditionNote}
            onChange={(e) => setForm({ ...form, conditionNote: e.target.value })}
          />
        </FormField>

        <div className="grid gap-2 sm:grid-cols-2">
          <FormField label="Vitals note">
            <Input
              placeholder="BP / sugar / pulse highlights"
              value={form.vitalsNote}
              onChange={(e) => setForm({ ...form, vitalsNote: e.target.value })}
            />
          </FormField>
          <FormField label="Medicine note">
            <Input
              placeholder="Meds given / skipped / reaction"
              value={form.medsNote}
              onChange={(e) => setForm({ ...form, medsNote: e.target.value })}
            />
          </FormField>
        </div>

        <FormField label="Tasks completed">
          <Textarea
            rows={2}
            placeholder="Bathing, feeding, wound care, physio, catheter…"
            value={form.tasksDone}
            onChange={(e) => setForm({ ...form, tasksDone: e.target.value })}
          />
        </FormField>

        <FormField label="Family update">
          <Textarea
            rows={2}
            placeholder="What family should know about today’s care"
            value={form.familyUpdate}
            onChange={(e) => setForm({ ...form, familyUpdate: e.target.value })}
          />
        </FormField>

        <div className="rounded-[var(--radius-lg)] border border-dashed border-primary/30 bg-[var(--primary-soft)]/40 p-3">
          <p className="text-sm font-semibold text-heading">Attach report file (optional)</p>
          <p className="mt-0.5 text-xs text-muted">PDF or image · max 6 MB</p>
          <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--line)] bg-surface px-3 py-2.5 text-sm font-medium text-heading transition hover:bg-paper-2">
            <Paperclip className="h-4 w-4 text-primary" />
            <span className="truncate">{fileName || "Choose PDF / image"}</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0] || null)}
            />
          </label>
          {fileDataUrl ? (
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-danger"
              onClick={() => void onFile(null)}
            >
              Remove attachment
            </button>
          ) : null}
        </div>

        <Button type="submit" loading={saving} disabled={saving} className="w-full sm:w-auto">
          <Upload className="h-4 w-4" />
          Upload complete report
        </Button>
      </form>
    </Panel>
  );
}
