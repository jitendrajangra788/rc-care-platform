"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Input";
import { toast } from "@/components/ui/toast";
import { HOME_STATUS_LABEL, HOME_STATUSES } from "@/lib/enquiry-options";
import type { DocumentMeta, HomeCareRequest, HomeCareRequestStatus } from "@/lib/types";

type Row = Omit<HomeCareRequest, "documents"> & { documents: DocumentMeta[] };
type StaffOption = { id: string; name: string; role: string };

const tone: Record<HomeCareRequestStatus, "warning" | "primary" | "accent" | "success" | "danger" | "neutral"> = {
  new: "warning",
  contacted: "primary",
  assessment_scheduled: "primary",
  quotation_sent: "accent",
  confirmed: "success",
  converted: "success",
  rejected: "danger",
  cancelled: "danger",
};

function label(status: string) {
  return HOME_STATUS_LABEL[status as HomeCareRequestStatus] || status;
}

export function HomeCareRequestDetail({
  request,
  staff,
  canConvert,
}: {
  request: Row;
  staff: StaffOption[];
  canConvert: boolean;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(request);
  const [notes, setNotes] = useState(request.adminNotes || "");
  const [nextStatus, setNextStatus] = useState<HomeCareRequestStatus>(request.status);
  const [staffId, setStaffId] = useState(request.assignedStaffId || "");
  const [busy, setBusy] = useState(false);

  async function save(action: "update" | "convert") {
    setBusy(true);
    try {
      if (
        action === "update" ||
        nextStatus !== current.status ||
        notes !== (current.adminNotes || "") ||
        staffId !== (current.assignedStaffId || "")
      ) {
        const res = await fetch("/api/home-care-requests", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: current.id,
            action: "update",
            status: nextStatus,
            adminNotes: notes,
            assignedStaffId: staffId || null,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error("Could not update request", data.error || "Try again");
          return;
        }
        setCurrent(data.request);
        setNextStatus(data.request.status);
        if (action === "update") {
          toast.success("Request updated", data.request.id);
          router.refresh();
          return;
        }
      }
      if (action === "convert") {
        const res = await fetch("/api/home-care-requests", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: current.id, action: "convert" }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error("Booking was not created", data.error || "Try again");
          return;
        }
        setCurrent(data.request);
        setNextStatus(data.request.status);
        toast.success(
          data.linkedExisting ? "Linked existing patient" : "Patient and booking created",
          data.bookingId,
        );
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="space-y-3 rounded-xl border border-[var(--line)] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted">
              {current.patientAge} yrs · {current.patientGender} · received {current.createdAt.slice(0, 10)}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={tone[current.status]}>{label(current.status)}</Badge>
            {current.urgency === "Urgent" ? <Badge tone="danger">Urgent</Badge> : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <a className="btn btn-outline btn-sm" href={`tel:${current.mobile}`}>Call</a>
          <a className="btn btn-outline btn-sm" href={`https://wa.me/91${current.mobile.replace(/\D/g, "").slice(-10)}`}>WhatsApp</a>
          {current.email ? (
            <a className="btn btn-outline btn-sm" href={`mailto:${current.email}`}>Email</a>
          ) : null}
        </div>

        <div className="grid gap-1.5 sm:grid-cols-2">
          <Fact label="Contact" value={`${current.contactName} · ${current.relationship}`} />
          <Fact label="Mobile" value={current.mobile} />
          <Fact label="Service" value={current.service} />
          <Fact label="Duty" value={`${current.dutyHours} · ${current.preferredShift}`} />
          <Fact label="Start" value={current.preferredStartDate} />
          <Fact label="Area" value={`${current.area}, ${current.city}`} />
        </div>
        <p className="rounded-lg bg-[#F7FAF9] px-2.5 py-2 text-sm text-[#172D3A]">
          {current.address}
          {current.landmark ? `, ${current.landmark}` : ""}
          {` · ${current.state} ${current.pinCode}`}
        </p>
        <p className="text-sm leading-relaxed text-[#172D3A]">{current.careDescription}</p>
        {current.specialCare ? <p className="text-xs text-muted">Special care: {current.specialCare}</p> : null}
        {current.doctorInstructions ? <p className="text-xs text-muted">Doctor: {current.doctorInstructions}</p> : null}
        {current.mobilityAssistance ? <p className="text-xs font-medium text-[#087F8C]">Mobility assistance required</p> : null}

        {current.documents.length ? (
          <div className="flex flex-wrap gap-1.5">
            {current.documents.map((doc) => (
              <a
                key={doc.id}
                className="rounded-full bg-[#DDF5EC] px-2.5 py-1 text-xs font-semibold text-[#087F8C] hover:underline"
                href={`/api/home-care-requests/file?id=${current.id}&file=${doc.id}`}
              >
                {doc.label}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">No documents uploaded.</p>
        )}

        {current.bookingId ? (
          <p className="rounded-lg border border-[var(--line)] px-2.5 py-2 text-sm">
            Booking{" "}
            <Link className="font-semibold text-[#087F8C]" href="/dashboard/admin/bookings">
              {current.bookingId}
            </Link>
            {current.patientId ? (
              <>
                {" "}· Patient{" "}
                <Link className="font-semibold text-[#087F8C]" href={`/dashboard/admin/patients/${current.patientId}`}>
                  {current.patientId}
                </Link>
              </>
            ) : null}
          </p>
        ) : null}

        <ol className="space-y-2 border-t border-[var(--line)] pt-3">
          {current.history.map((event, index) => (
            <li key={`${event.at}-${index}`} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2 text-xs">
              <span className="text-muted">{event.at.slice(5, 16).replace("T", " ")}</span>
              <span className="text-[#172D3A]">
                <span className="font-semibold">{event.action}</span>
                {event.from && event.to ? ` · ${label(event.from)} → ${label(event.to)}` : ""}
                {event.note ? ` · ${event.note}` : ""}
                {event.actorName ? <span className="text-muted"> · {event.actorName}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-2 rounded-xl border border-[var(--line)] bg-white p-4 lg:sticky lg:top-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Desk action</p>
        <label className="block text-sm font-medium text-[#172D3A]">
          Status
          <Select
            className="mt-1"
            value={current.status === "converted" ? "converted" : nextStatus}
            onChange={(e) => setNextStatus(e.target.value as HomeCareRequestStatus)}
            disabled={current.status === "converted"}
          >
            {HOME_STATUSES.filter((item) => item !== "converted" || current.status === "converted").map((item) => (
              <option key={item} value={item}>
                {HOME_STATUS_LABEL[item]}
              </option>
            ))}
          </Select>
        </label>
        <label className="block text-sm font-medium text-[#172D3A]">
          Assign staff
          <Select
            className="mt-1"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            disabled={current.status === "converted"}
          >
            <option value="">Unassigned</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} · {member.role}
              </option>
            ))}
          </Select>
        </label>
        <label className="block text-sm font-medium text-[#172D3A]">
          Admin notes
          <Textarea className="mt-1 min-h-16" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => save("update")} loading={busy} disabled={busy}>
            Save update
          </Button>
          {canConvert && current.status !== "converted" ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => save("convert")}
              loading={busy}
              disabled={busy || nextStatus !== "confirmed"}
            >
              Convert to booking
            </Button>
          ) : null}
        </div>
        <p className="text-[11px] leading-relaxed text-muted">
          Set status to Confirmed, then convert. A matching patient name and mobile is linked. The request stays unconverted if the booking fails.
        </p>
      </section>
    </div>
  );
}

function Fact({ label: name, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#F7FAF9] px-2.5 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{name}</p>
      <p className="mt-0.5 text-sm leading-snug text-[#172D3A]">{value}</p>
    </div>
  );
}
