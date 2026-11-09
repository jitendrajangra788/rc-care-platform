"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarPlus,
  ClipboardList,
  Download,
  FileText,
  HeartPulse,
  MoreHorizontal,
  Phone,
  Pill,
  Receipt,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import type {
  ActivityEvent,
  Attendance,
  AuditLog,
  Booking,
  CarePlan,
  CareReport,
  DoctorNote,
  Invoice,
  MedicationLog,
  MedSchedule,
  Patient,
  PaymentRecord,
  SessionUser,
  VitalRecord,
} from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
  telHref,
  titleCase,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FormField, Input, Select } from "@/components/ui/Input";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Panel } from "@/components/dashboard/DashboardShell";
import {
  emptyPatientForm,
  PatientFormFields,
  validatePatientForm,
  type PatientFormErrors,
  type PatientFormValues,
} from "@/components/patients/PatientFormFields";

type Tab =
  | "overview"
  | "personal"
  | "family"
  | "bookings"
  | "clinical"
  | "care-plans"
  | "vitals"
  | "medication"
  | "reports"
  | "documents"
  | "billing"
  | "timeline";

type PatientDoc = {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  fileType: string;
};

type NurseRef = { id: string; name: string; phone?: string; role?: string };

const tabs: { id: Tab; label: string; icon: typeof UserRound }[] = [
  { id: "overview", label: "Overview", icon: UserRound },
  { id: "personal", label: "Personal", icon: ClipboardList },
  { id: "family", label: "Family", icon: Users },
  { id: "bookings", label: "Bookings", icon: CalendarPlus },
  { id: "clinical", label: "Clinical", icon: Stethoscope },
  { id: "care-plans", label: "Care Plans", icon: ClipboardList },
  { id: "vitals", label: "Vitals", icon: HeartPulse },
  { id: "medication", label: "Medication", icon: Pill },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "billing", label: "Billing", icon: Receipt },
  { id: "timeline", label: "Timeline", icon: Activity },
];

function isActiveDuty(status: Booking["status"]) {
  return status === "active" || status === "assigned" || status === "pending";
}

function readOptional(patient: Patient, key: string): string {
  const value = (patient as Patient & Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-2 border-b border-[var(--line)] py-2.5 last:border-0 sm:grid-cols-[10rem_1fr]">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-sm text-heading">{value || <span className="text-muted">Not recorded</span>}</dd>
    </div>
  );
}

