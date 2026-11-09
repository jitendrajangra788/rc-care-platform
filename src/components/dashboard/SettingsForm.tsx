"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2 } from "lucide-react";
import type { AppSettings } from "@/lib/types";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Input";
import { Panel } from "@/components/dashboard/DashboardShell";

async function fileToLogoDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
  if (!raw.startsWith("data:image/")) throw new Error("Choose an image file");

  // Resize small for invoices — stored as a file on save, not giant JSON
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Invalid image"));
    el.src = raw;
  });
  const maxSide = 320;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height, 1));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.88);
}

export function SettingsForm({ settings, canWrite }: { settings: AppSettings; canWrite: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AppSettings>(settings);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed", data.error || "Could not save settings");
      return;
    }
    toast.success("Settings saved", "Profile & billing details updated");
    router.refresh();
  }

  async function onLogoPick(file: File | null) {
    if (!file || !canWrite) return;
    try {
      if (file.size > 4 * 1024 * 1024) {
        toast.error("Logo too large", "Use an image under 4 MB");
        return;
      }
      const logoUrl = await fileToLogoDataUrl(file);
      setForm((f) => ({ ...f, logoUrl }));
      // Persist logo immediately so invoices pick it up even if user forgets full save
      setSaving(true);
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl }),
      });
      const data = await res.json().catch(() => ({}));
      setSaving(false);
      if (!res.ok) {
        toast.error("Logo not saved", data.error || "Could not save logo");
        return;
      }
      if (data.settings?.logoUrl) {
        setForm((f) => ({ ...f, logoUrl: data.settings.logoUrl }));
      }
      toast.success("Logo saved", "Will show on printed invoices");
      router.refresh();
    } catch (err) {
      setSaving(false);
      toast.error("Logo failed", err instanceof Error ? err.message : "Try another image");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-2 lg:grid-cols-2 lg:items-start">
      <Panel title="Organization profile" subtitle="Shown on invoices, print bills, and care desk.">
        <div className="space-y-2">
          <FormField label="Organization name *">
            <Input
              disabled={!canWrite}
              required
              value={form.orgName}
              onChange={(e) => setForm({ ...form, orgName: e.target.value })}
            />
          </FormField>
          <FormField label="Admin / billing contact name">
            <Input
              disabled={!canWrite}
              value={form.adminName || ""}
              onChange={(e) => setForm({ ...form, adminName: e.target.value })}
              placeholder="Care Desk Admin"
            />
          </FormField>
          <div className="grid gap-2 sm:grid-cols-2">
            <FormField label="Support phone">
              <Input
                disabled={!canWrite}
                value={form.supportPhone}
                onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
              />
            </FormField>
            <FormField label="Support email">
              <Input
                disabled={!canWrite}
                type="email"
                value={form.supportEmail}
                onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
              />
            </FormField>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <FormField label="City">
              <Input
                disabled={!canWrite}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </FormField>
            <FormField label="GSTIN (optional)">
              <Input
                disabled={!canWrite}
                value={form.gstin || ""}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                placeholder="22AAAAA0000A1Z5"
              />
            </FormField>
          </div>
          <FormField label="Address">
            <Textarea
              disabled={!canWrite}
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Clinic / office address for invoices"
              className="!min-h-[4.5rem]"
            />
          </FormField>
        </div>
      </Panel>

      <div className="space-y-2">
        <Panel title="Logo & invoice branding" subtitle="Logo appears on printed bills.">
          <div className="flex flex-wrap items-start gap-3">
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-[0.9rem] border border-[var(--line)] bg-[var(--surface-muted)]">
              {form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logoUrl} alt="" className="h-full w-full object-contain p-1.5" />
              ) : (
                <ImagePlus className="h-7 w-7 text-muted" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => void onLogoPick(e.target.files?.[0] || null)}
              />
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={!canWrite}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="h-3.5 w-3.5" /> Upload logo
                </Button>
                {form.logoUrl ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={!canWrite || saving}
                    onClick={() => {
                      void (async () => {
                        setForm({ ...form, logoUrl: "" });
                        setSaving(true);
                        const res = await fetch("/api/settings", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ logoUrl: "" }),
                        });
                        setSaving(false);
                        if (!res.ok) {
                          toast.error("Remove failed", "Could not clear logo");
                          return;
                        }
                        toast.success("Logo removed");
                        router.refresh();
                      })();
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted">
                PNG / JPG / WebP · saves instantly and shows on printed bills
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <FormField label="Invoice tagline">
              <Input
                disabled={!canWrite}
                value={form.invoiceTagline || ""}
                onChange={(e) => setForm({ ...form, invoiceTagline: e.target.value })}
                placeholder="Trusted Home Healthcare"
              />
            </FormField>
            <FormField label="UPI ID (on bills)" hint="Optional — shown on printed invoice for payment">
              <Input
                disabled={!canWrite}
                value={form.upiId || ""}
                onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                placeholder="roshancare@upi"
              />
            </FormField>
          </div>
        </Panel>

        <Panel title="Ops defaults" subtitle="Attendance geofence and demo logins.">
          <FormField label="Default geofence (m)" hint="Used when a booking has no custom radius">
            <Input
              type="number"
              disabled={!canWrite}
              value={form.defaultGeofenceM}
              onChange={(e) => setForm({ ...form, defaultGeofenceM: Number(e.target.value) })}
            />
          </FormField>
          <label className="mt-2 flex items-center gap-2 rounded-[var(--radius-lg)] bg-paper-2 px-3 py-2.5 text-sm text-heading">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--primary)]"
              disabled={!canWrite}
              checked={form.demoLogins}
              onChange={(e) => setForm({ ...form, demoLogins: e.target.checked })}
            />
            Allow demo login chips on /login
          </label>
        </Panel>

        {canWrite ? (
          <Button type="submit" loading={saving} disabled={saving} className="w-full sm:w-auto">
            Save all settings
          </Button>
        ) : (
          <p className="text-sm text-muted">You can view settings but not change them.</p>
        )}
      </div>
    </form>
  );
}
