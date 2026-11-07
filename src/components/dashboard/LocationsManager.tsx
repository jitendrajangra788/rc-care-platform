"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Trash2, UserPlus } from "lucide-react";
import type { Booking, CareLocation, SiteAllotment, Staff } from "@/lib/types";
import { toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/dashboard/DashboardShell";

type StaffLite = Pick<Staff, "id" | "name" | "role" | "status">;
type BookingLite = Pick<
  Booking,
  "id" | "patientName" | "address" | "status" | "assignedStaffId"
>;

export function LocationsManager({
  locations,
  allotments,
  staff,
  bookings,
}: {
  locations: CareLocation[];
  allotments: SiteAllotment[];
  staff: StaffLite[];
  bookings: BookingLite[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function addLocation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "location",
        locationName: fd.get("locationName"),
        address: fd.get("address"),
        city: fd.get("city"),
        lat: Number(fd.get("lat")),
        lng: Number(fd.get("lng")),
        geofenceRadiusM: Number(fd.get("geofenceRadiusM") || 250),
        notes: fd.get("notes"),
      }),
    });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error("Location save failed", data.error);
      return;
    }
    toast.success("Location added", data.location?.locationName);
    e.currentTarget.reset();
    router.refresh();
  }

  async function allotSite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "allot",
        locationId: fd.get("locationId"),
        staffId: fd.get("staffId"),
        bookingId: fd.get("bookingId") || undefined,
        shift: fd.get("shift"),
        startDate: fd.get("startDate"),
        endDate: fd.get("endDate") || undefined,
      }),
    });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error("Allot failed", data.error);
      return;
    }
    toast.success("Site allotted to staff");
    e.currentTarget.reset();
    router.refresh();
  }

  async function removeLocation(id: string, name: string) {
    if (!confirm(`Delete location ${name}?`)) return;
    const res = await fetch(`/api/locations?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error("Delete failed", data.error);
      return;
    }
    toast.success("Location deleted");
    router.refresh();
  }

  async function setAllotStatus(id: string, status: SiteAllotment["status"]) {
    const res = await fetch("/api/locations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource: "allotment", id, status }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error("Update failed", data.error);
      return;
    }
    toast.success(`Allotment ${status}`);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 lg:grid-cols-2">
        <Panel title="Add care location" subtitle="GPS site for allotment (old Add.php).">
          <form onSubmit={addLocation} className="space-y-1.5">
            <input name="locationName" className="field" placeholder="Location name *" required />
            <input name="address" className="field" placeholder="Full address *" required />
            <input name="city" className="field" placeholder="City" defaultValue="Bhilwara" />
            <div className="grid grid-cols-2 gap-2">
              <input name="lat" className="field" placeholder="Latitude *" required defaultValue="25.3476" />
              <input name="lng" className="field" placeholder="Longitude *" required defaultValue="74.6408" />
            </div>
            <input
              name="geofenceRadiusM"
              className="field"
              placeholder="Geofence meters"
              defaultValue="250"
            />
            <textarea name="notes" className="field" rows={2} placeholder="Notes" />
            <Button type="submit" loading={busy} disabled={busy}>
              <MapPin className="h-4 w-4" /> Save location
            </Button>
          </form>
        </Panel>

        <Panel title="Allot site to staff" subtitle="Assign staff to a care location (allot_site.php).">
          <form onSubmit={allotSite} className="space-y-1.5">
            <select name="locationId" className="field" required defaultValue="">
              <option value="" disabled>
                Select location *
              </option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.locationName}
                </option>
              ))}
            </select>
            <select name="staffId" className="field" required defaultValue="">
              <option value="" disabled>
                Select staff *
              </option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.role} · {s.status}
                </option>
              ))}
            </select>
            <select name="bookingId" className="field" defaultValue="">
              <option value="">Link booking (optional)</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id} · {b.patientName}
                </option>
              ))}
            </select>
            <select name="shift" className="field" defaultValue="Day">
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
              <option value="Day">Day</option>
              <option value="24 Hours">24 Hours</option>
              <option value="8hr">8hr</option>
              <option value="12hr">12hr</option>
              <option value="24hr">24hr</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="startDate"
                type="date"
                className="field"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
              <input name="endDate" type="date" className="field" />
            </div>
            <Button type="submit" loading={busy} disabled={busy}>
              <UserPlus className="h-4 w-4" /> Allot site
            </Button>
          </form>
        </Panel>
      </div>

      <Panel title="Care locations" subtitle={`${locations.length} sites`}>
        {locations.length === 0 ? (
          <EmptyState title="No locations" description="Add a care site to allot staff." />
        ) : (
          <div className="space-y-1.5">
            {locations.map((l) => (
              <article
                key={l.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-[var(--radius-xl)] border border-[var(--line)] p-4"
              >
                <div>
                  <p className="font-name text-lg text-heading">{l.locationName}</p>
                  <p className="mt-1 text-sm text-muted">{l.address}</p>
                  <p className="mt-1 text-xs text-muted">
                    GPS {l.lat}, {l.lng} · radius {l.geofenceRadiusM || 250}m
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger"
                  onClick={() => removeLocation(l.id, l.locationName)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Site allotments" subtitle="Active and past staff assignments to locations.">
        {allotments.length === 0 ? (
          <EmptyState title="No allotments yet" description="Allot a staff member to a location." />
        ) : (
          <div className="space-y-1.5">
            {allotments.map((a) => {
              const loc = locations.find((l) => l.id === a.locationId);
              const member = staff.find((s) => s.id === a.staffId);
              return (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-xl)] border border-[var(--line)] px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-heading">
                      {member?.name || a.staffId} → {loc?.locationName || a.locationId}
                    </p>
                    <p className="text-sm text-muted">
                      {a.shift} · {a.startDate}
                      {a.endDate ? ` → ${a.endDate}` : ""}
                      {a.bookingId ? ` · ${a.bookingId}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={
                        a.status === "active"
                          ? "success"
                          : a.status === "cancelled"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {a.status}
                    </Badge>
                    {a.status === "active" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAllotStatus(a.id, "completed")}
                        >
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger"
                          onClick={() => setAllotStatus(a.id, "cancelled")}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
