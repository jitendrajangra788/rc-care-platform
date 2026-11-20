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
import {
  CAREER_STATUS_LABEL,
  CAREER_STATUSES,
  JOB_ROLES,
  NURSING_QUALIFICATIONS,
} from "@/lib/enquiry-options";
import type { CareerApplication, CareerApplicationStatus, DocumentMeta } from "@/lib/types";

type Row = Omit<CareerApplication, "documents"> & { documents: DocumentMeta[] };

const tone: Record<CareerApplicationStatus, "warning" | "primary" | "accent" | "success" | "danger" | "neutral"> = {
  new: "warning",
  under_review: "neutral",
  shortlisted: "primary",
  interview_scheduled: "accent",
  selected: "success",
  rejected: "danger",
  joined: "success",
};

function label(status: string) {
  return CAREER_STATUS_LABEL[status as CareerApplicationStatus] || status;
}

export function CareerApplicationsManager({
  applications,
  canHire,
}: {
  applications: Row[];
  canHire: boolean;
}) {
  const [rows, setRows] = useState(applications);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [position, setPosition] = useState("all");
  const [qualification, setQualification] = useState("all");
  const [experience, setExperience] = useState("all");
  const [selectedId, setSelectedId] = useState(applications[0]?.id || "");
  const [remarks, setRemarks] = useState(applications[0]?.adminRemarks || "");
  const [nextStatus, setNextStatus] = useState<CareerApplicationStatus>(applications[0]?.status || "new");
  const [interviewAt, setInterviewAt] = useState(applications[0]?.interviewAt || "");
  const [interviewNote, setInterviewNote] = useState(applications[0]?.interviewNote || "");
  const [password, setPassword] = useState("");
  const [staffRole, setStaffRole] = useState<"Nurse" | "Attendant" | "Physio">("Nurse");
  const [salary, setSalary] = useState("700");
  const [busy, setBusy] = useState(false);

  const stats = useMemo(
    () => ({
      total: rows.length,
      fresh: rows.filter((row) => row.status === "new").length,
      pipeline: rows.filter((row) => ["shortlisted", "interview_scheduled", "selected"].includes(row.status)).length,
      joined: rows.filter((row) => row.status === "joined").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (position !== "all" && row.applyingFor !== position) return false;
      if (qualification !== "all" && row.nursingQualification !== qualification) return false;
      if (experience !== "all" && row.experienceLevel !== experience) return false;
      if (!q) return true;
      return [row.id, row.fullName, row.mobile, row.email, row.city, row.applyingFor, row.nursingQualification]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, query, status, position, qualification, experience]);

  const selected = rows.find((row) => row.id === selectedId) || null;

  function openRow(row: Row) {
    setSelectedId(row.id);
    setRemarks(row.adminRemarks || "");
    setNextStatus(row.status);
    setInterviewAt(row.interviewAt || "");
    setInterviewNote(row.interviewNote || "");
    setPassword("");
    setStaffRole(row.applyingFor === "Physiotherapist" ? "Physio" : row.applyingFor === "Nurse" || row.applyingFor === "ICU Nurse" ? "Nurse" : "Attendant");
  }

  async function save() {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/career-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          action: "update",
          status: nextStatus,
          adminRemarks: remarks,
          interviewAt,
          interviewNote,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Could not update application", data.error || "Try again");
        return;
      }
      setRows((current) => current.map((row) => (row.id === data.application.id ? data.application : row)));
      toast.success("Application updated", data.application.id);
    } finally {
      setBusy(false);
    }
  }

  async function hire() {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/career-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          action: "hire",
          password,
          staffRole,
          salaryPerShift: Number(salary),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Staff account was not created", data.error || "Try again");
        return;
      }
      setRows((current) => current.map((row) => (row.id === data.application.id ? data.application : row)));
      setNextStatus("joined");
      setPassword("");
      toast.success("Added to staff", `${data.staff.name} · ${data.staff.email}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="dash-grid-stats cols-4">
        <StatCard label="Applications" value={String(stats.total)} />
        <StatCard label="New" value={String(stats.fresh)} tone="warning" />
        <StatCard label="In pipeline" value={String(stats.pipeline)} tone="primary" />
        <StatCard label="Joined" value={String(stats.joined)} tone="success" />
      </div>

      <div className="grid gap-3 rounded-xl border border-[var(--line)] bg-white p-3 md:grid-cols-2 xl:grid-cols-5">
        <SearchInput value={query} onChange={setQuery} placeholder="Search name, mobile, email" aria-label="Search applicants" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Application status">
          <option value="all">All statuses</option>
          {CAREER_STATUSES.map((item) => (
            <option key={item} value={item}>
              {CAREER_STATUS_LABEL[item]}
            </option>
          ))}
        </Select>
        <Select value={position} onChange={(e) => setPosition(e.target.value)} aria-label="Position">
          <option value="all">All positions</option>
          {JOB_ROLES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
        <Select value={qualification} onChange={(e) => setQualification(e.target.value)} aria-label="Qualification">
          <option value="all">All qualifications</option>
          {NURSING_QUALIFICATIONS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
        <Select value={experience} onChange={(e) => setExperience(e.target.value)} aria-label="Experience">
          <option value="all">Fresher and experienced</option>
          <option value="Fresher">Fresher</option>
          <option value="Experienced">Experienced</option>
        </Select>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
          {filtered.length === 0 ? (
            <EmptyState title="No applications" description="Try another search or filter." />
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
                        <p className="text-sm font-semibold text-[#172D3A]">{row.fullName}</p>
                        <p className="text-xs text-muted">
                          {row.id} · {row.applyingFor} · {row.nursingQualification}
                        </p>
                      </div>
                      <Badge tone={tone[row.status]}>{label(row.status)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {row.experienceLevel}
                      {row.experienceLevel === "Experienced" ? ` · ${row.yearsOfExperience} yrs` : ""} · {row.mobile}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected ? (
          <aside className="space-y-4 rounded-xl border border-[var(--line)] bg-white p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#087F8C]">{selected.id}</p>
              <h2 className="font-display text-2xl text-[#172D3A]">{selected.fullName}</h2>
              <p className="text-sm text-muted">{selected.applyingFor} · {selected.city}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="btn btn-outline btn-sm" href={`tel:${selected.mobile}`}>Call</a>
              <a className="btn btn-outline btn-sm" href={`mailto:${selected.email}`}>Email</a>
            </div>
            <dl className="space-y-1 text-sm text-[#172D3A]">
              <div>{selected.gender} · DOB {selected.dateOfBirth}</div>
              <div>{selected.address}, {selected.city}, {selected.state} {selected.pinCode}</div>
              <div>{selected.highestEducation} · {selected.nursingQualification} · {selected.institutionName} ({selected.passingYear})</div>
              <div>{selected.experienceLevel}{selected.previousEmployer ? ` · ${selected.previousRole || ""} at ${selected.previousEmployer}` : ""}</div>
              <div>Skills: {selected.skills.join(", ")}{selected.otherSkills ? `, ${selected.otherSkills}` : ""}</div>
              <div>Employment {selected.employmentType} · shift {selected.preferredShift}</div>
              <div>Available {selected.availabilityType} · {selected.availabilityShift} · joining {selected.joiningDate}</div>
              {selected.expectedSalary ? <div>Expected salary: {selected.expectedSalary}</div> : null}
              {selected.referenceContact ? <div>Reference: {selected.referenceContact}</div> : null}
            </dl>
            {selected.about ? <p className="text-sm leading-relaxed text-muted">{selected.about}</p> : null}
            <ul className="space-y-1 text-sm">
              {selected.documents.map((doc) => (
                <li key={doc.id}>
                  <a className="font-semibold text-[#087F8C] hover:underline" href={`/api/career-applications/file?id=${selected.id}&file=${doc.id}`}>
                    {doc.label} · {doc.originalName}
                  </a>
                </li>
              ))}
            </ul>
            {selected.staffId ? (
              <p className="text-sm">
                Staff record{" "}
                <Link className="font-semibold text-[#087F8C]" href="/dashboard/admin/staff">
                  {selected.staffId}
                </Link>
              </p>
            ) : null}

            <label className="block text-sm font-medium text-[#172D3A]">
              Status
              <Select
                className="mt-1"
                value={selected.status === "joined" ? "joined" : nextStatus}
                onChange={(e) => setNextStatus(e.target.value as CareerApplicationStatus)}
                disabled={selected.status === "joined"}
              >
                {CAREER_STATUSES.filter((item) => item !== "joined" || selected.status === "joined").map((item) => (
                  <option key={item} value={item}>{CAREER_STATUS_LABEL[item]}</option>
                ))}
              </Select>
            </label>
            <label className="block text-sm font-medium text-[#172D3A]">
              Interview
              <Input className="mt-1" type="datetime-local" value={interviewAt} onChange={(e) => setInterviewAt(e.target.value)} />
            </label>
            <label className="block text-sm font-medium text-[#172D3A]">
              Interview note
              <Input className="mt-1" value={interviewNote} onChange={(e) => setInterviewNote(e.target.value)} />
            </label>
            <label className="block text-sm font-medium text-[#172D3A]">
              Admin remarks
              <Textarea className="mt-1" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </label>
            <Button type="button" onClick={save} loading={busy} disabled={busy}>
              Save update
            </Button>

            {canHire && selected.status === "selected" && !selected.staffId ? (
              <div className="space-y-3 border-t border-[var(--line)] pt-3">
                <p className="text-sm font-semibold text-[#172D3A]">Add to staff</p>
                <p className="text-xs text-muted">This creates the login only after you set a password here. The public form never creates an account.</p>
                <Select value={staffRole} onChange={(e) => setStaffRole(e.target.value as "Nurse" | "Attendant" | "Physio")} aria-label="Staff role">
                  <option>Nurse</option>
                  <option>Attendant</option>
                  <option>Physio</option>
                </Select>
                <Input type="number" min={1} value={salary} onChange={(e) => setSalary(e.target.value)} aria-label="Salary per shift" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Temporary password" autoComplete="new-password" />
                <Button type="button" variant="secondary" onClick={hire} loading={busy} disabled={busy}>
                  Add to Staff Management
                </Button>
              </div>
            ) : null}

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
          <EmptyState title="Select an application" description="The full application and documents appear here." />
        )}
      </div>
    </div>
  );
}