export function PatientDetailView({
  patient,
  bookings,
  carePlans,
  vitals,
  careReports = [],
  invoices,
  payments = [],
  medications = [],
  medSchedules = [],
  doctorNotes = [],
  attendance = [],
  assignedNurses = [],
  familyContacts = [],
  portalUser = null,
  activities = [],
  auditTrail = [],
  documents = [],
  staffById = {},
  loading = false,
  error = "",
  onRetry,
}: {
  patient: Patient | null;
  bookings: Booking[];
  carePlans: CarePlan[];
  vitals: VitalRecord[];
  careReports?: CareReport[];
  invoices: Invoice[];
  payments?: PaymentRecord[];
  medications?: MedicationLog[];
  medSchedules?: MedSchedule[];
  doctorNotes?: DoctorNote[];
  attendance?: Attendance[];
  assignedNurses?: NurseRef[];
  familyContacts?: SessionUser[];
  portalUser?: SessionUser | null;
  activities?: ActivityEvent[];
  auditTrail?: AuditLog[];
  documents?: PatientDoc[];
  staffById?: Record<string, { id: string; name: string; phone?: string }>;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [portalSaving, setPortalSaving] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [errors, setErrors] = useState<PatientFormErrors>({});
  const [form, setForm] = useState<PatientFormValues>(() =>
    patient
      ? {
          name: patient.name,
          phone: patient.phone,
          age: patient.age?.toString() || "",
          gender: patient.gender || "Male",
          address: patient.address || "",
          area: patient.area || "Bhilwara",
          notes: patient.notes || "",
          familyUserId: "",
        }
      : emptyPatientForm(),
  );
  const [status, setStatus] = useState<Patient["status"]>(patient?.status || "active");
  const [portalEmail, setPortalEmail] = useState(portalUser?.email || "");
  const [portalPassword, setPortalPassword] = useState("");
  const [oneTimeCred, setOneTimeCred] = useState<{ email: string; password: string } | null>(
    null,
  );

  useEffect(() => {
    if (portalUser?.email) setPortalEmail(portalUser.email);
  }, [portalUser?.email]);

  useEffect(() => {
    if (!patient) return;
    setForm({
      name: patient.name,
      phone: patient.phone,
      age: patient.age?.toString() || "",
      gender: patient.gender || "Male",
      address: patient.address || "",
      area: patient.area || "Bhilwara",
      notes: patient.notes || "",
      familyUserId: "",
    });
    setStatus(patient.status);
  }, [patient]);

  const activeBooking = useMemo(
    () => bookings.find((b) => isActiveDuty(b.status)),
    [bookings],
  );
  const upcomingBooking = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return bookings
      .filter((b) => b.status !== "cancelled" && b.startDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  }, [bookings]);

  const activeBookingsCount = bookings.filter((b) => isActiveDuty(b.status)).length;
  const invoicedTotal = invoices.reduce((s, i) => s + i.amount, 0);
  const paidTotal = invoices.reduce((s, i) => s + i.paid, 0);
  const dues = invoicedTotal - paidTotal;
  const bookingCharges = bookings.reduce((s, b) => s + (Number(b.amount) || 0), 0);

  const allergies = patient ? readOptional(patient, "allergies") : "";
  const conditions = patient ? readOptional(patient, "conditions") : "";
  const medicalHistory = patient ? readOptional(patient, "medicalHistory") : "";
  const emergencyContact =
    (patient && readOptional(patient, "emergencyContact")) ||
    activeBooking?.guardianName ||
    "";
  const emergencyPhone = (patient && readOptional(patient, "emergencyPhone")) || "";
  const doctorName =
    (patient && readOptional(patient, "doctorName")) || doctorNotes[0]?.doctorName || "";

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) return;
    const nextErrors = validatePatientForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Check the form", "Fix highlighted fields");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/patients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: patient.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender,
        address: form.address.trim(),
        area: form.area.trim(),
        notes: form.notes.trim(),
        status,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error("Save failed", data.error);
      return;
    }
    toast.success("Patient updated", titleCase(form.name));
    setEditing(false);
    router.refresh();
  }

  async function savePortalLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) return;
    if (!portalEmail.trim() || portalPassword.trim().length < 6) {
      toast.error("Portal login", "Email + password (min 6) required");
      return;
    }
    setPortalSaving(true);
    setOneTimeCred(null);
    const res = await fetch("/api/patients/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: patient.id,
        email: portalEmail.trim(),
        password: portalPassword,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setPortalSaving(false);
    if (!res.ok) {
      toast.error("Portal login failed", data.error || "Try again");
      return;
    }
    // One-time reveal only from the value just typed — never from server/DB
    const typedPassword = portalPassword;
    setOneTimeCred({ email: String(data.email || portalEmail.trim()), password: typedPassword });
    setPortalPassword("");
    toast.success("Portal ready", "Copy credentials now — password won't be shown again");
    router.refresh();
  }

  function downloadSummary() {
    if (!patient) return;
    const lines = [
      "ROSHAN CARE — Patient Summary",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      `Name: ${patient.name}`,
      `Patient ID: ${patient.id}`,
      `Phone: ${patient.phone}`,
      `Age/Gender: ${patient.age || "—"} / ${patient.gender || "—"}`,
      `Area: ${patient.area || "—"}`,
      `Address: ${patient.address || "—"}`,
      `Status: ${patient.status}`,
      `Registered: ${formatDate(patient.createdAt)}`,
      `Allergies: ${allergies || "Not recorded"}`,
      `Emergency: ${emergencyContact || "Not recorded"} ${emergencyPhone || ""}`,
      "",
      `Bookings: ${bookings.length} (active ${activeBookingsCount})`,
      `Care plans: ${carePlans.length}`,
      `Vitals records: ${vitals.length}`,
      `Care reports: ${careReports.length}`,
      `Invoiced: ${formatCurrency(invoicedTotal)} · Paid: ${formatCurrency(paidTotal)} · Due: ${formatCurrency(dues)}`,
      "",
      "Active booking:",
      activeBooking
        ? `${activeBooking.id} · ${activeBooking.careType} · ${activeBooking.shift} · ${activeBooking.status}`
        : "None",
      "",
      "Assigned nurses:",
      assignedNurses.length
        ? assignedNurses.map((n) => `- ${n.name}${n.phone ? ` · ${n.phone}` : ""}`).join("\n")
        : "None",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${patient.id}-summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="dash-stack" aria-busy="true" aria-label="Loading patient">
        <Skeleton className="h-4 w-32" />
        <div className="soft-panel space-y-2 rounded-[var(--radius-xl)] border border-[var(--line)] p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <SkeletonText lines={2} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Could not load patient"
        description={error}
        onRetry={onRetry}
      />
    );
  }

  if (!patient) {
    return (
      <ErrorState
        title="Patient not found"
        description="This CRM record is missing or was removed."
        onRetry={onRetry}
      />
    );
  }

  const callHref = telHref(patient.phone);
  const ageGender = [patient.age ? `${patient.age}y` : null, patient.gender || null]
    .filter(Boolean)
    .join(" · ");
  const lastVital = vitals[0];
  const lastReport = careReports[0];

  return (
    <div className="dash-stack patient-360">
      <Link
        href="/dashboard/admin/patients"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Patients CRM
      </Link>

      {/* Identity header */}
      <section className="sticky top-[5.5rem] z-20 overflow-hidden rounded-[1.15rem] border border-[var(--line)] bg-white shadow-[var(--shadow-sm)] md:top-[6.25rem]">
        <div className="bg-[linear-gradient(115deg,#087F8C_0%,#0d5f59_55%,#0b1f33_100%)] px-4 py-4 text-white sm:px-5 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Avatar
                name={patient.name}
                size="lg"
                className="!h-16 !w-16 !text-base ring-2 ring-white/30"
              />
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl leading-none tracking-[-0.03em] sm:text-3xl">
                    {titleCase(patient.name)}
                  </h1>
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                    {patient.status}
                  </span>
                  {allergies ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fee2e2] px-2.5 py-0.5 text-[11px] font-semibold text-[#b91c1c]">
                      <AlertTriangle className="h-3 w-3" /> Allergy
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-white/80">
                  <span className="font-semibold text-white">{patient.id}</span>
                  <span className="mx-2 text-white/40">·</span>
                  {ageGender || "Age / gender not set"}
                  <span className="mx-2 text-white/40">·</span>
                  <span className="tabular-nums">{formatPhone(patient.phone)}</span>
                  {patient.area ? (
                    <>
                      <span className="mx-2 text-white/40">·</span>
                      {titleCase(patient.area)}
                    </>
                  ) : null}
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] font-medium text-white/75">
                  <span>Registered {formatDate(patient.createdAt)}</span>
                  <span className="text-white/35">·</span>
                  <span>
                    Emergency: {emergencyContact ? titleCase(emergencyContact) : "Not set"}
                  </span>
                  <span className="text-white/35">·</span>
                  <span>
                    Booking:{" "}
                    {activeBooking ? `${activeBooking.id} · ${activeBooking.status}` : "None active"}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative flex flex-wrap items-center gap-2">
              {callHref ? (
                <a href={callHref} className="btn btn-sm border-white/25 bg-white/10 text-white hover:bg-white/20">
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
              ) : null}
              <Link
                href={`/dashboard/admin/bookings?patientId=${encodeURIComponent(patient.id)}`}
                className="btn btn-sm bg-white text-[#0d5f59] hover:bg-[#DDF5EC]"
              >
                <CalendarPlus className="h-3.5 w-3.5" /> New Booking
              </Link>
              <Button
                size="sm"
                variant="outline"
                className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/20"
                onClick={() => {
                  setTab("personal");
                  setEditing(true);
                }}
              >
                Edit Profile
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/20"
                onClick={downloadSummary}
              >
                <Download className="h-3.5 w-3.5" /> Summary
              </Button>
              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/20"
                  onClick={() => setMoreOpen((v) => !v)}
                  aria-expanded={moreOpen}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" /> More
                </Button>
                {moreOpen ? (
                  <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-[0.85rem] border border-[var(--line)] bg-white py-1 text-heading shadow-[var(--shadow-md)]">
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-muted)]"
                      onClick={() => {
                        setTab("family");
                        setMoreOpen(false);
                      }}
                    >
                      Portal access
                    </button>
                    <Link
                      href="/dashboard/admin/vitals"
                      className="block px-3 py-2 text-sm hover:bg-[var(--surface-muted)]"
                      onClick={() => setMoreOpen(false)}
                    >
                      Vitals desk
                    </Link>
                    <Link
                      href="/dashboard/admin/billing"
                      className="block px-3 py-2 text-sm hover:bg-[var(--surface-muted)]"
                      onClick={() => setMoreOpen(false)}
                    >
                      Billing desk
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Bookings" value={String(bookings.length)} icon={<CalendarPlus className="h-4 w-4" />} />
        <StatCard
          label="Active Duties"
          value={String(activeBookingsCount)}
          tone="primary"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Care Plans"
          value={String(carePlans.length)}
          tone="success"
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(dues)}
          tone={dues > 0 ? "warning" : "default"}
          icon={<Receipt className="h-4 w-4" />}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <StatCard label="Care Reports" value={String(careReports.length)} hint="Submitted reports" />
        <StatCard
          label="Last Vitals"
          value={lastVital ? formatDate(lastVital.recordedAt) : "—"}
          hint={lastVital ? `by ${lastVital.recordedByName}` : "No vitals yet"}
        />
        <StatCard
          label="Assigned Nurses"
          value={String(assignedNurses.length)}
          hint={assignedNurses.map((n) => n.name).slice(0, 2).join(", ") || "None assigned"}
        />
      </div>

      {/* Nav */}
      <div
        role="tablist"
        aria-label="Patient 360 sections"
        className="flex gap-1 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--line)] bg-white p-1 shadow-[var(--shadow-xs)]"
      >
        {tabs.map((t) => {
          const Icon = t.icon;
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-2 text-[13px] font-semibold transition",
                selected
                  ? "bg-[#087F8C] text-white shadow-[var(--shadow-sm)]"
                  : "text-muted hover:bg-[var(--surface-muted)] hover:text-heading",
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" ? (
        <div className="grid gap-3 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-3">
            <Panel title="Current care status" subtitle="Live operational snapshot">
              {activeBooking ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-lg text-heading">{activeBooking.id}</p>
                      <p className="text-sm text-muted">
                        {activeBooking.careType} · {activeBooking.shift}
                        {activeBooking.shiftStartTime
                          ? ` · ${activeBooking.shiftStartTime}–${activeBooking.shiftEndTime || ""}`
                          : ""}
                      </p>
                    </div>
                    <StatusBadge status={activeBooking.status} />
                  </div>
                  <dl>
                    <InfoRow label="Nurse" value={
                      activeBooking.assignedStaffId
                        ? staffById[activeBooking.assignedStaffId]?.name || activeBooking.assignedStaffId
                        : "Unassigned"
                    } />
                    <InfoRow label="Period" value={`${formatDate(activeBooking.startDate)}${activeBooking.endDate ? ` → ${formatDate(activeBooking.endDate)}` : ""}`} />
                    <InfoRow label="Address" value={activeBooking.address} />
                    <InfoRow label="Amount" value={`${formatCurrency(activeBooking.amount)}/day`} />
                  </dl>
                </div>
              ) : (
                <EmptyState
                  title="No active duty"
                  description="Create a booking to start care operations."
                  actionLabel="New booking"
                  onAction={() =>
                    router.push(
                      `/dashboard/admin/bookings?patientId=${encodeURIComponent(patient.id)}`,
                    )
                  }
                />
              )}
            </Panel>

            <div className="grid gap-3 md:grid-cols-2">
              <Panel title="Recent vitals" subtitle={lastVital ? formatDateTime(lastVital.recordedAt) : "No records"}>
                {lastVital ? (
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["BP", lastVital.bp],
                      ["Pulse", lastVital.pulse],
                      ["SpO₂", lastVital.spo2],
                      ["Temp", lastVital.temp],
                      ["Sugar", lastVital.sugar],
                    ].map(([k, v]) => (
                      <span key={k} className="vital-chip">
                        <span>{k}</span>
                        <span>{v || "—"}</span>
                      </span>
                    ))}
                    <p className="mt-2 w-full text-xs text-muted">by {lastVital.recordedByName}</p>
                  </div>
                ) : (
                  <EmptyState title="No vitals" description="Nurse vitals will appear here." />
                )}
              </Panel>
              <Panel title="Latest care report" subtitle={lastReport ? formatDate(lastReport.dutyDate) : "No reports"}>
                {lastReport ? (
                  <div className="space-y-2">
                    <p className="text-sm text-heading">{lastReport.summary}</p>
                    <ListTileMeta>
                      {lastReport.createdByName}
                      {lastReport.doctorChecked ? " · Doctor reviewed" : ""}
                    </ListTileMeta>
                  </div>
                ) : (
                  <EmptyState title="No reports" description="Shift reports show after nurse submit." />
                )}
              </Panel>
            </div>

            <Panel title="Patient snapshot" subtitle="Key profile fields">
              <dl>
                <InfoRow label="Phone" value={formatPhone(patient.phone)} />
                <InfoRow label="Address" value={patient.address} />
                <InfoRow label="Allergies" value={allergies || undefined} />
                <InfoRow label="Notes" value={patient.notes} />
              </dl>
            </Panel>
          </div>

          <div className="space-y-3">
            <Panel title="Emergency" subtitle="Critical contact">
              <dl>
                <InfoRow label="Contact" value={emergencyContact ? titleCase(emergencyContact) : undefined} />
                <InfoRow
                  label="Phone"
                  value={
                    emergencyPhone ? (
                      <a className="font-semibold text-primary" href={telHref(emergencyPhone) || undefined}>
                        {formatPhone(emergencyPhone)}
                      </a>
                    ) : undefined
                  }
                />
              </dl>
            </Panel>

            <Panel title="Family / portal" subtitle={`${familyContacts.length} linked`}>
              {familyContacts.length === 0 ? (
                <EmptyState
                  title="No portal access"
                  description="Create login from the Family tab."
                  actionLabel="Open Family"
                  onAction={() => setTab("family")}
                />
              ) : (
                <div className="space-y-2">
                  {familyContacts.map((u) => (
                    <ListTile key={u.id}>
                      <p className="font-semibold text-heading">{titleCase(u.name)}</p>
                      <ListTileMeta>
                        {u.email}
                        {u.id === portalUser?.id ? " · Primary portal" : ""}
                        {u.active === false ? " · Inactive" : ""}
                      </ListTileMeta>
                    </ListTile>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Upcoming booking">
              {upcomingBooking ? (
                <div>
                  <p className="font-display text-base text-heading">{upcomingBooking.id}</p>
                  <p className="text-sm text-muted">
                    {formatDate(upcomingBooking.startDate)} · {upcomingBooking.careType}
                  </p>
                  <StatusBadge status={upcomingBooking.status} />
                </div>
              ) : (
                <p className="text-sm text-muted">No upcoming booking scheduled.</p>
              )}
            </Panel>

            <Panel title="Recent activity" subtitle="Real events only">
              {activities.length === 0 && auditTrail.length === 0 ? (
                <p className="text-sm text-muted">No linked activity events yet.</p>
              ) : (
                <ul className="space-y-2">
                  {[...activities.slice(0, 5)].map((a) => (
                    <li key={a.id} className="border-b border-[var(--line)] pb-2 last:border-0">
                      <p className="text-sm font-medium text-heading">{a.title}</p>
                      <p className="text-xs text-muted">{formatDateTime(a.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Quick actions">
              <div className="flex flex-col gap-2">
                <Link href={`/dashboard/admin/bookings?patientId=${encodeURIComponent(patient.id)}`} className="btn btn-outline w-full justify-start">
                  <CalendarPlus className="h-4 w-4" /> New booking
                </Link>
                <Link href="/dashboard/admin/care-plans" className="btn btn-outline w-full justify-start">
                  <ClipboardList className="h-4 w-4" /> Care plans desk
                </Link>
                <Link href="/dashboard/admin/vitals" className="btn btn-outline w-full justify-start">
                  <HeartPulse className="h-4 w-4" /> Vitals desk
                </Link>
                <Link href="/dashboard/admin/billing" className="btn btn-outline w-full justify-start">
                  <Receipt className="h-4 w-4" /> Billing desk
                </Link>
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      {/* PERSONAL */}
      {tab === "personal" ? (
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel
            title="Personal information"
            subtitle={editing ? "Edit mode" : "Read-only clinical CRM"}
            action={
              <Button size="sm" variant={editing ? "outline" : "primary"} onClick={() => setEditing((v) => !v)}>
                {editing ? "Cancel" : "Edit"}
              </Button>
            }
          >
            {editing ? (
              <form onSubmit={saveProfile} className="space-y-3" noValidate>
                <PatientFormFields
                  value={form}
                  onChange={(next) => {
                    setForm(next);
                    setErrors({});
                  }}
                  errors={errors}
                  showFamilyLink={false}
                />
                <FormField label="Status">
                  <Select value={status} onChange={(e) => setStatus(e.target.value as Patient["status"])}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </FormField>
                <Button type="submit" loading={saving} disabled={saving}>
                  Save profile
                </Button>
              </form>
            ) : (
              <dl>
                <InfoRow label="Full name" value={titleCase(patient.name)} />
                <InfoRow label="Patient ID" value={patient.id} />
                <InfoRow label="Age" value={patient.age?.toString()} />
                <InfoRow label="Gender" value={patient.gender} />
                <InfoRow label="Phone" value={formatPhone(patient.phone)} />
                <InfoRow label="Area" value={patient.area} />
                <InfoRow label="Address" value={patient.address} />
                <InfoRow label="Status" value={patient.status} />
                <InfoRow label="Registered" value={formatDate(patient.createdAt)} />
              </dl>
            )}
          </Panel>
          <div className="space-y-3">
            <Panel title="Emergency & clinical notes">
              <dl>
                <InfoRow label="Emergency" value={emergencyContact ? titleCase(emergencyContact) : undefined} />
                <InfoRow label="Emerg. phone" value={emergencyPhone ? formatPhone(emergencyPhone) : undefined} />
                <InfoRow label="Allergies" value={allergies || undefined} />
                <InfoRow label="Conditions" value={conditions || undefined} />
                <InfoRow label="History" value={medicalHistory || undefined} />
                <InfoRow label="Doctor" value={doctorName || undefined} />
                <InfoRow label="CRM notes" value={patient.notes} />
              </dl>
              <p className="mt-3 text-xs text-muted">
                Extra clinical fields (allergies, conditions, history) show when present on the record.
                Structured edit for those fields needs a schema extension — not invented here.
              </p>
            </Panel>
          </div>
        </div>
      ) : null}

      {/* FAMILY */}
      {tab === "family" ? (
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
          <Panel title="Family & contacts" subtitle="Linked portal accounts for this patient only">
            {familyContacts.length === 0 ? (
              <EmptyState
                title="No linked contacts"
                description="Create a portal login to grant family desk access for this patient only."
              />
            ) : (
              <div className="space-y-2">
                {familyContacts.map((u) => (
                  <ListTile key={u.id}>
                    <ListTileHeader>
                      <div>
                        <p className="font-display text-base text-heading">{titleCase(u.name)}</p>
                        <ListTileMeta>
                          {u.email}
                          {u.phone ? ` · ${formatPhone(u.phone)}` : ""}
                        </ListTileMeta>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {u.id === portalUser?.id ? <Badge tone="primary">Primary</Badge> : null}
                        <Badge tone={u.active === false ? "danger" : "success"}>
                          {u.active === false ? "Inactive" : "Portal access"}
                        </Badge>
                      </div>
                    </ListTileHeader>
                    <p className="mt-2 text-xs text-muted">
                      Scoped to this patient record — cannot see other patients.
                    </p>
                  </ListTile>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-muted">
              Relationship labels / multi-permission matrix need CRM contact schema — not available yet.
            </p>
          </Panel>

          <Panel
            title="Portal login"
            subtitle={portalUser ? "Active — reset password securely" : "Create family / patient desk access"}
          >
            {portalUser ? (
              <div className="mb-3 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary-soft)] px-3 py-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>
                  Active: <strong>{portalUser.email}</strong>
                  {portalUser.active === false ? " (inactive)" : ""}
                </span>
              </div>
            ) : (
              <p className="mb-3 text-sm text-muted">
                Existing passwords are never shown. After create/reset, copy the one-time password immediately.
              </p>
            )}
            <form onSubmit={savePortalLogin} className="space-y-2">
              <FormField label="Login email *">
                <Input
                  type="email"
                  required
                  value={portalEmail}
                  onChange={(e) => setPortalEmail(e.target.value)}
                  placeholder="family@example.com"
                  autoComplete="off"
                />
              </FormField>
              <FormField
                label={portalUser ? "New password *" : "Temporary password *"}
                hint="Min 6 characters · stored hashed"
              >
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </FormField>
              <Button type="submit" loading={portalSaving} disabled={portalSaving}>
                {portalUser ? "Reset portal password" : "Create portal login"}
              </Button>
            </form>
            {oneTimeCred ? (
              <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] px-3 py-2.5 text-sm">
                <p className="font-semibold text-heading">One-time credentials — copy now</p>
                <p className="mt-1">
                  <strong>Email:</strong> {oneTimeCred.email}
                </p>
                <p>
                  <strong>Password:</strong> {oneTimeCred.password}
                </p>
                <p className="mt-1 text-xs text-muted">
                  This password will not be displayed again. Share securely, then dismiss this panel.
                </p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setOneTimeCred(null)}>
                  Dismiss
                </Button>
              </div>
            ) : null}
          </Panel>
        </div>
      ) : null}

      {/* BOOKINGS */}
      {tab === "bookings" ? (
        <Panel title="Bookings & care operations" subtitle={`${bookings.length} linked`}>
          {bookings.length === 0 ? (
            <EmptyState
              title="No bookings"
              description="Create the first care booking for this patient."
              actionLabel="New booking"
              onAction={() =>
                router.push(`/dashboard/admin/bookings?patientId=${encodeURIComponent(patient.id)}`)
              }
            />
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => {
                const nurse = b.assignedStaffId ? staffById[b.assignedStaffId] : undefined;
                const marks = attendance.filter((a) => a.bookingId === b.id).length;
                return (
                  <ListTile key={b.id} className="animate-dash-in">
                    <ListTileHeader>
                      <div>
                        <p className="font-display text-lg text-heading">{b.id}</p>
                        <ListTileMeta>
                          {b.careType} · {b.shift}
                          {b.shiftStartTime ? ` · ${b.shiftStartTime}–${b.shiftEndTime || ""}` : ""} ·{" "}
                          {formatCurrency(b.amount)}/day
                        </ListTileMeta>
                        <p className="mt-1 text-sm text-muted">
                          {formatDate(b.startDate)}
                          {b.endDate ? ` → ${formatDate(b.endDate)}` : ""} · {b.address}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Nurse: {nurse?.name || "Unassigned"}
                          {marks ? ` · Attendance marks: ${marks}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={b.status} />
                    </ListTileHeader>
                  </ListTile>
                );
              })}
            </div>
          )}
        </Panel>
      ) : null}

      {/* CLINICAL */}
      {tab === "clinical" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Clinical notes & history">
            <dl>
              <InfoRow label="Allergies" value={allergies || undefined} />
              <InfoRow label="Conditions" value={conditions || undefined} />
              <InfoRow label="History" value={medicalHistory || undefined} />
              <InfoRow label="CRM notes" value={patient.notes} />
            </dl>
          </Panel>
          <Panel title="Doctor notes" subtitle={`${doctorNotes.length} visit notes`}>
            {doctorNotes.length === 0 ? (
              <EmptyState title="No doctor notes" description="Visit notes linked to bookings appear here." />
            ) : (
              <div className="space-y-2">
                {doctorNotes.map((n) => (
                  <ListTile key={n.id}>
                    <p className="font-semibold text-heading">{n.doctorName}</p>
                    <p className="mt-1 text-sm text-muted">{n.notes}</p>
                    <ListTileMeta className="mt-1">
                      Visit {formatDate(n.visitDate)} · {n.patientName}
                    </ListTileMeta>
                  </ListTile>
                ))}
              </div>
            )}
          </Panel>
        </div>
      ) : null}

      {/* CARE PLANS */}
      {tab === "care-plans" ? (
        <Panel title="Care plans" subtitle={`${carePlans.length} plans`}>
          {carePlans.length === 0 ? (
            <EmptyState title="No care plans" description="Create plans from Clinical → Care Plans." />
          ) : (
            <div className="space-y-2">
              {carePlans.map((p) => (
                <ListTile key={p.id}>
                  <ListTileHeader>
                    <h3 className="font-display text-base text-heading">{p.title}</h3>
                    <StatusBadge status={p.status} />
                  </ListTileHeader>
                  {p.goals ? <p className="mt-2 text-sm text-muted">{p.goals}</p> : null}
                  {p.tasks?.length ? (
                    <ul className="mt-2 list-inside list-disc text-sm text-heading">
                      {p.tasks.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  ) : null}
                  <ListTileMeta className="mt-2">Created {formatDate(p.createdAt)}</ListTileMeta>
                </ListTile>
              ))}
            </div>
          )}
        </Panel>
      ) : null}

      {/* VITALS */}
      {tab === "vitals" ? (
        <Panel title="Vitals history" subtitle={`${vitals.length} records · real readings only`}>
          {vitals.length === 0 ? (
            <EmptyState title="No vitals" description="Nurses record vitals from the clinical desk." />
          ) : (
            <div className="space-y-2">
              {vitals.map((v) => (
                <ListTile key={v.id}>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["BP", v.bp],
                      ["Pulse", v.pulse],
                      ["SpO₂", v.spo2],
                      ["Temp", v.temp],
                      ["Sugar", v.sugar],
                    ].map(([k, val]) => (
                      <span key={k} className="vital-chip">
                        <span>{k}</span>
                        <span>{val || "—"}</span>
                      </span>
                    ))}
                  </div>
                  {v.notes ? <p className="mt-2 text-sm text-muted">{v.notes}</p> : null}
                  <ListTileMeta className="mt-2">
                    {v.recordedByName} · {formatDateTime(v.recordedAt)}
                  </ListTileMeta>
                </ListTile>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-muted">
            Charts / threshold config need a dedicated vitals analytics module — not fabricated here.
          </p>
        </Panel>
      ) : null}

      {/* MEDICATION */}
      {tab === "medication" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Schedules" subtitle={`${medSchedules.length} active schedules`}>
            {medSchedules.length === 0 ? (
              <EmptyState title="No schedules" description="Medicine schedules linked to bookings appear here." />
            ) : (
              <div className="space-y-2">
                {medSchedules.map((m) => (
                  <ListTile key={m.id}>
                    <ListTileHeader>
                      <div>
                        <p className="font-semibold text-heading">{m.medicineName}</p>
                        <ListTileMeta>
                          {m.dose} · {m.type} · {m.times.join(", ")}
                        </ListTileMeta>
                      </div>
                      <Badge tone={m.active ? "success" : "danger"}>
                        {m.active ? "Active" : "Inactive"}
                      </Badge>
                    </ListTileHeader>
                  </ListTile>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Administration log" subtitle={`${medications.length} doses recorded`}>
            {medications.length === 0 ? (
              <EmptyState title="No MAR entries" description="Administered doses from nurse MAR appear here." />
            ) : (
              <div className="space-y-2">
                {medications.slice(0, 30).map((m) => (
                  <ListTile key={m.id}>
                    <p className="font-semibold text-heading">{m.medicineName}</p>
                    <ListTileMeta>
                      {m.dose} · {m.type} · {formatDateTime(m.timeGiven || m.createdAt)}
                    </ListTileMeta>
                    {m.notes ? <p className="mt-1 text-sm text-muted">{m.notes}</p> : null}
                  </ListTile>
                ))}
              </div>
            )}
          </Panel>
        </div>
      ) : null}

      {/* REPORTS */}
      {tab === "reports" ? (
        <Panel title="Care reports" subtitle={`${careReports.length} reports`}>
          {careReports.length === 0 ? (
            <EmptyState title="No care reports" description="Nurse daily/complete reports appear here." />
          ) : (
            <div className="space-y-2">
              {careReports.map((r) => (
                <ListTile key={r.id}>
                  <ListTileHeader>
                    <div>
                      <p className="font-display text-base text-heading">
                        {r.reportType === "complete" ? "Complete report" : "Daily note"} ·{" "}
                        {formatDate(r.dutyDate)}
                      </p>
                      <ListTileMeta>
                        {r.createdByName} · {formatDateTime(r.createdAt)}
                      </ListTileMeta>
                    </div>
                    {r.doctorChecked ? <Badge tone="success">Doctor reviewed</Badge> : null}
                  </ListTileHeader>
                  <p className="mt-2 text-sm text-heading">{r.summary}</p>
                  {r.familyUpdate ? (
                    <p className="mt-1 text-sm text-muted">Family note: {r.familyUpdate}</p>
                  ) : null}
                  {r.conditionNote ? (
                    <p className="mt-1 text-sm text-muted">Observation: {r.conditionNote}</p>
                  ) : null}
                </ListTile>
              ))}
            </div>
          )}
        </Panel>
      ) : null}

      {/* DOCUMENTS */}
      {tab === "documents" ? (
        <Panel title="Documents" subtitle="Attachments from care reports and clinical uploads">
          {documents.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title="No documents yet"
              description="Report attachments appear here. Dedicated ID/prescription upload categories need a patient document API."
            />
          ) : (
            <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--line)]">
              <table className="data-table w-full min-w-[560px] text-left text-sm">
                <thead className="bg-[var(--surface-muted)] text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2.5">Title</th>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Type</th>
                    <th className="px-3 py-2.5">Uploaded</th>
                    <th className="px-3 py-2.5">By</th>
                    <th className="px-3 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => (
                    <tr key={d.id} className="border-t border-[var(--line)]">
                      <td className="px-3 py-2.5 font-semibold text-heading">{d.title}</td>
                      <td className="px-3 py-2.5">{d.category}</td>
                      <td className="px-3 py-2.5">{d.fileType}</td>
                      <td className="px-3 py-2.5 text-muted">{formatDate(d.uploadedAt)}</td>
                      <td className="px-3 py-2.5">{d.uploadedBy}</td>
                      <td className="px-3 py-2.5">
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-primary hover:underline"
                        >
                          Open
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      ) : null}

      {/* BILLING */}
      {tab === "billing" ? (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Booking charges" value={formatCurrency(bookingCharges)} hint="Sum of booking day rates" />
            <StatCard label="Total invoiced" value={formatCurrency(invoicedTotal)} />
            <StatCard label="Paid" value={formatCurrency(paidTotal)} tone="success" />
            <StatCard
              label="Outstanding"
              value={formatCurrency(dues)}
              tone={dues > 0 ? "warning" : "default"}
            />
          </div>
          <Panel title="Invoice history" subtitle={`${invoices.length} invoices`}>
            {invoices.length === 0 ? (
              <EmptyState title="No invoices" description="Invoices appear when bookings are billed." />
            ) : (
              <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--line)]">
                <table className="data-table w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-[var(--surface-muted)] text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-3 py-2.5">Invoice</th>
                      <th className="px-3 py-2.5">Amount</th>
                      <th className="px-3 py-2.5">Paid</th>
                      <th className="px-3 py-2.5">Due</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-t border-[var(--line)]">
                        <td className="px-3 py-2.5 font-semibold text-heading">{inv.id}</td>
                        <td className="px-3 py-2.5 tabular-nums">{formatCurrency(inv.amount)}</td>
                        <td className="px-3 py-2.5 tabular-nums">{formatCurrency(inv.paid)}</td>
                        <td className="px-3 py-2.5 text-muted">{formatDate(inv.dueDate)}</td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={inv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
          <Panel title="Payment history" subtitle={`${payments.length} payments`}>
            {payments.length === 0 ? (
              <EmptyState title="No payments" description="Recorded invoice payments appear here." />
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <ListTile key={p.id}>
                    <ListTileHeader>
                      <div>
                        <p className="font-semibold text-heading">{formatCurrency(p.amount)}</p>
                        <ListTileMeta>
                          {p.method} · Invoice {p.invoiceId} · {p.recordedByName}
                        </ListTileMeta>
                      </div>
                      <span className="text-xs text-muted">{formatDateTime(p.createdAt)}</span>
                    </ListTileHeader>
                  </ListTile>
                ))}
              </div>
            )}
          </Panel>
          <p className="text-xs text-muted">
            Advance / refund ledgers are not separate entities in the current DB — only invoice paid amounts and payment records are shown.
          </p>
        </div>
      ) : null}

      {/* TIMELINE */}
      {tab === "timeline" ? (
        <Panel title="Activity timeline" subtitle="Chronological real events for this patient">
          {activities.length === 0 && auditTrail.length === 0 ? (
            <EmptyState
              title="No timeline events"
              description="Activity and audit entries that reference this patient will appear here."
            />
          ) : (
            <ol className="relative space-y-0 border-l border-[var(--line)] ml-2">
              {[
                ...activities.map((a) => ({
                  id: a.id,
                  title: a.title,
                  detail: a.detail,
                  at: a.createdAt,
                  kind: a.kind,
                })),
                ...auditTrail.map((a) => ({
                  id: a.id,
                  title: `${a.action} · ${a.entity}`,
                  detail: a.detail,
                  at: a.createdAt,
                  kind: "audit",
                })),
              ]
                .sort((a, b) => b.at.localeCompare(a.at))
                .slice(0, 50)
                .map((ev) => (
                  <li key={ev.id} className="relative pb-4 pl-5">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#087F8C] ring-2 ring-white" />
                    <p className="text-sm font-semibold text-heading">{ev.title}</p>
                    {ev.detail ? <p className="text-sm text-muted">{ev.detail}</p> : null}
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDateTime(ev.at)} · {ev.kind}
                    </p>
                  </li>
                ))}
            </ol>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
