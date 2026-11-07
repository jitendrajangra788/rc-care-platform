"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDays,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
} from "date-fns";
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  List,
  MapPin,
  Navigation,
  Pencil,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import type {
  Booking,
  BookingStatus,
  CareLocation,
  Patient,
  SessionUser,
  Staff,
} from "@/lib/types";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import {
  findAssignmentConflicts,
  todayISO,
  type ScheduleConflict,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { usePagedList } from "@/hooks/usePagedList";
import { toast } from "@/components/ui/toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField, Input, Select, Textarea } from "@/components/ui/Input";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  emptyPatientForm,
  PatientFormFields,
  type PatientFormValues,
} from "@/components/patients/PatientFormFields";

const BookingMap = dynamic(() => import("@/components/dashboard/BookingMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-56 place-items-center rounded-[var(--radius-xl)] border border-[var(--line)] bg-paper-2 text-sm text-muted">
      Loading map…
    </div>
  ),
});

type Filter = "all" | BookingStatus | "urgent";
type ViewMode = "list" | "roster";
type WizardStep = 1 | 2 | 3;

const careTypes = [
  "Elderly Care",
  "Skilled Nursing",
  "Post-Surgery Nursing",
  "Wound Care",
  "Mother & Baby",
  "Physiotherapy",
  "Critical Bed Care",
  "24hr Nursing",
];

const emptyForm = {
  patientId: "",
  patientMode: "existing" as "existing" | "new",
  patient: emptyPatientForm(),
  guardianName: "",
  careType: "Elderly Care",
  shift: "12hr" as Booking["shift"],
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  amount: "",
  priority: "normal" as NonNullable<Booking["priority"]>,
  notes: "",
  assignedStaffId: "",
  status: "pending" as BookingStatus,
  lat: "",
  lng: "",
  geofenceRadiusM: "250",
  sitePin: "",
  locationId: "",
  shiftStartTime: "08:00",
  shiftEndTime: "20:00",
};

function patientToForm(p: Patient): PatientFormValues {
  return {
    name: p.name,
    phone: p.phone,
    age: p.age?.toString() || "",
    gender: p.gender || "Male",
    address: p.address || "",
    area: p.area || "Bhilwara",
    notes: p.notes || "",
    familyUserId: p.familyUserIds?.[0] || "",
  };
}

function bookingTouchesDay(b: Booking, dayIso: string, asOf: string) {
  const from = b.startDate;
  const to =
    b.endDate ||
    (b.status === "active" || b.status === "assigned"
      ? asOf > from
        ? asOf
        : from
      : from);
  return dayIso >= from && dayIso <= to;
}

