"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatCard } from "@/components/ui/StatCard";
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

export function HomeCareRequestsManager({
  requests,
  staff,
  canConvert,
}: {
  requests: Row[];
  staff: StaffOption[];
  canConvert: boolean;
}) {
  const [rows, setRows] = useState(requests);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState(requests[0]?.id || "");
  const [notes, setNotes] = useState(requests[0]?.adminNotes || "");
  const [nextStatus, setNextStatus] = useState<HomeCareRequestStatus>(requests[0]?.status || "new");
  const [staffId, setStaffId] = useState(requests[0]?.assignedStaffId || "");
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => {
    const open = rows.filter((row) =>
      ["contacted", "assessment_scheduled", "quotation_sent", "confirmed"].includes(row.status),
    ).length;
    return {
      total: rows.length,
      fresh: rows.filter((row) => row.status === "new").length,
      open,
      converted: rows.filter((row) => row.status === "converted").length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      const day = row.createdAt.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (!q) return true;
      return [row.id, row.contactName, row.patientName, row.mobile, row.area, row.city, row.service]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, query, status, from, to]);

  const selected = rows.find((row) => row.id === selectedId) || null;

  function openRow(row: Row) {
    setSelectedId(row.id);
    setNotes(row.adminNotes || "");
    setNextStatus(row.status);
    setStaffId(row.assignedStaffId || "");
  }

  async function save(action: "update" | "convert") {
    if (!selected) return;
    setBusy(true);
    try {
      if (action === "update" || nextStatus !== selected.status || notes !== (selected.adminNotes || "") || staffId !== (selected.assignedStaffId || "")) {
        const res = await fetch("/api/home-care-requests", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selected.id,
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
        setRows((current) => current.map((row) => (row.id === data.request.id ? data.request : row)));
        if (action === "update") {
          toast.success("Request updated", data.request.id);
          return;
        }
      }
      if (action === "convert") {
        const res = await fetch("/api/home-care-requests", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selected.id, action: "convert" }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error("Booking was not created", data.error || "Try again");
          return;
        }
        setRows((current) => current.map((row) => (row.id === data.request.id ? data.request : row)));
        setNextStatus(data.request.status);
        toast.success(
          data.linkedExisting ? "Linked existing patient" : "Patient and booking created",
          data.bookingId,
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="dash-grid-stats cols-4">
        <StatCard label="Total" value={String(stats.total)} />
        <StatCard label="New Request" value={String(stats.fresh)} tone="warning" />
        <StatCard label="In progress" value={String(stats.open)} tone="primary" />
        <StatCard label="Converted to Booking" value={String(stats.converted)} tone="success" />
      </div>

      <div className="grid gap-3 rounded-xl border border-[var(--line)] bg-white p-3 md:grid-cols-[1.4fr_1fr_auto_auto]">
        <SearchInput value={query} onChange={setQuery} placeholder="Search name, mobile, area, reference" aria-label="Search home care requests" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">All statuses</option>
          {HOME_STATUSES.map((item) => (
            <option key={item} value={item}>
              {HOME_STATUS_LABEL[item]}
            </option>
          ))}
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
          {filtered.length === 0 ? (
            <EmptyState title="No requests" description="Try another search or status filter." />
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {filtered.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => openRow(row)}
                    className={`w-full px-3 py-3 text-left transition hover:bg-[#F7FAF9] ${
                      row.id === selectedId ? "bg-[#DDF5EC]" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#172D3A]">{row.patientName}</p>
                        <p className="text-xs text-muted">
                          {row.id} · {row.service} · {row.area}
                        </p>
                      </div>
                      <Badge tone={tone[row.status]}>{label(row.status)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {row.contactName} · {row.mobile} · {row.createdAt.slice(0, 10)}
                      {row.urgency === "Urgent" ? " · Urgent" : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected ? (
          <aside className="space-y-4 rounded-xl border border-[var(--line)] bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#087F8C]">{selected.id}</p>
                <h2 className="font-display text-2xl text-[#172D3A]">{selected.patientName}</h2>
              </div>
              <Badge tone={tone[selected.status]}>{label(selected.status)}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="btn btn-outline btn-sm" href={`tel:${selected.mobile}`}>
                Call
              </a>
              <a className="btn btn-outline btn-sm" href={`https://wa.me/91${selected.mobile}`}>
                WhatsApp
              </a>
              {selected.email ? (
                <a className="btn btn-outline btn-sm" href={`mailto:${selected.email}`}>
                  Email
                </a>
              ) : null}
            </div>
            <dl className="space-y-1 text-sm text-[#172D3A]">
              <div>Contact: {selected.contactName} · {selected.relationship}</div>
              <div>Age {selected.patientAge} · {selected.patientGender}</div>
              <div>{selected.address}{selected.landmark ? `, ${selected.landmark}` : ""}</div>
              <div>{selected.area}, {selected.city}, {selected.state} {selected.pinCode}</div>
              <div>{selected.dutyHours} · {selected.preferredShift} · starts {selected.preferredStartDate}</div>
              <div>Urgency: {selected.urgency}</div>
            </dl>
            <p className="text-sm leading-relaxed text-muted">{selected.careDescription}</p>
            {selected.specialCare ? <p className="text-sm text-muted">Special care: {selected.specialCare}</p> : null}
            {selected.doctorInstructions ? <p className="text-sm text-muted">Doctor: {selected.doctorInstructions}</p> : null}
            {selected.mobilityAssistance ? <p className="text-sm text-muted">Mobility assistance required</p> : null}

            {selected.documents.length ? (
              <ul className="space-y-1 text-sm">
                {selected.documents.map((doc) => (
                  <li key={doc.id}>
                    <a className="font-semibold text-[#087F8C] hover:underline" href={`/api/home-care-requests/file?id=${selected.id}&file=${doc.id}`}>
                      {doc.label} · {doc.originalName}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">No documents uploaded.</p>
            )}

            {selected.bookingId ? (
              <p className="text-sm">
                Booking{" "}
                <Link className="font-semibold text-[#087F8C]" href="/dashboard/admin/bookings">
                  {selected.bookingId}
                </Link>
                {selected.patientId ? (
                  <>
                    {" "}· Patient{" "}
                    <Link className="font-semibold text-[#087F8C]" href={`/dashboard/admin/patients/${selected.patientId}`}>
                      {selected.patientId}
                    </Link>
                  </>
                ) : null}
              </p>
            ) : null}

            <label className="block text-sm font-medium text-[#172D3A]">
              Status
              <Select
                className="mt-1"
                value={selected.status === "converted" ? "converted" : nextStatus}
                onChange={(e) => setNextStatus(e.target.value as HomeCareRequestStatus)}
                disabled={selected.status === "converted"}
              >
                {HOME_STATUSES.filter((item) => item !== "converted" || selected.status === "converted").map((item) => (
                  <option key={item} value={item}>
                    {HOME_STATUS_LABEL[item]}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-sm font-medium text-[#172D3A]">
              Assign staff
              <Select className="mt-1" value={staffId} onChange={(e) => setStaffId(e.target.value)} disabled={selected.status === "converted"}>
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
              <Textarea className="mt-1" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => save("update")} loading={busy} disabled={busy}>
                Save update
              </Button>
              {canConvert && selected.status !== "converted" ? (
                <Button type="button" variant="secondary" onClick={() => save("convert")} loading={busy} disabled={busy || nextStatus !== "confirmed"}>
                  Convert to booking
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted">Confirm the request, then convert. A matching patient name and mobile is linked instead of creating a duplicate. The request stays unconverted if booking creation fails.</p>
            <ol className="space-y-2 border-t border-[var(--line)] pt-3 text-xs text-muted">
              {selected.history.map((event, index) => (
                <li key={`${event.at}-${index}`}>
                  <span className="font-semibold text-[#172D3A]">{event.at.slice(0, 16).replace("T", " ")}</span>
                  {" "}
                  {event.action}
                  {event.from && event.to ? ` · ${label(event.from)} → ${label(event.to)}` : ""}
                  {event.note ? ` · ${event.note}` : ""}
                  {event.actorName ? ` · ${event.actorName}` : ""}
                </li>
              ))}
            </ol>
          </aside>
        ) : (
          <EmptyState title="Select a request" description="Details, notes, and conversion appear here." />
        )}
      </div>
    </div>
  );
}
