"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, CalendarDays } from "lucide-react";
import type { LeaveRequest, StaffDocument } from "@/lib/types";
import { toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/dashboard/DashboardShell";

export function NurseExtras({
  leaves,
  documents,
}: {
  leaves: LeaveRequest[];
  documents: StaffDocument[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function submitLeave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/extra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "leave",
        fromDate: fd.get("fromDate"),
        toDate: fd.get("toDate"),
        reason: fd.get("reason"),
      }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error("Leave request failed", data.error);
      return;
    }
    toast.success("Leave request submitted successfully");
    e.currentTarget.reset();
    router.refresh();
  }

  async function submitDoc(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file") as File | null;
    if (!file) {
      setSaving(false);
      toast.info("Choose a file");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });
    const res = await fetch("/api/extra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "document",
        title: fd.get("title"),
        kind: fd.get("kind"),
        expiryDate: fd.get("expiryDate") || undefined,
        fileDataUrl: dataUrl,
      }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error("Upload failed", data.error);
      return;
    }
    toast.success("Document uploaded successfully");
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <div className="grid gap-2 lg:grid-cols-2">
      <Panel
        title="Leave request"
        subtitle="Submit dates for admin approval."
        action={<CalendarDays className="h-5 w-5 text-primary" />}
      >
        <form onSubmit={submitLeave} className="space-y-1.5">
          <label className="block text-sm font-medium text-heading">
            From
            <input name="fromDate" type="date" className="field mt-1.5" required />
          </label>
          <label className="block text-sm font-medium text-heading">
            To
            <input name="toDate" type="date" className="field mt-1.5" required />
          </label>
          <label className="block text-sm font-medium text-heading">
            Reason
            <textarea
              name="reason"
              className="field mt-1.5"
              rows={3}
              placeholder="Reason for leave"
              required
            />
          </label>
          <Button type="submit" loading={saving} disabled={saving}>
            Submit leave
          </Button>
        </form>

        <div className="mt-2 space-y-2 border-t border-[var(--line)] pt-3">
          {leaves.length === 0 ? (
            <EmptyState title="No leave requests" description="Submit dates above for admin approval." />
          ) : (
            leaves.map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-lg)] bg-paper-2 px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-semibold text-heading">
                    {l.fromDate} → {l.toDate}
                  </p>
                  {l.reason ? <p className="text-xs text-muted">{l.reason}</p> : null}
                </div>
                <Badge
                  tone={
                    l.status === "approved"
                      ? "success"
                      : l.status === "rejected"
                        ? "danger"
                        : "warning"
                  }
                >
                  {l.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Panel>

      <Panel
        title="Documents"
        subtitle="Upload ID, certificates, and vaccine proofs."
        action={<FileUp className="h-5 w-5 text-primary" />}
      >
        <form onSubmit={submitDoc} className="space-y-1.5">
          <label className="block text-sm font-medium text-heading">
            Title
            <input
              name="title"
              className="field mt-1.5"
              placeholder="Aadhaar / Nursing certificate"
              required
            />
          </label>
          <label className="block text-sm font-medium text-heading">
            Type
            <select name="kind" className="field mt-1.5" defaultValue="id">
              <option value="id">ID</option>
              <option value="certificate">Certificate</option>
              <option value="vaccine">Vaccine</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-heading">
            Expiry (optional)
            <input name="expiryDate" type="date" className="field mt-1.5" />
          </label>
          <label className="block text-sm font-medium text-heading">
            File
            <input
              name="file"
              type="file"
              accept="image/*,application/pdf"
              className="field mt-1.5"
              required
            />
          </label>
          <Button type="submit" loading={saving} disabled={saving}>
            Upload document
          </Button>
        </form>

        <div className="mt-2 space-y-2 border-t border-[var(--line)] pt-4">
          {documents.length === 0 ? (
            <EmptyState title="No documents yet" description="Upload your ID or certificates here." />
          ) : (
            documents.map((d) => (
              <a
                key={d.id}
                href={d.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 rounded-[var(--radius-lg)] bg-paper-2 px-3 py-2.5 text-sm font-medium text-primary hover:bg-secondary"
              >
                <span>{d.title}</span>
                <span className="text-xs text-muted">
                  {d.kind}
                  {d.expiryDate ? ` · exp ${d.expiryDate}` : ""}
                </span>
              </a>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