export function BookingsWorkspace({
  bookings,
  staff,
  locations = [],
  patients = [],
  familyUsers = [],
  initialPatientId,
  initialQuery = "",
}: {
  bookings: Booking[];
  staff: Staff[];
  locations?: CareLocation[];
  patients?: Patient[];
  familyUsers?: SessionUser[];
  initialPatientId?: string;
  initialQuery?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<ViewMode>("list");
  const [open, setOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [patientSearch, setPatientSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Booking | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [rosterAnchor, setRosterAnchor] = useState(() =>
    parseISO(todayISO() + "T12:00:00"),
  );

  useEffect(() => {
    if (!initialPatientId) return;
    const p = patients.find((x) => x.id === initialPatientId);
    if (!p) return;
    const id = window.setTimeout(() => {
      setEditing(null);
      setForm({
        ...emptyForm,
        patientId: p.id,
        patientMode: "existing",
        patient: patientToForm(p),
        notes: p.notes || "",
      });
      setPatientSearch("");
      setWizardStep(1);
      setConflicts([]);
      setError("");
      setOpen(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, [initialPatientId, patients]);

  useEffect(() => {
    if (!initialQuery) return;
    const id = window.setTimeout(() => {
      setQuery(initialQuery);
      const hit = bookings.find(
        (b) =>
          b.id.toLowerCase() === initialQuery.trim().toLowerCase() ||
          b.patientName.toLowerCase().includes(initialQuery.trim().toLowerCase()),
      );
      if (hit) setExpanded(hit.id);
    }, 0);
    return () => window.clearTimeout(id);
  }, [initialQuery, bookings]);

  const counts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      assigned: bookings.filter((b) => b.status === "assigned").length,
      active: bookings.filter((b) => b.status === "active").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      urgent: bookings.filter((b) => b.priority === "urgent").length,
    };
  }, [bookings]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const q = query.trim().toLowerCase();
      const matchQ =
        !q ||
        b.patientName.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        b.area.toLowerCase().includes(q) ||
        b.careType.toLowerCase().includes(q);
      const matchF =
        filter === "all"
          ? true
          : filter === "urgent"
            ? b.priority === "urgent"
            : b.status === filter;
      return matchQ && matchF;
    });
  }, [bookings, query, filter]);

  const { page, pageCount, pageSize, rows, setPage, setPageSize, resetPage } =
    usePagedList(filtered, 10);

  const patientMatches = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patients.slice(0, 12);
    return patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          (p.area || "").toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [patients, patientSearch]);

  const asOf = todayISO();
  const rosterDays = useMemo(() => {
    const start = startOfWeek(rosterAnchor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [rosterAnchor]);

  const previewConflicts = useMemo(() => {
    if (!form.assignedStaffId) return [] as ScheduleConflict[];
    const latNum = form.lat ? Number(form.lat) : undefined;
    const lngNum = form.lng ? Number(form.lng) : undefined;
    const draft: Booking = {
      id: editing?.id || "DRAFT",
      patientName: form.patient.name || "Patient",
      patientId: form.patientMode === "existing" ? form.patientId || undefined : undefined,
      phone: form.patient.phone || "",
      address: form.patient.address || "",
      area: form.patient.area || "",
      careType: form.careType,
      shift: form.shift,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      shiftStartTime: form.shiftStartTime || undefined,
      shiftEndTime: form.shiftEndTime || undefined,
      status: form.status,
      assignedStaffId: form.assignedStaffId,
      amount: form.amount ? Number(form.amount) : 0,
      createdAt: editing?.createdAt || new Date().toISOString(),
      lat: Number.isFinite(latNum) ? latNum : undefined,
      lng: Number.isFinite(lngNum) ? lngNum : undefined,
      geofenceRadiusM: form.geofenceRadiusM ? Number(form.geofenceRadiusM) : 250,
      priority: form.priority,
    };
    return findAssignmentConflicts({
      staffId: form.assignedStaffId,
      booking: draft,
      bookings,
      leaves: [],
      availability: [],
    });
  }, [form, editing, bookings]);

  const mapLat = form.lat ? Number(form.lat) : NaN;
  const mapLng = form.lng ? Number(form.lng) : NaN;
  const hasMapCoords = Number.isFinite(mapLat) && Number.isFinite(mapLng);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      patientMode: patients.length ? "existing" : "new",
      patientId: "",
      patient: emptyPatientForm(),
    });
    setPatientSearch("");
    setWizardStep(1);
    setConflicts([]);
    setError("");
    setOpen(true);
  }

  function selectPatient(patientId: string) {
    if (!patientId) {
      setForm((f) => ({
        ...f,
        patientId: "",
        patientMode: "new",
        patient: emptyPatientForm(),
      }));
      return;
    }
    const p = patients.find((x) => x.id === patientId);
    if (!p) return;
    setForm((f) => ({
      ...f,
      patientId: p.id,
      patientMode: "existing",
      patient: patientToForm(p),
      notes: f.notes || p.notes || "",
    }));
  }

  function openEdit(b: Booking) {
    setEditing(b);
    const linked = b.patientId ? patients.find((p) => p.id === b.patientId) : undefined;
    // Care site address/GPS live on the booking — prefer them over stale CRM rows.
    const basePatient = linked
      ? patientToForm(linked)
      : {
          name: b.patientName,
          phone: b.phone,
          age: b.patientAge?.toString() || "",
          gender: b.gender || "Male",
          address: "",
          area: "Bhilwara",
          notes: b.notes || "",
          familyUserId: b.familyUserId || "",
        };
    setForm({
      patientId: b.patientId || linked?.id || "",
      patientMode: b.patientId || linked ? "existing" : "new",
      patient: {
        ...basePatient,
        name: b.patientName || basePatient.name,
        phone: b.phone || basePatient.phone,
        age: b.patientAge?.toString() || basePatient.age,
        gender: b.gender || basePatient.gender,
        address: b.address || basePatient.address,
        area: b.area || basePatient.area || "Bhilwara",
        notes: b.notes || basePatient.notes,
        familyUserId: b.familyUserId || basePatient.familyUserId,
      },
      guardianName: b.guardianName || "",
      careType: b.careType,
      shift: b.shift,
      startDate: b.startDate,
      endDate: b.endDate || "",
      shiftStartTime: b.shiftStartTime || (b.shift === "8hr" ? "08:00" : "08:00"),
      shiftEndTime:
        b.shiftEndTime || (b.shift === "8hr" ? "16:00" : b.shift === "24hr" ? "08:00" : "20:00"),
      amount: String(b.amount),
      priority: b.priority || "normal",
      notes: b.notes || "",
      assignedStaffId: b.assignedStaffId || "",
      status: b.status,
      lat: typeof b.lat === "number" ? String(b.lat) : "",
      lng: typeof b.lng === "number" ? String(b.lng) : "",
      geofenceRadiusM: String(b.geofenceRadiusM || 250),
      sitePin: b.sitePin || "",
      locationId:
        locations.find(
          (l) =>
            typeof b.lat === "number" &&
            typeof b.lng === "number" &&
            Math.abs(l.lat - b.lat) < 0.0002 &&
            Math.abs(l.lng - b.lng) < 0.0002,
        )?.id || "",
    });
    setPatientSearch(linked?.name || b.patientName || "");
    setWizardStep(1);
    setConflicts([]);
    setError("");
    setOpen(true);
  }

  function setCareGps(lat: number, lng: number) {
    setForm((f) => ({
      ...f,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      locationId: "",
    }));
    toast.success("Care GPS updated", `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  }

  function applyLocation(locationId: string) {
    const loc = locations.find((l) => l.id === locationId);
    if (!loc) {
      setForm((f) => ({ ...f, locationId: "" }));
      return;
    }
    setForm((f) => ({
      ...f,
      locationId: loc.id,
      patient: {
        ...f.patient,
        address: loc.address || f.patient.address,
        area: loc.city || f.patient.area || "Bhilwara",
      },
      lat: String(loc.lat),
      lng: String(loc.lng),
      geofenceRadiusM: String(loc.geofenceRadiusM || 250),
    }));
    toast.success("Care location applied", loc.locationName);
  }

  function detectGps() {
    if (!navigator.geolocation) {
      toast.error("GPS not available", "Browser geolocation unsupported");
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsBusy(false);
        setCareGps(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setGpsBusy(false);
        toast.error("GPS failed", err.message || "Allow location permission");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }

  function validateStep(step: WizardStep): string | null {
    if (step === 1) {
      if (form.patientMode === "existing" && !form.patientId) {
        return "Search and select a CRM patient, or switch to New patient.";
      }
      if (!form.patient.name.trim() || !form.patient.phone.trim()) {
        return "Patient name and phone are required.";
      }
      if (!form.patient.address.trim()) {
        return "Care address is required (same field as Patients CRM).";
      }
      return null;
    }
    if (step === 2) {
      if (!form.careType || !form.shift || !form.startDate) {
        return "Care type, shift, and start date are required.";
      }
      return null;
    }
    if (!form.lat || !form.lng) {
      return "Select a care location or set GPS latitude / longitude for attendance.";
    }
    if (form.sitePin && (form.sitePin.length < 4 || form.sitePin.length > 6)) {
      return "Site PIN must be 4–6 digits (or leave empty). Geofence meters is a separate field.";
    }
    return null;
  }

  function goNext() {
    const err = validateStep(wizardStep);
    if (err) {
      setError(err);
      toast.error("Complete this step", err);
      return;
    }
    setError("");
    // Defer step change so the Next click cannot land on "Update booking"
    // after the button swaps under the cursor.
    window.setTimeout(() => {
      setWizardStep((s) => (s < 3 ? ((s + 1) as WizardStep) : s));
    }, 0);
  }

  function goBack() {
    setError("");
    setWizardStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s));
  }

  /** Block Enter / implicit submit — wizard save only via Update button click. */
  function onSubmit(e: FormEvent) {
    e.preventDefault();
  }

  async function saveBooking(force = false) {
    if (saving) return;
    setSaving(true);
    setError("");
    setConflicts([]);
    const stepErr = validateStep(1) || validateStep(2) || validateStep(3);
    if (stepErr) {
      setSaving(false);
      setError(stepErr);
      if (stepErr.includes("patient") || stepErr.includes("address") || stepErr.includes("CRM")) {
        setWizardStep(1);
      } else if (stepErr.includes("Care type") || stepErr.includes("shift")) {
        setWizardStep(2);
      } else {
        setWizardStep(3);
      }
      toast.error("Check the form", stepErr);
      return;
    }
    const latNum = form.lat.trim() ? Number(form.lat) : NaN;
    const lngNum = form.lng.trim() ? Number(form.lng) : NaN;
    // Always send locationId (null clears allotment) so PATCH sees the key.
    const locationId = form.locationId || null;
    const payload = {
      id: editing?.id,
      patientId: form.patientMode === "existing" ? form.patientId || undefined : undefined,
      patientName: form.patient.name,
      guardianName: form.guardianName,
      phone: form.patient.phone,
      patientAge: form.patient.age ? Number(form.patient.age) : undefined,
      gender: form.patient.gender as Booking["gender"],
      careType: form.careType,
      shift: form.shift,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      shiftStartTime: form.shiftStartTime || undefined,
      shiftEndTime: form.shiftEndTime || undefined,
      address: form.patient.address.trim(),
      area: form.patient.area.trim(),
      amount: form.amount ? Number(form.amount) : undefined,
      priority: form.priority,
      notes: form.notes || form.patient.notes,
      familyUserId: form.patient.familyUserId || undefined,
      assignedStaffId: form.assignedStaffId || undefined,
      clearStaff: editing ? !form.assignedStaffId : undefined,
      status: form.status,
      lat: Number.isFinite(latNum) ? latNum : undefined,
      lng: Number.isFinite(lngNum) ? lngNum : undefined,
      geofenceRadiusM: form.geofenceRadiusM ? Number(form.geofenceRadiusM) : 250,
      sitePin: form.sitePin.trim() || "",
      locationId,
      force: force || undefined,
    };

    const res = await fetch("/api/bookings", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      const apiConflicts = Array.isArray(data.conflicts)
        ? (data.conflicts as ScheduleConflict[])
        : [];
      setConflicts(apiConflicts);
      setError(data.error || "Save failed");
      if (apiConflicts.length || res.status === 409) {
        setWizardStep(3);
        toast.error("Schedule conflict", data.error || "Staff assignment overlaps another duty");
      } else {
        toast.error("Booking save failed", data.error || "Please check the form");
      }
      return;
    }
    setOpen(false);
    toast.success(
      editing ? "Booking updated" : "Booking created",
      [
        data.booking?.id,
        form.assignedStaffId && form.locationId ? "site allotted to staff" : null,
      ]
        .filter(Boolean)
        .join(" · ") || undefined,
    );
    router.refresh();
  }

  async function confirmDeleteBooking() {
    if (!confirmDelete) return;
    setDeleteBusy(true);
    const res = await fetch(
      `/api/bookings?id=${encodeURIComponent(confirmDelete.id)}`,
      { method: "DELETE" },
    );
    setDeleteBusy(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error("Delete failed", data.error);
      return;
    }
    toast.success("Booking deleted successfully", confirmDelete.id);
    setConfirmDelete(null);
    router.refresh();
  }

  async function quickStatus(id: string, status: BookingStatus) {
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error("Status update failed", data.error);
      return;
    }
    toast.success("Status updated successfully", `${id} → ${status}`);
    router.refresh();
  }

  const availableStaff = staff.filter((s) => s.status !== "leave");
  const assignedStaffName =
    staff.find((s) => s.id === form.assignedStaffId)?.name || "Unassigned";
  const shownConflicts = conflicts.length ? conflicts : previewConflicts;

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Operations desk"
        title="Bookings"
        subtitle="Create care bookings, assign staff, set GPS site, and track duty pipeline."
        action={
          <button type="button" onClick={openCreate} className="btn btn-primary">
            <CalendarPlus className="h-4 w-4" /> New booking
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-6">
        {(
          [
            ["all", "All", counts.all],
            ["pending", "Pending", counts.pending],
            ["assigned", "Assigned", counts.assigned],
            ["active", "Active", counts.active],
            ["completed", "Completed", counts.completed],
            ["urgent", "Urgent", counts.urgent],
          ] as const
        ).map(([key, label, value]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setFilter(key);
              resetPage();
            }}
            className={cn(
              "rounded-[var(--radius-xl)] border px-4 py-2 text-left transition",
              filter === key
                ? "border-primary bg-primary text-[var(--sidebar-fg)] shadow-[var(--shadow-md)]"
                : "border-[var(--line)] bg-surface hover:bg-paper-2",
            )}
          >
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.14em]",
                filter === key ? "text-[var(--sidebar-fg)]/70" : "text-muted",
              )}
            >
              {label}
            </p>
            <p className="mt-2 font-display text-3xl">{value}</p>
          </button>
        ))}
      </div>

      <ListToolbar
        query={query}
        onQueryChange={(v) => {
          setQuery(v);
          resetPage();
        }}
        placeholder="Search patient, booking ID, phone, area, care type..."
        actions={
          <div className="flex rounded-full border border-[var(--line)] p-0.5">
            <button
              type="button"
              aria-label="List view"
              onClick={() => setView("list")}
              className={cn(
                "rounded-full p-2",
                view === "list"
                  ? "bg-primary text-[var(--sidebar-fg)]"
                  : "text-muted hover:text-heading",
              )}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Calendar roster view"
              onClick={() => setView("roster")}
              className={cn(
                "rounded-full p-2",
                view === "roster"
                  ? "bg-primary text-[var(--sidebar-fg)]"
                  : "text-muted hover:text-heading",
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
            </button>
          </div>
        }
      />

      {view === "list" ? (
        <div className="space-y-1.5">
          {filtered.length === 0 ? (
            <EmptyState
              title="No bookings found"
              description="Try another filter, or create a new booking to start a care duty."
              actionLabel="New booking"
              onAction={openCreate}
            />
          ) : (
            rows.map((b) => {
              const nurse = staff.find((s) => s.id === b.assignedStaffId);
              const isOpen = expanded === b.id;
              return (
                <article
                  key={b.id}
                  className="soft-panel overflow-hidden rounded-[var(--radius-2xl)]"
                >
                  <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between sm:p-2.5">
                    <div className="min-w-0 w-full flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-name text-lg text-heading">{b.patientName}</h3>
                        <StatusBadge status={b.status} />
                        {b.priority === "urgent" ? (
                          <Badge tone="danger">Urgent</Badge>
                        ) : null}
                      </div>
                      <p className="break-words text-sm text-muted">
                        {b.id} · {b.careType} · {b.shift} · {formatCurrency(b.amount)}
                        /day
                      </p>
                      <p className="flex items-start gap-1.5 break-words text-sm text-muted">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0">
                          {b.address}
                          {b.area ? ` · ${b.area}` : ""}
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5 text-sm">
                        <UserRound className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {nurse ? (
                          <span className="min-w-0 break-words">
                            {nurse.name} · {nurse.role}
                          </span>
                        ) : (
                          <span className="text-warning">Unassigned</span>
                        )}
                      </p>
                      <p className="break-words text-xs text-muted">
                        Start {formatDate(b.startDate)}
                        {b.endDate ? ` → ${formatDate(b.endDate)}` : ""} ·{" "}
                        {formatPhone(b.phone)}
                        {b.patientAge ? ` · Age ${b.patientAge}` : ""}
                      </p>
                    </div>
                    <div className="grid w-full grid-cols-3 gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="justify-center"
                        onClick={() => setExpanded(isOpen ? null : b.id)}
                      >
                        {isOpen ? "Hide" : "Manage"}
                      </Button>
                      <Button
                        size="sm"
                        className="justify-center"
                        onClick={() => openEdit(b)}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="justify-center text-danger"
                        onClick={() => setConfirmDelete(b)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>

                  {isOpen ? (
                    <div className="border-t border-[var(--line)] bg-paper-2/50 px-3 py-2">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                        Quick status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            "pending",
                            "assigned",
                            "active",
                            "completed",
                            "cancelled",
                          ] as BookingStatus[]
                        ).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => quickStatus(b.id, s)}
                            className={cn(
                              "btn btn-sm capitalize",
                              b.status === s ? "btn-primary" : "btn-outline",
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      {b.notes ? (
                        <p className="mt-1.5 rounded-[var(--radius-lg)] bg-surface px-3 py-2 text-sm text-muted">
                          Notes: {b.notes}
                        </p>
                      ) : null}
                      <p className="mt-3 text-xs text-muted">
                        GPS: {b.lat ?? "—"}, {b.lng ?? "—"} · radius{" "}
                        {b.geofenceRadiusM || 250}m
                        {b.sitePin ? ` · Site PIN set` : " · No site PIN"}
                      </p>
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
          {filtered.length > 0 ? (
            <Pagination
              page={page}
              pageCount={pageCount}
              pageSize={pageSize}
              total={bookings.length}
              filteredCount={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              noun="bookings"
            />
          ) : null}
        </div>
      ) : (
        <div className="soft-panel space-y-1.5 rounded-[var(--radius-2xl)] p-2 md:p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-label text-primary">Week roster</p>
              <p className="mt-1 text-sm text-muted">
                {format(rosterDays[0], "d MMM")} –{" "}
                {format(rosterDays[6], "d MMM yyyy")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setRosterAnchor((d) => addDays(d, -7))}
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setRosterAnchor(parseISO(todayISO() + "T12:00:00"))}
              >
                Today
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setRosterAnchor((d) => addDays(d, 7))}
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No bookings in this filter"
              description="Adjust search or status chips, or create a booking."
              actionLabel="New booking"
              onAction={openCreate}
            />
          ) : (
            <div className="grid gap-2 md:grid-cols-7">
              {rosterDays.map((day) => {
                const iso = format(day, "yyyy-MM-dd");
                const dayRows = filtered.filter((b) =>
                  bookingTouchesDay(b, iso, asOf),
                );
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={iso}
                    className={cn(
                      "min-h-[7rem] rounded-[var(--radius-xl)] border p-2.5",
                      isToday
                        ? "border-primary bg-[var(--primary-soft)]"
                        : "border-[var(--line)] bg-surface",
                    )}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      {format(day, "EEE")}
                    </p>
                    <p className="font-display text-lg text-heading">
                      {format(day, "d")}
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {dayRows.length === 0 ? (
                        <p className="text-[11px] text-muted">No duties</p>
                      ) : (
                        dayRows.slice(0, 6).map((b) => {
                          const nurse = staff.find(
                            (s) => s.id === b.assignedStaffId,
                          );
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => openEdit(b)}
                              className="w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-surface px-2 py-1.5 text-left transition hover:border-primary"
                            >
                              <p className="truncate text-xs font-semibold text-heading">
                                {b.patientName}
                              </p>
                              <p className="truncate text-[10px] text-muted">
                                {b.shift} · {nurse?.name || "Unassigned"}
                              </p>
                              <div className="mt-1">
                                <StatusBadge status={b.status} />
                              </div>
                            </button>
                          );
                        })
                      )}
                      {dayRows.length > 6 ? (
                        <p className="text-[10px] text-muted">
                          +{dayRows.length - 6} more
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-[color-mix(in_srgb,var(--heading)_45%,transparent)] p-0 backdrop-blur-[2px] sm:place-items-center sm:p-4">
          <div className="flex max-h-[96vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[var(--radius-2xl)] bg-surface shadow-[var(--shadow-lg)] sm:max-h-[92vh] sm:rounded-[var(--radius-2xl)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] bg-surface/95 px-3 py-2 backdrop-blur md:px-3">
              <div>
                <h2 className="font-display text-2xl text-heading">
                  {editing ? `Edit ${editing.id}` : "Create booking"}
                </h2>
                <p className="text-sm text-muted">
                  Step {wizardStep} of 3 ·{" "}
                  {wizardStep === 1
                    ? "Patient"
                    : wizardStep === 2
                      ? "Care plan"
                      : "Staff & GPS"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-muted hover:bg-paper-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-[var(--line)] px-3 py-3 md:px-3">
              <ol className="grid grid-cols-3 gap-2">
                {(
                  [
                    [1, "Patient"],
                    [2, "Care plan"],
                    [3, "Staff & GPS"],
                  ] as const
                ).map(([step, label]) => (
                  <li key={step}>
                    <button
                      type="button"
                      onClick={() => {
                        if (step < wizardStep) setWizardStep(step);
                      }}
                      className={cn(
                        "w-full rounded-[var(--radius-lg)] border px-3 py-2 text-left text-xs font-semibold transition",
                        wizardStep === step
                          ? "border-primary bg-[var(--primary-soft)] text-primary"
                          : wizardStep > step
                            ? "border-[var(--line)] bg-paper-2 text-heading"
                            : "border-[var(--line)] text-muted",
                      )}
                    >
                      <span className="block text-[10px] uppercase tracking-[0.14em]">
                        Step {step}
                      </span>
                      {label}
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <form
              onSubmit={onSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5 pb-28 md:p-3 md:pb-3">
                {wizardStep === 1 ? (
                  <section>
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <p className="text-label text-primary">1 · Patient</p>
                        <p className="mt-1 text-sm text-muted">
                          Search CRM patients and pick one for this booking.
                        </p>
                      </div>
                      <Link
                        href="/dashboard/admin/patients"
                        className="text-xs font-semibold text-primary"
                      >
                        Open patients CRM
                      </Link>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            patientMode: "existing",
                            patientId: f.patientId || "",
                            patient: f.patientId
                              ? patients.find((p) => p.id === f.patientId)
                                ? patientToForm(
                                    patients.find((p) => p.id === f.patientId)!,
                                  )
                                : f.patient
                              : f.patient,
                          }))
                        }
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                          form.patientMode === "existing"
                            ? "bg-primary text-[var(--sidebar-fg)]"
                            : "bg-paper-2 text-heading hover:bg-secondary",
                        )}
                      >
                        Existing patient
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            patientMode: "new",
                            patientId: "",
                            patient: emptyPatientForm(),
                          }))
                        }
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                          form.patientMode === "new"
                            ? "bg-primary text-[var(--sidebar-fg)]"
                            : "bg-paper-2 text-heading hover:bg-secondary",
                        )}
                      >
                        New patient
                      </button>
                    </div>

                    {form.patientMode === "existing" ? (
                      <div className="mt-3 space-y-1.5">
                        <FormField label="Search patients">
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                            <Input
                              className="field-with-icon"
                              value={patientSearch}
                              onChange={(e) => setPatientSearch(e.target.value)}
                              placeholder="Name, phone, area, or patient ID…"
                              autoFocus
                            />
                          </div>
                        </FormField>

                        {patients.length === 0 ? (
                          <EmptyState
                            title="No CRM patients yet"
                            description="Switch to New patient, or add patients in the CRM first."
                            actionLabel="New patient"
                            onAction={() =>
                              setForm((f) => ({
                                ...f,
                                patientMode: "new",
                                patientId: "",
                                patient: emptyPatientForm(),
                              }))
                            }
                          />
                        ) : patientMatches.length === 0 ? (
                          <EmptyState
                            title="No patients match"
                            description="Try another search, or create a new patient."
                          />
                        ) : (
                          <ul className="max-h-56 space-y-2 overflow-y-auto">
                            {patientMatches.map((p) => {
                              const selected = form.patientId === p.id;
                              return (
                                <li key={p.id}>
                                  <button
                                    type="button"
                                    onClick={() => selectPatient(p.id)}
                                    className={cn(
                                      "flex w-full items-start justify-between gap-2 rounded-[var(--radius-xl)] border px-3 py-3 text-left transition",
                                      selected
                                        ? "border-primary bg-[var(--primary-soft)]"
                                        : "border-[var(--line)] hover:bg-paper-2",
                                    )}
                                  >
                                    <div className="min-w-0">
                                      <p className="font-semibold text-heading">
                                        {p.name}
                                      </p>
                                      <p className="mt-0.5 text-sm text-muted">
                                        {formatPhone(p.phone)}
                                        {p.area ? ` · ${p.area}` : ""}
                                      </p>
                                      {p.address ? (
                                        <p className="mt-1 truncate text-xs text-muted">
                                          {p.address}
                                        </p>
                                      ) : null}
                                    </div>
                                    <StatusBadge status={p.status || "active"} />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    ) : null}

                    <div className="mt-3">
                      <PatientFormFields
                        value={form.patient}
                        onChange={(patient) =>
                          setForm((f) => ({ ...f, patient }))
                        }
                        familyUsers={familyUsers}
                        showNotes
                      />
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <FormField label="Guardian / contact name">
                        <Input
                          value={form.guardianName}
                          onChange={(e) =>
                            setForm({ ...form, guardianName: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField label="Priority">
                        <Select
                          value={form.priority}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              priority: e.target.value as "normal" | "urgent",
                            })
                          }
                        >
                          <option value="normal">Normal</option>
                          <option value="urgent">Urgent</option>
                        </Select>
                      </FormField>
                    </div>
                  </section>
                ) : null}

                {wizardStep === 2 ? (
                  <section>
                    <p className="text-label text-primary">2 · Care plan</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <FormField label="Care type *">
                        <Select
                          value={form.careType}
                          onChange={(e) =>
                            setForm({ ...form, careType: e.target.value })
                          }
                        >
                          {careTypes.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Shift *">
                        <Select
                          value={form.shift}
                          onChange={(e) => {
                            const shift = e.target.value as Booking["shift"];
                            setForm({
                              ...form,
                              shift,
                              shiftStartTime: "08:00",
                              shiftEndTime:
                                shift === "8hr"
                                  ? "16:00"
                                  : shift === "24hr"
                                    ? "08:00"
                                    : "20:00",
                            });
                          }}
                        >
                          <option value="8hr">8 hour shift</option>
                          <option value="12hr">12 hour shift</option>
                          <option value="24hr">24 hour shift</option>
                        </Select>
                      </FormField>
                      <FormField label="Shift start">
                        <Input
                          type="time"
                          value={form.shiftStartTime}
                          onChange={(e) =>
                            setForm({ ...form, shiftStartTime: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField label="Shift end">
                        <Input
                          type="time"
                          value={form.shiftEndTime}
                          onChange={(e) =>
                            setForm({ ...form, shiftEndTime: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField label="Start date">
                        <Input
                          type="date"
                          value={form.startDate}
                          onChange={(e) =>
                            setForm({ ...form, startDate: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField label="End date (optional)">
                        <Input
                          type="date"
                          value={form.endDate}
                          onChange={(e) =>
                            setForm({ ...form, endDate: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField label="Daily rate (₹)">
                        <Input
                          type="number"
                          value={form.amount}
                          onChange={(e) =>
                            setForm({ ...form, amount: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField label="Booking notes" className="sm:col-span-2">
                        <Textarea
                          value={form.notes}
                          onChange={(e) =>
                            setForm({ ...form, notes: e.target.value })
                          }
                        />
                      </FormField>
                    </div>
                  </section>
                ) : null}

                {wizardStep === 3 ? (
                  <section>
                    <p className="text-label text-primary">3 · Staff & care location</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <FormField label="Assigned staff">
                        <Select
                          value={form.assignedStaffId}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              assignedStaffId: e.target.value,
                            })
                          }
                        >
                          <option value="">Assign later</option>
                          {availableStaff.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} · {s.role} · {s.status}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Status">
                        <Select
                          value={form.status}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              status: e.target.value as BookingStatus,
                            })
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="assigned">Assigned</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </Select>
                      </FormField>

                      <div className="sm:col-span-2 rounded-[var(--radius-xl)] border border-[var(--line)] bg-paper-2/60 p-3 sm:p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-heading">
                            <MapPin className="mr-1 inline h-4 w-4 text-primary" />
                            Care location (address + GPS)
                          </p>
                          <Link
                            href="/dashboard/admin/locations"
                            className="text-xs font-semibold text-primary"
                            target="_blank"
                          >
                            Manage locations
                          </Link>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <FormField label="Care address *" className="sm:col-span-2">
                            <Input
                              required
                              value={form.patient.address}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  patient: { ...f.patient, address: e.target.value },
                                  locationId: "",
                                }))
                              }
                              placeholder="House / street / landmark"
                              autoComplete="street-address"
                            />
                          </FormField>
                          <FormField label="Area">
                            <Input
                              value={form.patient.area}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  patient: { ...f.patient, area: e.target.value },
                                  locationId: "",
                                }))
                              }
                              placeholder="e.g. Subhash Nagar"
                            />
                          </FormField>
                          <FormField label="Saved care location">
                            <Select
                              value={form.locationId}
                              onChange={(e) => applyLocation(e.target.value)}
                            >
                              <option value="">Manual / custom GPS</option>
                              {locations.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.locationName} · {l.address}
                                </option>
                              ))}
                            </Select>
                          </FormField>
                        </div>
                        {locations.length === 0 ? (
                          <p className="mt-2 text-xs text-warning">
                            No saved locations yet. Add one in Locations, tap the
                            map, or detect GPS below.
                          </p>
                        ) : null}

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <FormField label="Latitude *">
                            <Input
                              inputMode="decimal"
                              placeholder="e.g. 25.347600"
                              value={form.lat}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  lat: e.target.value,
                                  locationId: "",
                                })
                              }
                              required
                            />
                          </FormField>
                          <FormField label="Longitude *">
                            <Input
                              inputMode="decimal"
                              placeholder="e.g. 74.640800"
                              value={form.lng}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  lng: e.target.value,
                                  locationId: "",
                                })
                              }
                              required
                            />
                          </FormField>
                          <FormField label="Geofence radius (meters)">
                            <Input
                              type="number"
                              min={50}
                              max={2000}
                              placeholder="250"
                              value={form.geofenceRadiusM}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  geofenceRadiusM: e.target.value,
                                })
                              }
                            />
                            <span className="mt-1 block text-[11px] text-muted">
                              Staff must be within this distance to mark present.
                            </span>
                          </FormField>
                          <FormField label="Site PIN (optional, 4–6 digits)">
                            <Input
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={6}
                              placeholder="e.g. 4821"
                              value={form.sitePin}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  sitePin: e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 6),
                                })
                              }
                            />
                          </FormField>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            loading={gpsBusy}
                            disabled={gpsBusy}
                            onClick={detectGps}
                          >
                            <Crosshair className="h-3.5 w-3.5" /> Detect my GPS
                          </Button>
                          {form.lat && form.lng ? (
                            <a
                              href={`https://www.google.com/maps?q=${encodeURIComponent(`${form.lat},${form.lng}`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-outline btn-sm"
                            >
                              <Navigation className="h-3.5 w-3.5" /> Open in Maps
                            </a>
                          ) : null}
                        </div>

                        <div className="mt-1.5">
                          {hasMapCoords ? (
                            <>
                              <BookingMap
                                lat={mapLat}
                                lng={mapLng}
                                radiusM={
                                  form.geofenceRadiusM
                                    ? Number(form.geofenceRadiusM)
                                    : 250
                                }
                                onLocationChange={setCareGps}
                              />
                              <p className="mt-1.5 text-[11px] text-muted">
                                Tap the map to move the care pin — then Update
                                booking.
                              </p>
                            </>
                          ) : (
                            <div className="grid h-44 place-items-center rounded-[var(--radius-xl)] border border-dashed border-[var(--line)] bg-paper-2 px-4 text-center text-sm text-muted sm:h-56">
                              Set latitude &amp; longitude, pick a saved location,
                              or detect GPS to preview the care site.
                            </div>
                          )}
                        </div>

                        {form.assignedStaffId && form.locationId ? (
                          <p className="mt-3 text-xs font-medium text-success">
                            On save, this saved location is allotted to the staff
                            for attendance geofence.
                          </p>
                        ) : form.assignedStaffId && form.lat && form.lng ? (
                          <p className="mt-3 text-xs text-muted">
                            Custom GPS will save on the booking. Choose a saved
                            care location above to create a staff allotment.
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {shownConflicts.length > 0 ? (
                      <Alert
                        tone={conflicts.length ? "danger" : "warning"}
                        title={
                          conflicts.length
                            ? "Could not save — schedule conflict"
                            : "Staff schedule conflict"
                        }
                        className="mt-1.5"
                      >
                        <p className="mb-2">
                          {conflicts.length
                            ? `${assignedStaffName} already has an overlapping duty. End that booking, pick another nurse, or save anyway.`
                            : "This assignment may overlap an existing duty. Review before saving."}
                        </p>
                        <ul className="space-y-1.5">
                          {shownConflicts.map((c, i) => (
                            <li
                              key={`${c.type}-${c.bookingId || c.leaveId || i}`}
                              className="rounded-[var(--radius-md)] border border-warning/20 bg-surface/70 px-3 py-2 text-sm text-heading"
                            >
                              <span className="mr-2 inline-flex rounded-full bg-[var(--warning-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                                {c.type}
                              </span>
                              {c.message}
                            </li>
                          ))}
                        </ul>
                        {conflicts.length ? (
                          <div className="mt-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={saving}
                              loading={saving}
                              onClick={() => void saveBooking(true)}
                            >
                              Save anyway
                            </Button>
                          </div>
                        ) : null}
                      </Alert>
                    ) : null}
                  </section>
                ) : null}

                {error && !shownConflicts.length ? (
                  <Alert tone="danger">{error}</Alert>
                ) : null}
              </div>

              <div className="sticky bottom-0 z-10 border-t border-[var(--line)] bg-surface/95 px-3 py-2 backdrop-blur md:px-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0 rounded-[var(--radius-xl)] border border-[var(--line)] bg-paper-2/70 px-3 py-2.5 text-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Summary
                    </p>
                    <p className="mt-1 truncate font-semibold text-heading">
                      {form.patient.name || "Patient not selected"}
                      {form.patient.phone
                        ? ` · ${formatPhone(form.patient.phone)}`
                        : ""}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {form.careType} · {form.shift} · {formatDate(form.startDate)}
                      {form.endDate ? ` → ${formatDate(form.endDate)}` : ""}
                      {form.amount
                        ? ` · ${formatCurrency(Number(form.amount))}/day`
                        : ""}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {assignedStaffName}
                      {hasMapCoords
                        ? ` · GPS ${mapLat.toFixed(4)}, ${mapLng.toFixed(4)}`
                        : " · GPS pending"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    {wizardStep > 1 ? (
                      <Button type="button" variant="secondary" onClick={goBack}>
                        Back
                      </Button>
                    ) : null}
                    {wizardStep < 3 ? (
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          goNext();
                        }}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled={saving}
                        loading={saving}
                        onClick={() => void saveBooking()}
                      >
                        {editing ? "Update booking" : "Create booking"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete booking?"
        description={
          confirmDelete
            ? `Delete ${confirmDelete.id} for ${confirmDelete.patientName}? This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete booking"
        tone="danger"
        busy={deleteBusy}
        onConfirm={() => void confirmDeleteBooking()}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
