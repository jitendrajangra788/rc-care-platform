"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareWarning } from "lucide-react";
import type { Complaint } from "@/lib/types";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, Input, Textarea } from "@/components/ui/Input";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";
import { Panel } from "@/components/dashboard/DashboardShell";

export function ComplaintsPanel({
  complaints,
  canManage = false,
}: {
  complaints: Complaint[];
  canManage?: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed", data.error);
      return;
    }
    toast.success("Complaint submitted");
    setForm({ subject: "", message: "" });
    router.refresh();
  }

  async function updateStatus(id: string, status: Complaint["status"]) {
    const res = await fetch("/api/complaints", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error("Update failed", data.error);
      return;
    }
    toast.success("Updated");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Panel title="Raise a complaint" subtitle="Desk will track status until resolved.">
        <form onSubmit={onSubmit} className="space-y-1.5">
          <FormField label="Subject *">
            <Input
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </FormField>
          <FormField label="Describe the issue *">
            <Textarea
              required
              className="min-h-28"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </FormField>
          <Button type="submit" loading={saving} disabled={saving}>
            Submit complaint
          </Button>
        </form>
      </Panel>

      <Panel title="Complaint inbox" subtitle={`${complaints.length} total`}>
        {complaints.length === 0 ? (
          <EmptyState
            icon={<MessageSquareWarning className="h-5 w-5" />}
            title="No complaints"
            description="Submitted issues will show here with live status."
          />
        ) : (
          <div className="space-y-1.5">
            {complaints.map((c) => (
              <ListTile key={c.id} className="animate-dash-in">
                <ListTileHeader>
                  <h3 className="font-display text-lg text-heading">{c.subject}</h3>
                  <Badge
                    tone={
                      c.status === "open"
                        ? "warning"
                        : c.status === "resolved"
                          ? "success"
                          : "neutral"
                    }
                  >
                    {c.status}
                  </Badge>
                </ListTileHeader>
                <p className="mt-2 text-sm leading-relaxed text-muted">{c.message}</p>
                <ListTileMeta>
                  {c.raisedByName} · {new Date(c.createdAt).toLocaleString()}
                </ListTileMeta>
                {canManage ? (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => updateStatus(c.id, "in_progress")}
                    >
                      In progress
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => updateStatus(c.id, "resolved")}
                    >
                      Resolve
                    </Button>
                  </div>
                ) : null}
              </ListTile>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
