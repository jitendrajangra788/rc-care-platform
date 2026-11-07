"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Download,
  HeartPulse,
  MessageCircle,
  ShieldAlert,
} from "lucide-react";
import type {
  Attendance,
  Booking,
  CareNote,
  Invoice,
  MedSchedule,
  MedicationLog,
  Staff,
} from "@/lib/types";
import { dutyProgress, todayDutyDate } from "@/lib/duty";
import { cn, formatINR } from "@/lib/utils";
import { waLink, waTemplates } from "@/lib/whatsapp";
import { toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";

export function FamilyLiveCare({
  bookings,
  staff,
  attendance,
  notes,
  medications,
  schedules,
  invoices,
}: {
  bookings: Booking[];
  staff: Staff[];
  attendance: Attendance[];
  notes: CareNote[];
  medications: MedicationLog[];
  schedules: MedSchedule[];
  invoices: Invoice[];
}) {
  const router = useRouter();
  const today = todayDutyDate();
  const [bookingId, setBookingId] = useState(bookings[0]?.id || "");
  const [sosOpen, setSosOpen] = useState(false);
  const [sosSending, setSosSending] = useState(false);
  const selected = bookings.find((b) => b.id === bookingId) || bookings[0];
  const nurse = staff.find((s) => s.id === selected?.assignedStaffId);
  const progress = useMemo(
    () => (selected ? dutyProgress(attendance, selected.id, today) : null),
    [attendance, selected, today],
  );
  const photos = attendance.filter((a) => a.bookingId === selected?.id).slice(0, 8);
  const vitals = notes
    .filter((n) => n.bookingId === selected?.id)
    .slice(0, 8)
    .reverse();
  const timeline = useMemo(() => {
    if (!selected) return [];
    const items: { id: string; at: string; title: string; detail: string; kind: string }[] = [];
    for (const a of attendance.filter((x) => x.bookingId === selected.id)) {
      items.push({
        id: `a-${a.id}`,
        at: a.createdAt,
        title: `${a.type === "evening" || a.type === "checkout" ? "Evening" : "Morning"} check-in`,
        detail: a.dutyDate || a.createdAt.slice(0, 10),
        kind: "attendance",
      });
    }
    for (const n of notes.filter((x) => x.bookingId === selected.id)) {
      items.push({
        id: `n-${n.id}`,
        at: n.createdAt,
        title: "Care update",
        detail: n.notes,
        kind: "note",
      });
    }
    for (const m of medications.filter((x) => x.bookingId === selected.id)) {
      items.push({
        id: `m-${m.id}`,
        at: m.timeGiven,
        title: `Medicine · ${m.medicineName}`,
        detail: `Dose ${m.dose}${m.route ? ` · ${m.route}` : ""}`,
        kind: "med",
      });
    }
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
  }, [attendance, notes, medications, selected]);

  async function raiseSos(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setSosSending(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/extra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "sos",
        bookingId: selected.id,
        message: fd.get("message"),
      }),
    });
    const data = await res.json();
    setSosSending(false);
    if (!res.ok) {
      toast.error("SOS failed", data.error);
      return;
    }
    toast.success("SOS sent to care desk");
    e.currentTarget.reset();
    setSosOpen(false);
    router.refresh();
  }

  if (!selected) {
    return (
      <EmptyState
        title="No bookings linked yet"
        description="Request care to start viewing live duty status and nurse updates."
      />
    );
  }

  const inv = invoices.find((i) => i.bookingId === selected.id);
  const upi = selected.upiId || "roshancare@upi";
  const due = inv ? inv.amount - inv.paid : 0;
  const bookingSchedules = schedules.filter((s) => s.bookingId === selected.id);
  const givenMeds = medications.filter((m) => m.bookingId === selected.id).slice(0, 5);

  return (
    <div className="dash-stack">
      <div className="flex flex-wrap gap-2">
        {bookings.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBookingId(b.id)}
            className={cn(
              "btn btn-sm",
              b.id === selected.id ? "btn-primary" : "btn-outline",
            )}
          >
            {b.patientName}
          </button>
        ))}
      </div>

      <section className="soft-panel rounded-[var(--radius-2xl)] p-2.5 md:p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-label text-primary">Care status · {today}</p>
            <h2 className="font-name mt-2 text-3xl text-heading">{selected.patientName}</h2>
            <p className="mt-1 text-sm text-muted">
              {selected.careType} · {selected.shift} · {selected.address}
            </p>
          </div>
          <Badge tone={selected.status === "active" ? "success" : "primary"}>
            {selected.status}
          </Badge>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-[var(--radius-xl)] bg-paper-2 p-4">
          <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {nurse?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={nurse.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (nurse?.name || "?").slice(0, 1)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Assigned nurse</p>
            <p className="font-name text-lg text-heading">{nurse?.name || "Assigning soon"}</p>
            <p className="text-sm text-muted">
              {nurse?.role || "Pending"}
              {nurse?.phone ? ` · ${nurse.phone}` : ""}
            </p>
          </div>
          {nurse?.phone ? (
            <a href={`tel:${nurse.phone}`} className="btn btn-outline btn-sm">
              Call nurse
            </a>
          ) : null}
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <StatusCard
            label="Morning"
            ok={Boolean(progress?.morningDone)}
            text={progress?.morningDone ? "Present + photo done" : "Waiting"}
          />
          <StatusCard
            label="Evening"
            ok={Boolean(progress?.eveningDone)}
            text={
              progress?.eveningDone
                ? "Complete photo done"
                : progress?.morningDone
                  ? "Pending"
                  : "Locked until morning"
            }
          />
          <StatusCard
            label="Duty"
            ok={Boolean(progress?.complete)}
            text={progress?.complete ? "Complete today" : "Incomplete"}
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          Status is based on saved attendance check-ins — not live GPS tracking.
        </p>
      </section>

      <section className="soft-panel rounded-[var(--radius-2xl)] p-2.5 md:p-3">
        <h3 className="font-display text-2xl text-heading">Care activity timeline</h3>
        <p className="mt-1 text-sm text-muted">Check-ins, medicines, and nurse notes from stored records.</p>
        <div className="mt-1.5 space-y-1.5">
          {timeline.length === 0 ? (
            <p className="text-sm text-muted">Activity appears after the nurse starts duty documentation.</p>
          ) : (
            timeline.map((item) => (
              <div
                key={item.id}
                className="flex gap-2 rounded-[var(--radius-lg)] border border-[var(--line)] px-4 py-3"
              >
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="font-semibold text-heading">{item.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted">{item.detail}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(item.at).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="soft-panel rounded-[var(--radius-2xl)] p-2.5 md:p-3">
        <h3 className="font-display text-2xl text-heading">Site photo timeline</h3>
        <p className="mt-1 text-sm text-muted">Photos captured when staff marked present at the care site.</p>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {photos.length === 0 ? (
            <p className="text-sm text-muted sm:col-span-2">
              Photos appear after staff marks morning or evening present.
            </p>
          ) : (
            photos.map((p) => (
              <article
                key={p.id}
                className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photoUrl} alt={p.type} className="h-32 w-full object-cover" />
                <p className="p-2.5 text-xs capitalize text-muted">
                  {p.type} · {p.dutyDate}
                  {p.gpsQuality ? ` · GPS ${p.gpsQuality}` : ""}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="soft-panel rounded-[var(--radius-2xl)] p-2.5 md:p-3">
        <h3 className="font-display text-2xl text-heading">Medicine schedule</h3>
        <div className="mt-3 space-y-2">
          {bookingSchedules.length === 0 && givenMeds.length === 0 ? (
            <p className="text-sm text-muted">No medicine schedule or administered drugs yet.</p>
          ) : null}
          {bookingSchedules.map((s) => (
            <div key={s.id} className="rounded-[var(--radius-lg)] bg-paper-2 px-4 py-3 text-sm">
              <p className="font-semibold text-heading">
                {s.medicineName} · {s.dose}
              </p>
              <p className="text-muted">Times: {s.times.join(", ")}</p>
            </div>
          ))}
          {givenMeds.map((m) => (
            <p key={m.id} className="text-sm text-muted">
              Given: {m.medicineName} · {new Date(m.timeGiven).toLocaleString("en-IN")}
            </p>
          ))}
          <Link href="/dashboard/family/medications" className="btn btn-ghost btn-sm mt-2">
            Full medicine chart
          </Link>
        </div>
      </section>

      <section className="soft-panel rounded-[var(--radius-2xl)] p-2.5 md:p-3">
        <h3 className="font-display text-2xl text-heading">Vitals trend</h3>
        <div className="mt-1.5 space-y-2">
          {vitals.length === 0 ? (
            <p className="text-sm text-muted">No vitals yet.</p>
          ) : (
            vitals.map((n) => (
              <div
                key={n.id}
                className="grid grid-cols-2 gap-2 rounded-[var(--radius-lg)] bg-paper-2 px-3 py-2.5 text-xs sm:grid-cols-5 md:text-sm"
              >
                <span className="font-medium text-heading">
                  {new Date(n.createdAt).toLocaleDateString("en-IN")}
                </span>
                <span>BP {n.vitals.bp || "—"}</span>
                <span>Sugar {n.vitals.sugar || "—"}</span>
                <span>Pulse {n.vitals.pulse || "—"}</span>
                <span>Temp {n.vitals.temp || "—"}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="soft-panel rounded-[var(--radius-2xl)] p-2.5 md:p-3">
        <h3 className="font-display text-2xl text-heading">Invoice & payment</h3>
        {inv ? (
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-heading">
                Invoice {inv.id}: {formatINR(inv.amount)} · Paid {formatINR(inv.paid)} · Due{" "}
                {formatINR(due)}
              </p>
              <Badge
                tone={inv.status === "paid" ? "success" : inv.status === "partial" ? "warning" : "danger"}
              >
                {inv.status}
              </Badge>
            </div>
            <p className="text-muted">UPI ID: {upi}</p>
            <div className="flex flex-wrap gap-2">
              {due > 0 ? (
                <a
                  href={`upi://pay?pa=${encodeURIComponent(upi)}&pn=Roshan%20Care&am=${due}&cu=INR&tn=${encodeURIComponent(selected.patientName)}`}
                  className="btn btn-primary btn-sm"
                >
                  Pay via UPI app
                </a>
              ) : null}
              <a
                href={waLink(
                  "7073231360",
                  waTemplates.invoiceDue(selected.patientName, due, inv.dueDate),
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp desk
              </a>
              <a
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                  `Roshan Care Invoice\n${inv.id}\nPatient: ${inv.patientName}\nAmount: ${inv.amount}\nPaid: ${inv.paid}\nDue: ${due}\nDue date: ${inv.dueDate}\nUPI: ${upi}`,
                )}`}
                download={`${inv.id}.txt`}
                className="btn btn-outline btn-sm"
              >
                <Download className="h-3.5 w-3.5" /> Download invoice
              </a>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">No invoice yet for this booking.</p>
        )}
      </section>

      {/* SOS — manual only, never auto-triggered */}
      <section className="overflow-hidden rounded-[var(--radius-2xl)] border-2 border-danger/30 bg-[var(--danger-soft)]">
        <div className="flex flex-wrap items-start justify-between gap-2 p-2.5 md:p-3">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-danger">
              <ShieldAlert className="h-5 w-5" />
              <p className="text-label">Emergency</p>
            </div>
            <h3 className="font-display mt-2 text-2xl text-heading md:text-3xl">SOS alert</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Only send when you need urgent help. This never triggers automatically — you must
              confirm and submit a message.
            </p>
          </div>
          {!sosOpen ? (
            <Button
              variant="danger"
              className="min-h-12 min-w-[10rem] text-base"
              onClick={() => setSosOpen(true)}
            >
              <AlertTriangle className="h-4 w-4" /> Open SOS
            </Button>
          ) : null}
        </div>

        {sosOpen ? (
          <form onSubmit={raiseSos} className="space-y-1.5 border-t border-danger/20 bg-surface/80 p-2.5 md:p-3">
            <Alert tone="warning">
              Care desk and assigned staff will be alerted. Use only for real emergencies.
            </Alert>
            <label className="block text-sm font-medium text-heading">
              What happened?
              <textarea
                name="message"
                className="field mt-1.5"
                rows={3}
                placeholder="Describe the emergency…"
                required
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="danger" loading={sosSending} disabled={sosSending}>
                <HeartPulse className="h-4 w-4" /> Confirm & send SOS
              </Button>
              <Button type="button" variant="outline" onClick={() => setSosOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  );
}

function StatusCard({ label, ok, text }: { label: string; ok: boolean; text: string }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] px-4 py-3",
        ok ? "bg-[var(--success-soft)]" : "bg-paper-2",
      )}
    >
      <p className="text-label text-muted">{label}</p>
      <p className={cn("mt-1 font-semibold", ok ? "text-success" : "text-heading")}>{text}</p>
    </div>
  );
}
