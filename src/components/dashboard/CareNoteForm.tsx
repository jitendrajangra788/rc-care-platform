"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { NotebookPen } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function CareNoteForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        notes: fd.get("notes"),
        vitals: {
          bp: fd.get("bp"),
          sugar: fd.get("sugar"),
          pulse: fd.get("pulse"),
          temp: fd.get("temp"),
        },
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Try again");
      toast.error("Care note save failed", data.error || "Try again");
      return;
    }
    toast.success("Care note saved successfully");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <NotebookPen className="h-3.5 w-3.5" /> Log shift note
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-2 w-full space-y-1.5 rounded-[var(--radius-xl)] border border-[var(--line)] bg-paper-2 p-4 sm:col-span-full"
    >
      <p className="text-sm font-semibold text-heading">Shift vitals & notes</p>
      <div className="grid gap-2 sm:grid-cols-4">
        <input name="bp" placeholder="BP" className="field" />
        <input name="sugar" placeholder="Sugar" className="field" />
        <input name="pulse" placeholder="Pulse" className="field" />
        <input name="temp" placeholder="Temp" className="field" />
      </div>
      <textarea
        name="notes"
        required
        rows={3}
        placeholder="Care notes for family"
        className="field"
      />
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" loading={saving}>
          {saving ? "Saving..." : "Save note"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
