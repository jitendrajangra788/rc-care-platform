"use client";

import { FormEvent, useState } from "react";
import { PageHero } from "@/components/marketing/PageHero";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { FieldHint, FormField, Input, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { toast } from "@/components/ui/toast";

export default function CareersPage() {
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        careType: `Staff application · ${fd.get("role")}`,
        message: fd.get("experience"),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not submit application");
      toast.error("Application failed", data.error || "Try again");
      return;
    }
    setDone(true);
    toast.success("Application received", "We will contact you soon");
    e.currentTarget.reset();
  }

  return (
    <>
      <PageHero
        title="Join our care team"
        subtitle="Nurses, attendants, and physiotherapists — fair shifts, clear payouts, modern duty workflow."
        image="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=2000&q=80"
      />
      <Section>
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionHeading
              eyebrow="Careers"
              title="Apply in minutes"
              subtitle="Share your role and experience. We will call for document verification."
            />
            <ul className="mt-8 space-y-3 text-sm text-muted">
              <li>• Verified duty workflow with GPS attendance</li>
              <li>• Clear per-shift payouts on the payroll desk</li>
              <li>• Bhilwara-local assignments with backup support</li>
            </ul>
          </div>

          <form onSubmit={onSubmit} className="rc-card-static space-y-4 p-6 md:p-8">
            <FormField label="Full name *">
              <Input name="name" required placeholder="Your full name" autoComplete="name" />
            </FormField>
            <FormField label="Phone *">
              <Input name="phone" required placeholder="Mobile number" inputMode="tel" autoComplete="tel" />
            </FormField>
            <FormField label="Email">
              <Input name="email" type="email" placeholder="Optional email" autoComplete="email" />
            </FormField>
            <FormField label="Role *">
              <Select name="role" defaultValue="Nurse">
                <option>Nurse</option>
                <option>Attendant</option>
                <option>Physio</option>
              </Select>
            </FormField>
            <FormField label="Experience *">
              <Textarea
                name="experience"
                required
                rows={4}
                placeholder="Experience, certifications, preferred areas"
              />
            </FormField>
            <Button type="submit" loading={saving} className="w-full">
              {saving ? "Submitting…" : "Submit application"}
            </Button>
            {error ? <FieldHint error>{error}</FieldHint> : null}
            {done ? (
              <Alert tone="success" title="Application received">
                Our desk will contact you for verification shortly.
              </Alert>
            ) : null}
          </form>
        </div>
      </Section>
      <SiteFooter />
    </>
  );
}
