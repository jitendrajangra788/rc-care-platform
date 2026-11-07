"use client";

import dynamic from "next/dynamic";
import { MapPin, Clock3 } from "lucide-react";
import type { Booking, LeaveRequest, NurseAvailability, Staff } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  SHIFT_PRESETS,
  formatShiftLabel,
  resolveShiftTimes,
} from "@/lib/schedule";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { smartReplaceCandidates } from "./utils";

const BookingMap = dynamic(() => import("@/components/dashboard/BookingMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-44 place-items-center rounded-[var(--radius-xl)] border border-[var(--line)] bg-paper-2 text-sm text-muted">
      Loading map…
    </div>
  ),
});

export function DutyDrawer({
  open,
  booking,
  staff,
  bookings,
  leaves,
  availability,
  asOf,
  assignStaffId,
  setAssignStaffId,
  shiftKind,
  setShiftKind,
  shiftStart,
  setShiftStart,
  shiftEnd,
  setShiftEnd,
  saving,
  error,
  onClose,
  onSave,
  onUnassignRequest,
  onSmartReplace,
}: {
  open: boolean;
  booking: Booking | null;
  staff: Staff[];
  bookings: Booking[];
  leaves: LeaveRequest[];
  availability: NurseAvailability[];
  asOf: string;
  assignStaffId: string;
  setAssignStaffId: (v: string) => void;
  shiftKind: Booking["shift"];
  setShiftKind: (v: Booking["shift"]) => void;
  shiftStart: string;
  setShiftStart: (v: string) => void;
  shiftEnd: string;
  setShiftEnd: (v: string) => void;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (action: "assign" | "reassign" | "updateShift") => void;
  onUnassignRequest: () => void;
  onSmartReplace: (staffId: string) => void;
}) {
  const nurse = booking
    ? staff.find((s) => s.id === booking.assignedStaffId)
    : undefined;
  const hasCoords =
    !!booking &&
    typeof booking.lat === "number" &&
    typeof booking.lng === "number" &&
    Number.isFinite(booking.lat) &&
    Number.isFinite(booking.lng);

  const candidates = booking
    ? smartReplaceCandidates({
        booking,
        staff,
        bookings,
        leaves,
        availability,
        asOf,
      })
    : [];

  return (
    <Drawer
      open={open && !!booking}
      onClose={onClose}
      title={booking?.patientName || "Duty"}
      description={booking ? `${booking.id} · ${booking.careType}` : undefined}
      wide
    >
      {!booking ? null : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={booking.status} />
            {booking.priority === "urgent" ? (
              <StatusBadge status="overdue" label="Urgent" />
            ) : null}
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-muted">
              <MapPin className="mr-1 inline h-3.5 w-3.5" />
              {booking.address}
              {booking.area ? ` · ${booking.area}` : ""}
            </p>
            <p className="text-muted">
              <Clock3 className="mr-1 inline h-3.5 w-3.5" />
              {formatShiftLabel(booking)}
            </p>
            <p className="font-medium text-heading">
              {formatDate(booking.startDate)}
              {" → "}
              {booking.endDate ? formatDate(booking.endDate) : "Ongoing"}
            </p>
            <p className="text-heading">
              Nurse: {nurse ? `${nurse.name} · ${nurse.role}` : "Unassigned"}
            </p>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-heading">Timeline</h4>
            <ul className="space-y-2 border-l border-[var(--line)] pl-3 text-sm">
              <li>
                <span className="text-muted">Created · </span>
                {formatDateTime(booking.createdAt)}
              </li>
              <li>
                <span className="text-muted">Start · </span>
                {formatDate(booking.startDate)}
                {booking.shiftStartTime || resolveShiftTimes(booking).start
                  ? ` · ${resolveShiftTimes(booking).start}`
                  : ""}
              </li>
              <li>
                <span className="text-muted">End · </span>
                {booking.endDate ? formatDate(booking.endDate) : "Ongoing"}
                {` · ${resolveShiftTimes(booking).end}`}
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-heading">Location</h4>
            {hasCoords ? (
              <BookingMap
                lat={booking.lat!}
                lng={booking.lng!}
                radiusM={booking.geofenceRadiusM}
              />
            ) : (
              <EmptyState
                title="No map coordinates"
                description="This booking has no lat/lng. Open bookings to set a site pin."
                className="py-3"
              />
            )}
          </div>

          <div className="space-y-1.5 rounded-[var(--radius-xl)] border border-[var(--line)] p-3">
            <h4 className="text-sm font-semibold text-heading">Assign / shift</h4>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Nurse</span>
              <select
                className="field w-full focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                value={assignStaffId}
                onChange={(e) => setAssignStaffId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.id === booking.backupStaffId ? " · backup" : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block text-muted">Shift</span>
                <select
                  className="field w-full"
                  value={shiftKind}
                  onChange={(e) => {
                    const v = e.target.value as Booking["shift"];
                    setShiftKind(v);
                    setShiftStart(SHIFT_PRESETS[v].start);
                    setShiftEnd(SHIFT_PRESETS[v].end);
                  }}
                >
                  <option value="8hr">8 Hours</option>
                  <option value="12hr">12 Hours</option>
                  <option value="24hr">24 Hours</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">Start</span>
                <input
                  className="field w-full"
                  type="time"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">End</span>
                <input
                  className="field w-full"
                  type="time"
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(e.target.value)}
                />
              </label>
            </div>
            {error ? (
              <ErrorState
                title="Could not save"
                description={error}
                className="py-3"
              />
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={saving}
                loading={saving}
                onClick={() =>
                  onSave(booking.assignedStaffId ? "reassign" : "assign")
                }
              >
                {booking.assignedStaffId ? "Reassign nurse" : "Assign nurse"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={() => onSave("updateShift")}
              >
                Save shift times
              </Button>
              {booking.assignedStaffId ? (
                <Button
                  type="button"
                  variant="danger"
                  disabled={saving}
                  onClick={onUnassignRequest}
                >
                  Unassign
                </Button>
              ) : null}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-heading">Smart replace</h4>
            <p className="mb-1.5 text-xs text-muted">
              Conflict-free nurses · same area first · fewer weekly hours first
            </p>
            {candidates.length === 0 ? (
              <EmptyState
                title="No free nurses"
                description="Everyone has a conflict or leave on this duty window."
                className="py-3"
              />
            ) : (
              <ul className="space-y-2">
                {candidates.slice(0, 8).map(({ staff: s, sameArea, weekHours }) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => onSmartReplace(s.id)}
                      className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-[var(--line)] px-3 py-2 text-left text-sm transition hover:border-primary/40 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                    >
                      <span>
                        <span className="font-semibold text-heading">{s.name}</span>
                        <span className="mt-0.5 block text-[11px] text-muted">
                          {s.area}
                          {sameArea ? " · same area" : ""} · {weekHours}h this week
                        </span>
                      </span>
                      <span className="text-xs font-semibold text-primary">Assign</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
