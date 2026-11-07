"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { Staff } from "@/lib/types";
import { PhotoCapture } from "@/components/dashboard/PhotoCapture";
import { toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function ProfileEditor({
  name,
  email,
  staff,
}: {
  name: string;
  email: string;
  staff: Staff;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(staff.phone || "");
  const [area, setArea] = useState(staff.area || "");
  const [skills, setSkills] = useState(staff.skills.join(", "));
  const [bio, setBio] = useState(staff.bio || "");
  const [password, setPassword] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(staff.photoUrl || null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function onPhotoChange(dataUrl: string | null) {
    setPhotoPreview(dataUrl);
    setPhotoDataUrl(dataUrl);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        area,
        skills,
        bio,
        password: password || undefined,
        photoDataUrl: photoDataUrl === undefined ? undefined : photoDataUrl,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Update failed");
      toast.error("Profile update failed", data.error);
      return;
    }
    setMessage("Profile updated successfully");
    toast.success("Profile saved successfully");
    setPassword("");
    setPhotoDataUrl(undefined);
    if (data.staff?.photoUrl) setPhotoPreview(data.staff.photoUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="grid gap-2 lg:grid-cols-[260px_1fr]">
        <div className="soft-panel rounded-[var(--radius-2xl)] p-2.5">
          <div className="mx-auto mb-1.5 h-36 w-36 overflow-hidden rounded-full bg-paper-2 ring-4 ring-primary/10">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-3xl font-semibold text-primary">
                {name.slice(0, 1)}
              </div>
            )}
          </div>
          <PhotoCapture
            value={photoPreview}
            onChange={onPhotoChange}
            hint="JPG/PNG · clear face preferred"
            captureMode="user"
            showFrame={false}
          />
        </div>

        <div className="soft-panel space-y-2 rounded-[var(--radius-2xl)] p-2.5 md:p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Meta label="Name" value={name} />
            <Meta label="Login email" value={email} />
            <Meta label="Role" value={staff.role} />
            <div className="rounded-[var(--radius-xl)] bg-paper-2 p-4">
              <p className="text-label text-muted">Status</p>
              <div className="mt-2">
                <Badge tone={staff.status === "on-duty" ? "success" : "primary"}>
                  {staff.status}
                </Badge>
              </div>
            </div>
          </div>

          <label className="block text-sm font-medium text-heading">
            Phone
            <input className="field mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-heading">
            Area
            <input className="field mt-1.5" value={area} onChange={(e) => setArea(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-heading">
            Skills (comma separated)
            <input className="field mt-1.5" value={skills} onChange={(e) => setSkills(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-heading">
            About / bio
            <textarea
              className="field mt-1.5"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Experience, certifications, languages..."
            />
          </label>
          <label className="block text-sm font-medium text-heading">
            Change password (optional)
            <input
              className="field mt-1.5"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </label>

          <Button type="submit" loading={saving} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save profile"}
          </Button>
          {error ? <Alert tone="danger">{error}</Alert> : null}
          {message ? <Alert tone="success">{message}</Alert> : null}
        </div>
      </div>
    </form>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-xl)] bg-paper-2 p-4">
      <p className="text-label text-muted">{label}</p>
      <p className="font-name mt-1 text-heading">{value}</p>
    </div>
  );
}
