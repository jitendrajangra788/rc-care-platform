"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Booking, Staff } from "@/lib/types";
import { toast } from "@/components/ui/toast";

export function AssignBookingForm({
  bookingId,
  staff,
  currentStatus,
  currentStaffId,
  currentLat,
  currentLng,
  currentRadius,
}: {
  bookingId: string;
  staff: Staff[];
  currentStatus: Booking["status"];
  currentStaffId?: string;
  currentLat?: number;
  currentLng?: number;
  currentRadius?: number;
}) {
  const router = useRouter();
  const [staffId, setStaffId] = useState(currentStaffId || staff[0]?.id || "");
  const [status, setStatus] = useState<Booking["status"]>(currentStatus);
  const [lat, setLat] = useState(currentLat?.toString() || "");
  const [lng, setLng] = useState(currentLng?.toString() || "");
  const [radius, setRadius] = useState(String(currentRadius || 250));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: bookingId,
        assignedStaffId: staffId || undefined,
        status: staffId && status === "pending" ? "assigned" : status,
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
        geofenceRadiusM: radius ? Number(radius) : undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error("Update failed", data.error);
      return;
    }
    toast.success("Booking updated successfully", bookingId);
    router.refresh();
  }

  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-ink-soft">Assign staff</span>
          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="rounded-xl border border-[var(--line)] bg-white px-3 py-2"
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.role} · {s.status}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-ink-soft">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Booking["status"])}
            className="rounded-xl border border-[var(--line)] bg-white px-3 py-2"
          >
            <option value="pending">pending</option>
            <option value="assigned">assigned</option>
            <option value="active">active</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-ink-soft">Care lat (GPS)</span>
          <input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="25.3476"
            className="w-36 rounded-xl border border-[var(--line)] bg-white px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-ink-soft">Care lng (GPS)</span>
          <input
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="74.6408"
            className="w-36 rounded-xl border border-[var(--line)] bg-white px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-ink-soft">Radius (m)</span>
          <input
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="w-24 rounded-xl border border-[var(--line)] bg-white px-3 py-2"
          />
        </label>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-sea px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Update"}
        </button>
      </div>
    </div>
  );
}