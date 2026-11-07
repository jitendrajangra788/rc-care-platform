"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { FieldHint, FormField, Input, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { toast } from "@/components/ui/toast";

export default function BookPage() {
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientName: fd.get("patientName"),
        phone: fd.get("phone"),
        careType: fd.get("careType"),
        shift: fd.get("shift"),
        address: fd.get("address"),
        area: fd.get("area"),
        startDate: fd.get("startDate"),
        notes: fd.get("notes"),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not create booking");
      toast.error("Request failed", data.error || "Please try again");
      return;
    }
    setBookingId(data.booking.id);
    toast.success("Request submitted successfully", `Booking ID ${data.booking.id}`);
    e.currentTarget.reset();
  }

  return (
    <>
      <PageHero
        title="Request home care"
        subtitle="Submit patient details — our care desk assigns the right nurse or attendant."
        image="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=2000&q=80"
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={onSubmit} className="rc-card-static space-y-5 p-6 md:p-8">
            <SectionHeading
              title="Care request"
              subtitle="Fields marked * are required. We confirm on call / WhatsApp."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Patient name *">
                <Input
                  name="patientName"
                  required
                  placeholder="Full patient name"
                  autoComplete="name"
                />
              </FormField>
              <FormField label="Contact number *">
                <Input
                  name="phone"
                  required
                  placeholder="Mobile for updates"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </FormField>
              <FormField label="Care type *">
                <Select name="careType" defaultValue="Elderly Care">
                  <option>Elderly Care</option>
                  <option>Skilled Nursing</option>
                  <option>Post-Surgery Nursing</option>
                  <option>Wound Care</option>
                  <option>Mother & Baby</option>
                  <option>Physiotherapy</option>
                </Select>
              </FormField>
              <FormField label="Shift *">
                <Select name="shift" defaultValue="12hr">
                  <option value="8hr">8 hour · from ₹900</option>
                  <option value="12hr">12 hour · from ₹1,200</option>
                  <option value="24hr">24 hour · from ₹2,200</option>
                </Select>
              </FormField>
              <FormField label="Preferred start date">
                <Input name="startDate" type="date" />
              </FormField>
              <FormField label="Area">
                <Input name="area" placeholder="e.g. Subhash Nagar" />
              </FormField>
            </div>
            <FormField label="Full care address *">
              <Input name="address" required placeholder="House / street / landmark" />
            </FormField>
            <FormField label="Notes" hint="Condition, timings, special needs">
              <Textarea
                name="notes"
                rows={4}
                placeholder="Condition notes, timings, special needs"
              />
            </FormField>
            <Button type="submit" loading={saving} className="w-full md:w-auto">
              {saving ? "Submitting…" : "Submit request"}
            </Button>
            {error ? <FieldHint error>{error}</FieldHint> : null}
            {bookingId ? (
              <Alert tone="success" title={`Request created: ${bookingId}`}>
                We will call shortly.{" "}
                <Link href="/login" className="font-semibold text-primary underline">
                  Family login
                </Link>
              </Alert>
            ) : null}
          </form>

          <aside className="overflow-hidden rounded-[var(--radius-2xl)] bg-[#0d2130] text-white">
            <div className="p-8 md:p-10">
              <h2 className="font-display text-3xl tracking-[-0.03em]">What happens next?</h2>
              <ol className="mt-6 space-y-4">
                {[
                  "Care desk reviews skill and shift needs.",
                  "Verified staff is assigned with backup cover.",
                  "You get confirmation on call / WhatsApp.",
                  "Daily notes appear in the family portal.",
                ].map((step, i) => (
                  <li key={step} className="flex gap-3 text-white/70">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/30 text-xs font-semibold text-[var(--secondary-deep)]">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="mt-8 space-y-3 rounded-[var(--radius-lg)] bg-white/5 p-4 text-sm text-white/65">
                <p className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="h-4 w-4 text-[var(--secondary-deep)]" />
                  Starting packages from ₹900 / day
                </p>
                <p>8hr · 12hr · 24hr — final quote confirmed by desk.</p>
              </div>
              <a
                href="https://wa.me/917073231360"
                className="btn mt-8 w-full border-0 bg-white text-heading hover:bg-[var(--secondary)]"
              >
                Prefer WhatsApp?
              </a>
            </div>
          </aside>
        </div>
      </Section>
      <SiteFooter />
    </>
  );
}
