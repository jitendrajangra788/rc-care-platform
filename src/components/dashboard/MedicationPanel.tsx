"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPlus, Trash2 } from "lucide-react";
import type { Booking, MedicationLog, MedicationType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePagedList } from "@/hooks/usePagedList";
import { PhotoCapture } from "@/components/dashboard/PhotoCapture";
import { Pagination } from "@/components/ui/Pagination";
import { toast } from "@/components/ui/toast";

const typeOptions: { value: MedicationType; label: string }[] = [
  { value: "injection", label: "Injection" },
  { value: "tablet", label: "Tablet" },
  { value: "syrup", label: "Syrup" },
  { value: "iv", label: "IV Infusion" },
  { value: "ointment", label: "Ointment" },
  { value: "other", label: "Other" },
];

const typeBadge: Record<MedicationType, string> = {
  injection: "bg-[#fde8e4] text-[#c45c4a]",
  tablet: "bg-[#e8f1fb] text-sea",
  syrup: "bg-[#eef8f0] text-mint",
  iv: "bg-[#f3eef8] text-[#6b4f9a]",
  ointment: "bg-[#fff4e5] text-[#b7791f]",
  other: "bg-paper-2 text-ink-soft",
};

export function MedicationPanel({
  duties,
  logs,
}: {
  duties: Booking[];
  logs: MedicationLog[];
}) {
  const router = useRouter();
  const [bookingId, setBookingId] = useState(duties[0]?.id || "");
  const [medicineName, setMedicineName] = useState("");
  const [type, setType] = useState<MedicationType>("injection");
  const [dose, setDose] = useState("");
  const [route, setRoute] = useState("");
  const [notes, setNotes] = useState("");
  const [timeGiven, setTimeGiven] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setOk("");
    const res = await fetch("/api/medications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        medicineName,
        type,
        dose,
        route,
        notes,
        timeGiven: timeGiven ? new Date(timeGiven).toISOString() : undefined,
        photoDataUrl: photoDataUrl || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save entry");
      toast.error("Medicine chart save failed", data.error);
      return;
    }
    setOk("Entry added to medicine chart");
    toast.success("Saved successfully", `${medicineName} added to medicine chart`);
    setMedicineName("");
    setDose("");
    setRoute("");
    setNotes("");
    setTimeGiven("");
    setPhotoDataUrl(null);
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!confirm("Remove this chart entry?")) return;
    const res = await fetch(`/api/medications?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error("Delete failed", data.error);
      return;
    }
    toast.success("Entry removed successfully");
    router.refresh();
  }

  const selected = duties.find((d) => d.id === bookingId);
  const {
    page,
    pageCount,
    pageSize,
    rows: logRows,
    setPage,
    setPageSize,
  } = usePagedList(logs, 8);

  const injectCount = logs.filter((l) => l.type === "injection" || l.type === "iv").length;

  return (
    <div className="space-y-2">
      <div className="nurse-hero grid gap-2 p-2.5 md:grid-cols-[1.2fr_0.8fr] md:p-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Clinical record · MAR
          </p>
          <h2 className="font-display mt-1 text-2xl tracking-[-0.03em] text-heading md:text-3xl">
            Log medicine given
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-muted">
            Tablets, syrups, injections, and IV — dose, route, time, optional photo.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 self-end">
          <div className="nurse-hero-chip text-center">
            <p className="text-xl font-semibold text-heading">{logs.length}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted">Entries</p>
          </div>
          <div className="nurse-hero-chip text-center">
            <p className="text-xl font-semibold text-heading">{injectCount}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted">Inject / IV</p>
          </div>
          <div className="nurse-hero-chip text-center">
            <p className="text-xl font-semibold text-heading">{duties.length}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted">Patients</p>
          </div>
        </div>
      </div>

      <div className="grid gap-2 xl:grid-cols-[0.95fr_1.05fr]">
        {/* Entry form */}
        <form onSubmit={onSubmit} className="soft-panel space-y-2 rounded-[var(--radius-xl)] p-2.5 md:p-3">
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white">
              <ClipboardPlus className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-display text-xl text-heading">New chart entry</h3>
              <p className="text-sm text-muted">Fill after giving medicine</p>
            </div>
          </div>

          {duties.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] bg-paper-2 px-4 py-3 text-center text-sm text-muted">
              No active patient assigned to you. You can still review your past entries on the
              right — new logs unlock after care desk assigns a duty.
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium text-heading">
                Patient
                <select
                  className="field mt-1.5"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  required
                >
                  {duties.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.patientName} · {d.id}
                    </option>
                  ))}
                </select>
              </label>

              {selected ? (
                <div className="rounded-2xl bg-paper-2 px-4 py-3 text-sm">
                  <p className="font-name">{selected.patientName}</p>
                  <p className="mt-1 text-muted">
                    {selected.careType} · {selected.shift} · {selected.address}
                  </p>
                </div>
              ) : null}

              <div>
                <p className="mb-2 text-sm font-medium text-heading">Drug type</p>
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setType(opt.value)}
                      className={cn(
                        "btn btn-sm",
                        type === opt.value ? "btn-primary" : "btn-outline",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Drug name *
                  <input
                    className="field mt-1.5"
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    placeholder="e.g. Ceftriaxone / Insulin"
                    required
                  />
                </label>
                <label className="block text-sm font-medium">
                  Dose *
                  <input
                    className="field mt-1.5"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    placeholder="e.g. 1g / 10 units / 5ml"
                    required
                  />
                </label>
                <label className="block text-sm font-medium">
                  Route of administration
                  <input
                    className="field mt-1.5"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    placeholder="Oral / IM / IV / SC"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Time administered
                  <input
                    className="field mt-1.5"
                    type="datetime-local"
                    value={timeGiven}
                    onChange={(e) => setTimeGiven(e.target.value)}
                  />
                </label>
              </div>

              <label className="block text-sm font-medium">
                Nurse remarks
                <textarea
                  className="field mt-1.5"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Before food, after sugar check, no adverse reaction..."
                />
              </label>

              <PhotoCapture
                value={photoDataUrl}
                onChange={setPhotoDataUrl}
                title="Attach vial / site photo"
                hint="Optional clinical evidence"
                captureMode="environment"
                previewClassName="h-36 rounded-xl"
              />

              <button type="submit" disabled={saving} className="btn btn-primary w-full">
                {saving ? "Saving to chart…" : "Add to medicine chart"}
              </button>
              {error ? (
                <p className="rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-danger">{error}</p>
              ) : null}
              {ok ? (
                <p className="rounded-2xl bg-[var(--success-soft)] px-4 py-3 text-sm text-success">{ok}</p>
              ) : null}
            </>
          )}
        </form>

        {/* Chart table */}
        <section className="soft-panel overflow-hidden rounded-[1.75rem]">
          <div className="border-b border-[var(--line)] px-3 py-2 md:px-3">
            <h3 className="font-display text-2xl">Administered drugs</h3>
            <p className="mt-1 text-sm text-ink-soft">Only your logged entries (admin sees all nurses)</p>
          </div>

          {logs.length === 0 ? (
            <div className="px-3 py-2 text-center text-sm text-ink-soft md:px-3">
              Chart is empty. Add the first administered drug.
            </div>
          ) : (
            <div className="divide-y divide-[var(--line)]">
              {logRows.map((m, index) => (
                <article key={m.id} className="px-3 py-2 md:px-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-ink-soft">
                          #{logs.length - ((page - 1) * pageSize + index)}
                        </span>
                        <h4 className="font-semibold text-ink">{m.medicineName}</h4>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            typeBadge[m.type],
                          )}
                        >
                          {m.type}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-ink-soft">
                        {m.patientName} · <span className="font-medium text-ink">Dose {m.dose}</span>
                        {m.route ? ` · ${m.route}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-ink-soft">
                        Given {new Date(m.timeGiven).toLocaleString("en-IN")} · {m.bookingId}
                      </p>
                      {m.notes ? (
                        <p className="mt-2 rounded-xl bg-paper-2 px-3 py-2 text-sm text-ink-soft">
                          {m.notes}
                        </p>
                      ) : null}
                      {m.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.photoUrl}
                          alt={m.medicineName}
                          className="mt-3 h-24 w-36 rounded-xl object-cover"
                        />
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(m.id)}
                      className="rounded-full bg-[#fde8e4] p-2 text-[#c45c4a]"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
              <div className="px-3 py-2">
                <Pagination
                  page={page}
                  pageCount={pageCount}
                  pageSize={pageSize}
                  total={logs.length}
                  filteredCount={logs.length}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[5, 8, 15, 30]}
                  noun="entries"
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}