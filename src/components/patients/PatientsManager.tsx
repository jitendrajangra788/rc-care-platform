"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Phone, Plus, UserRound } from "lucide-react";
import type { Patient } from "@/lib/types";
import { formatDate, formatPhone, telHref, titleCase } from "@/lib/format";
import { toast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  emptyPatientForm,
  PatientFormFields,
  validatePatientForm,
  type PatientFormErrors,
  type PatientFormValues,
} from "@/components/patients/PatientFormFields";

type StatusFilter = "all" | "active" | "inactive";

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

export function PatientsManager({
  patients,
  bookingCounts = {},
  loading = false,
  error = "",
  onRetry,
}: {
  patients: Patient[];
  bookingCounts?: Record<string, number>;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [area, setArea] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState<PatientFormValues>(emptyPatientForm);
  const [errors, setErrors] = useState<PatientFormErrors>({});
  const [confirmPause, setConfirmPause] = useState<Patient | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);

  const areas = useMemo(() => {
    const set = new Set(
      patients.map((p) => (p.area || "").trim()).filter(Boolean),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [patients]);

  const statusTabs = useMemo(
    () => [
      { id: "all", label: "All", count: patients.length },
      {
        id: "active",
        label: "Active",
        count: patients.filter((p) => p.status === "active").length,
      },
      {
        id: "inactive",
        label: "Inactive",
        count: patients.filter((p) => p.status === "inactive").length,
      },
    ],
    [patients],
  );

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchS = status === "all" || p.status === status;
      const matchA = area === "all" || (p.area || "").trim() === area;
      return matchS && matchA;
    });
  }, [patients, status, area]);

  function openCreate() {
    setEditing(null);
    setForm(emptyPatientForm());
    setErrors({});
    setDrawerOpen(true);
  }

  function openEdit(p: Patient) {
    setEditing(p);
    setForm(patientToForm(p));
    setErrors({});
    setDrawerOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors = validatePatientForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Check the form", "Fix highlighted fields");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      age: form.age ? Number(form.age) : undefined,
      gender: form.gender,
      address: form.address.trim(),
      area: form.area.trim(),
      notes: form.notes.trim(),
      familyUserIds: [],
    };
    const res = await fetch("/api/patients", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error("Save failed", data.error);
      return;
    }
    toast.success(
      editing ? "Patient updated" : "Patient saved",
      titleCase(data.patient?.name || form.name),
    );
    setForm(emptyPatientForm());
    setEditing(null);
    setDrawerOpen(false);
    router.refresh();
    if (!editing && data.patient?.id) {
      router.push(`/dashboard/admin/patients/${data.patient.id}`);
    }
  }

  async function confirmToggleStatus() {
    if (!confirmPause) return;
    const next = confirmPause.status === "active" ? "inactive" : "active";
    setStatusBusy(true);
    const res = await fetch("/api/patients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: confirmPause.id, status: next }),
    });
    setStatusBusy(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error("Update failed", data.error);
      return;
    }
    toast.success("Status updated", `${titleCase(confirmPause.name)} → ${next}`);
    setConfirmPause(null);
    router.refresh();
  }

  const columns = useMemo<DataTableColumn<Patient>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Patient",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar name={p.name} size="sm" />
              <Link
                href={`/dashboard/admin/patients/${p.id}`}
                className="font-name truncate text-sm text-heading hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                title={p.id}
              >
                {titleCase(p.name)}
              </Link>
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <span className="tabular-nums text-heading">
            {formatPhone(row.original.phone)}
          </span>
        ),
      },
      {
        accessorKey: "area",
        header: "Area",
        cell: ({ row }) => (
          <span className="text-muted">{titleCase(row.original.area || "")}</span>
        ),
      },
      {
        accessorKey: "age",
        header: "Age",
        cell: ({ row }) => (
          <span className="text-muted">
            {row.original.age ? `${row.original.age}y` : "—"}
          </span>
        ),
      },
      {
        id: "bookings",
        header: "Bookings",
        accessorFn: (row) => bookingCounts[row.id] || 0,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted">
            {bookingCounts[row.original.id] || 0}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-muted">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          const call = telHref(p.phone);
          return (
            <div className="flex flex-wrap items-center gap-1">
              {call ? (
                <a
                  href={call}
                  className="btn btn-outline btn-sm"
                  aria-label={`Call ${titleCase(p.name)}`}
                  title="Call"
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  <span className="md:hidden">Call</span>
                </a>
              ) : null}
              <Link
                href={`/dashboard/admin/patients/${p.id}`}
                className="btn btn-outline btn-sm"
                aria-label={`View ${titleCase(p.name)}`}
                title="View"
              >
                <Eye className="h-3.5 w-3.5" aria-hidden />
                <span className="md:hidden">View</span>
              </Link>
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={`Edit ${titleCase(p.name)}`}
                title="Edit"
                onClick={() => openEdit(p)}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                <span className="md:hidden">Edit</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                title={p.status === "active" ? "Pause" : "Activate"}
                onClick={() => setConfirmPause(p)}
              >
                {p.status === "active" ? "Pause" : "Activate"}
              </Button>
            </div>
          );
        },
      },
    ],
    [bookingCounts],
  );

  if (loading) {
    return (
      <div className="space-y-1.5" aria-busy="true" aria-label="Loading patients">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Could not load patients"
        description={error}
        onRetry={onRetry}
      />
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-col gap-2">
        <div className="-mx-0.5 overflow-x-auto px-0.5">
          <FilterTabs
            tabs={statusTabs}
            value={status}
            onChange={(id) => setStatus(id as StatusFilter)}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <label className="sr-only" htmlFor="patient-area-filter">
            Filter by area
          </label>
          <select
            id="patient-area-filter"
            className="field w-full !py-2 text-sm font-semibold sm:!w-auto sm:!py-1.5 sm:text-xs"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            <option value="all">All areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {titleCase(a)}
              </option>
            ))}
          </select>
          <Button type="button" className="w-full sm:w-auto" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add patient
          </Button>
        </div>
      </div>

      {patients.length === 0 ? (
        <EmptyState
          icon={<UserRound className="h-5 w-5" />}
          title="No patients yet"
          description="Add the first patient to open the CRM record."
          actionLabel="Add patient"
          onAction={openCreate}
        />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id}
          searchPlaceholder="Search name, phone, area…"
          emptyTitle="No matches"
          emptyDescription="Try another status or area filter."
          exportFilename="patients.csv"
          pageSize={10}
          renderMobileCard={(p) => {
            const call = telHref(p.phone);
            return (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar name={p.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/admin/patients/${p.id}`}
                        className="font-name text-base text-heading hover:text-primary"
                      >
                        {titleCase(p.name)}
                      </Link>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{p.id}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Phone
                    </dt>
                    <dd className="mt-0.5 tabular-nums text-heading">
                      {formatPhone(p.phone)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Area
                    </dt>
                    <dd className="mt-0.5 text-heading">{titleCase(p.area || "—")}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Age
                    </dt>
                    <dd className="mt-0.5 text-heading">{p.age ? `${p.age}y` : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Bookings
                    </dt>
                    <dd className="mt-0.5 tabular-nums text-heading">
                      {bookingCounts[p.id] || 0}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Created
                    </dt>
                    <dd className="mt-0.5 text-heading">{formatDate(p.createdAt)}</dd>
                  </div>
                </dl>
                <div className="grid grid-cols-2 gap-1.5 border-t border-[var(--line)] pt-2.5">
                  {call ? (
                    <a href={call} className="btn btn-outline btn-sm justify-center">
                      <Phone className="h-3.5 w-3.5" /> Call
                    </a>
                  ) : null}
                  <Link
                    href={`/dashboard/admin/patients/${p.id}`}
                    className="btn btn-outline btn-sm justify-center"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="justify-center"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="justify-center"
                    onClick={() => setConfirmPause(p)}
                  >
                    {p.status === "active" ? "Pause" : "Activate"}
                  </Button>
                </div>
              </div>
            );
          }}
        />
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => {
          if (saving) return;
          setDrawerOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit patient" : "Add patient"}
        description={
          editing
            ? "Update CRM profile fields. Phone must be 10 digits."
            : "CRM profile — same fields used when creating a booking."
        }
        wide
      >
        <form onSubmit={onSubmit} className="space-y-2" noValidate>
          <PatientFormFields
            value={form}
            onChange={(next) => {
              setForm(next);
              setErrors({});
            }}
            errors={errors}
            showFamilyLink={false}
          />
          <div className="flex flex-wrap gap-2 border-t border-[var(--line)] pt-2">
            <Button type="submit" loading={saving} disabled={saving}>
              {editing ? "Save changes" : "Save patient"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDrawerOpen(false);
                setEditing(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirmPause)}
        title={
          confirmPause?.status === "active"
            ? "Pause this patient?"
            : "Activate this patient?"
        }
        description={
          confirmPause
            ? `${titleCase(confirmPause.name)} will be marked ${
                confirmPause.status === "active" ? "inactive" : "active"
              }. Bookings are not deleted.`
            : undefined
        }
        confirmLabel={confirmPause?.status === "active" ? "Pause" : "Activate"}
        tone={confirmPause?.status === "active" ? "danger" : "primary"}
        busy={statusBusy}
        onCancel={() => setConfirmPause(null)}
        onConfirm={confirmToggleStatus}
      />
    </div>
  );
}
