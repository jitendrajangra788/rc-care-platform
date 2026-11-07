"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarPlus,
  ClipboardList,
  FileText,
  HeartPulse,
  Phone,
  Receipt,
  UserRound,
} from "lucide-react";
import type {
  Booking,
  CarePlan,
  Invoice,
  Patient,
  SessionUser,
  VitalRecord,
} from "@/lib/types";
import { formatCurrency, formatDate, formatDateTime, formatPhone, telHref, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FormField, Select } from "@/components/ui/Input";
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

type Tab = "overview" | "bookings" | "clinical" | "documents" | "billing";

const tabs: { id: Tab; label: string; icon: typeof UserRound }[] = [
  { id: "overview", label: "Overview", icon: UserRound },
  { id: "bookings", label: "Bookings", icon: CalendarPlus },
  { id: "clinical", label: "Clinical", icon: HeartPulse },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "billing", label: "Billing", icon: Receipt },
];

function isActiveDuty(status: Booking["status"]) {
  return status === "active" || status === "assigned" || status === "pending";
}

/** Optional clinical fields may exist on records without being in the shared type yet. */
function readOptional(patient: Patient, key: string): string {
  const value = (patient as Patient & Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

export function PatientDetailView({
  patient,
  bookings,
  carePlans,
  vitals,
  invoices,
  familyUsers,
  loading = false,
  error = "",
  onRetry,
}: {
  patient: Patient | null;
  bookings: Booking[];
  carePlans: CarePlan[];
  vitals: VitalRecord[];
  invoices: Invoice[];
  familyUsers: SessionUser[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [saving, setSaving] = useState(false);
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
          familyUserId: patient.familyUserIds?.[0] || "",
        }
      : emptyPatientForm(),
  );
  const [status, setStatus] = useState<Patient["status"]>(patient?.status || "active");

  const activeBooking = useMemo(
    () => bookings.find((b) => isActiveDuty(b.status)),
    [bookings],
  );

  const activeBookingsCount = bookings.filter((b) => isActiveDuty(b.status)).length;
  const dues = invoices.reduce((s, i) => s + (i.amount - i.paid), 0);

  const familyNames = useMemo(() => {
    if (!patient) return [];
    const ids = new Set(patient.familyUserIds || []);
    return familyUsers.filter((u) => ids.has(u.id));
  }, [patient, familyUsers]);

  const allergies = patient ? readOptional(patient, "allergies") : "";
  const emergencyContact =
    (patient && readOptional(patient, "emergencyContact")) ||
    activeBooking?.guardianName ||
    familyNames[0]?.name ||
    "";

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
        familyUserIds: form.familyUserId ? [form.familyUserId] : [],
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error("Save failed", data.error);
      return;
    }
    toast.success("Patient updated", titleCase(form.name));
    router.refresh();
  }

  if (loading) {
    return (
      <div className="dash-stack" aria-busy="true" aria-label="Loading patient">
        <Skeleton className="h-4 w-32" />
        <div className="soft-panel space-y-2 rounded-[var(--radius-xl)] border border-[var(--line)] p-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <SkeletonText lines={2} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-[var(--radius-xl)]" />
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
  const ageGender = [
    patient.age ? `${patient.age}y` : null,
    patient.gender || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="dash-stack">
      <Link
        href="/dashboard/admin/patients"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Patients CRM
      </Link>

      <div className="sticky top-[5.75rem] z-20 -mx-1 border-b border-[var(--line)] bg-surface/95 px-1 py-3 backdrop-blur-xl md:top-[6.5rem] md:py-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-2 sm:gap-2">
            <Avatar name={patient.name} size="lg" />
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-display-lg text-heading">
                  {titleCase(patient.name)}
                </h1>
                <StatusBadge status={patient.status} />
              </div>
              <p className="text-sm text-muted">
                {ageGender || "Age / gender not set"}
                <span className="mx-1.5 text-[var(--line)]">·</span>
                <span className="tabular-nums text-heading">
                  {formatPhone(patient.phone)}
                </span>
                {patient.area ? (
                  <>
                    <span className="mx-1.5 text-[var(--line)]">·</span>
                    {titleCase(patient.area)}
                  </>
                ) : null}
              </p>
              <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted sm:text-sm">
                <div>
                  <dt className="inline font-semibold text-heading">Allergies: </dt>
                  <dd className="inline">
                    {allergies || "Not recorded"}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-heading">Emergency: </dt>
                  <dd className="inline">
                    {emergencyContact ? titleCase(emergencyContact) : "Not recorded"}
                  </dd>
                </div>
                <div className="inline-flex flex-wrap items-center gap-1.5">
                  <dt className="inline font-semibold text-heading">Active booking:</dt>
                  <dd className="inline-flex flex-wrap items-center gap-1.5">
                    {activeBooking ? (
                      <>
                        <span>
                          {activeBooking.id} · {activeBooking.careType}
                        </span>
                        <StatusBadge status={activeBooking.status} />
                      </>
                    ) : (
                      "None"
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {callHref ? (
              <a href={callHref} className="btn btn-outline btn-sm">
                <Phone className="h-3.5 w-3.5" aria-hidden /> Call
              </a>
            ) : null}
            <Link
              href={`/dashboard/admin/bookings?patientId=${encodeURIComponent(patient.id)}`}
              className="btn btn-primary btn-sm"
            >
              <CalendarPlus className="h-3.5 w-3.5" aria-hidden /> New booking
            </Link>
          </div>
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Patient 360° · {patient.id} · added {formatDate(patient.createdAt)}
      </p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Bookings" value={String(bookings.length)} />
        <StatCard
          label="Active duties"
          value={String(activeBookingsCount)}
          tone="primary"
        />
        <StatCard
          label="Care plans"
          value={String(carePlans.length)}
          tone="success"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(dues)}
          tone={dues > 0 ? "warning" : "default"}
        />
      </div>

      <div
        role="tablist"
        aria-label="Patient sections"
        className="flex flex-wrap gap-1 rounded-[var(--radius-lg)] border border-[var(--line)] bg-surface p-1"
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
                "inline-flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                selected
                  ? "bg-primary text-[var(--sidebar-fg)] shadow-[var(--shadow-sm)]"
                  : "text-muted hover:bg-[var(--surface-muted)] hover:text-heading",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-2 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Profile" subtitle="Editable CRM record">
            <form onSubmit={saveProfile} className="space-y-2" noValidate>
              <PatientFormFields
                value={form}
                onChange={(next) => {
                  setForm(next);
                  setErrors({});
                }}
                errors={errors}
                familyUsers={familyUsers}
              />
              <FormField label="Status">
                <Select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as Patient["status"])
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </FormField>
              <Button type="submit" loading={saving} disabled={saving}>
                Save profile
              </Button>
            </form>
          </Panel>

          <div className="space-y-2">
            <Panel title="Family links">
              {familyNames.length === 0 ? (
                <EmptyState
                  title="No family portal"
                  description="Link a family user from the profile form."
                />
              ) : (
                <div className="space-y-2">
                  {familyNames.map((u) => (
                    <ListTile key={u.id}>
                      <p className="font-name text-heading">{titleCase(u.name)}</p>
                      <ListTileMeta>{u.email}</ListTileMeta>
                    </ListTile>
                  ))}
                </div>
              )}
            </Panel>
            <Panel title="Quick links">
              <div className="flex flex-col gap-2">
                <Link
                  href="/dashboard/admin/care-plans"
                  className="btn btn-outline w-full justify-start"
                >
                  <ClipboardList className="h-4 w-4" aria-hidden /> Care plans desk
                </Link>
                <Link
                  href="/dashboard/admin/vitals"
                  className="btn btn-outline w-full justify-start"
                >
                  <HeartPulse className="h-4 w-4" aria-hidden /> Vitals desk
                </Link>
                <Link
                  href="/dashboard/admin/billing"
                  className="btn btn-outline w-full justify-start"
                >
                  <Receipt className="h-4 w-4" aria-hidden /> Billing desk
                </Link>
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === "bookings" ? (
        <Panel title="Care bookings" subtitle={`${bookings.length} linked`}>
          {bookings.length === 0 ? (
            <EmptyState
              title="No bookings"
              description="Create the first care booking for this patient."
              actionLabel="New booking"
              onAction={() =>
                router.push(
                  `/dashboard/admin/bookings?patientId=${encodeURIComponent(patient.id)}`,
                )
              }
            />
          ) : (
            <div className="space-y-1.5">
              {bookings.map((b) => (
                <ListTile key={b.id} className="animate-dash-in">
                  <ListTileHeader>
                    <div>
                      <p className="font-display text-lg text-heading">{b.id}</p>
                      <ListTileMeta>
                        {b.careType} · {b.shift} · {formatCurrency(b.amount)}/day
                      </ListTileMeta>
                      <p className="mt-1 text-sm text-muted">
                        {formatDate(b.startDate)}
                        {b.endDate ? ` → ${formatDate(b.endDate)}` : ""} ·{" "}
                        {b.address}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </ListTileHeader>
                </ListTile>
              ))}
            </div>
          )}
        </Panel>
      ) : null}

      {tab === "clinical" ? (
        <div className="grid gap-2 lg:grid-cols-2">
          <Panel title="Care plans" subtitle={`${carePlans.length} plans`}>
            {carePlans.length === 0 ? (
              <EmptyState
                title="No care plans"
                description="Create plans from Clinical → Care Plans."
              />
            ) : (
              <div className="space-y-1.5">
                {carePlans.map((p) => (
                  <ListTile key={p.id}>
                    <ListTileHeader>
                      <h3 className="font-display text-base text-heading">
                        {p.title}
                      </h3>
                      <StatusBadge status={p.status} />
                    </ListTileHeader>
                    {p.goals ? (
                      <p className="mt-2 text-sm text-muted">{p.goals}</p>
                    ) : null}
                  </ListTile>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Recent vitals" subtitle={`${vitals.length} records`}>
            {vitals.length === 0 ? (
              <EmptyState
                title="No vitals"
                description="Nurses record vitals from the clinical desk."
              />
            ) : (
              <div className="space-y-1.5">
                {vitals.slice(0, 8).map((v) => (
                  <ListTile key={v.id}>
                    <div className="flex flex-wrap gap-2">
                      <span className="vital-chip">
                        <span>BP</span>
                        <span>{v.bp || "—"}</span>
                      </span>
                      <span className="vital-chip">
                        <span>Pulse</span>
                        <span>{v.pulse || "—"}</span>
                      </span>
                      <span className="vital-chip">
                        <span>SpO2</span>
                        <span>{v.spo2 || "—"}</span>
                      </span>
                    </div>
                    <ListTileMeta className="mt-2">
                      {v.recordedByName} · {formatDateTime(v.recordedAt)}
                    </ListTileMeta>
                  </ListTile>
                ))}
              </div>
            )}
          </Panel>
        </div>
      ) : null}

      {tab === "documents" ? (
        <Panel
          title="Documents"
          subtitle="Patient files and clinical attachments"
        >
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No documents yet"
            description="Patient documents will appear here when uploads are available."
          />
        </Panel>
      ) : null}

      {tab === "billing" ? (
        <Panel title="Invoices" subtitle={`${invoices.length} linked`}>
          {invoices.length === 0 ? (
            <EmptyState
              title="No invoices"
              description="Invoices appear when bookings are billed."
            />
          ) : (
            <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--line)] bg-surface">
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
                    <tr
                      key={inv.id}
                      className="border-t border-[var(--line)]"
                    >
                      <td className="px-3 py-2.5 font-semibold text-heading">
                        {inv.id}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {formatCurrency(inv.paid)}
                      </td>
                      <td className="px-3 py-2.5 text-muted">
                        {formatDate(inv.dueDate)}
                      </td>
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
      ) : null}
    </div>
  );
}
