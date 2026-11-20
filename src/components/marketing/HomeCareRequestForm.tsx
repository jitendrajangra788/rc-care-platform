"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { FormSection, Honeypot, ReferencePanel, fileAccept, optionalFile } from "@/components/marketing/PublicForm";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { FieldHint, FormField, Input, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { toast } from "@/components/ui/toast";
import { HOME_DUTIES, HOME_SERVICES, SHIFT_PREFS } from "@/lib/enquiry-options";

const relationships = ["Son", "Daughter", "Spouse", "Parent", "Sibling", "Self", "Other"];

export function HomeCareRequestForm() {
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const documents = (
        await Promise.all([
          optionalFile(form.elements.namedItem("prescription") as HTMLInputElement, "Prescription"),
          optionalFile(form.elements.namedItem("doctorFile") as HTMLInputElement, "Doctor Instructions"),
          optionalFile(form.elements.namedItem("reportFile") as HTMLInputElement, "Medical Report"),
        ])
      ).filter((file) => file !== null);

      const res = await fetch("/api/home-care-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: fd.get("contactName"),
          mobile: fd.get("mobile"),
          email: fd.get("email") || "",
          relationship: fd.get("relationship"),
          patientName: fd.get("patientName"),
          patientAge: Number(fd.get("patientAge")),
          patientGender: fd.get("patientGender"),
          address: fd.get("address"),
          area: fd.get("area"),
          city: fd.get("city"),
          state: fd.get("state"),
          pinCode: fd.get("pinCode"),
          landmark: fd.get("landmark") || "",
          service: fd.get("service"),
          careDescription: fd.get("careDescription"),
          mobilityAssistance: fd.get("mobilityAssistance") === "on",
          specialCare: fd.get("specialCare") || "",
          doctorInstructions: fd.get("doctorInstructions") || "",
          dutyHours: fd.get("dutyHours"),
          preferredStartDate: fd.get("preferredStartDate"),
          preferredShift: fd.get("preferredShift"),
          urgency: fd.get("urgency"),
          documents,
          consentContact: fd.get("consentContact") === "on",
          consentPrivacy: fd.get("consentPrivacy") === "on",
          website: fd.get("website") || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not submit the request");
        toast.error("Request not submitted", data.error || "Check the form and try again");
        return;
      }
      setReference(String(data.id || ""));
      toast.success("Request received", data.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit the request";
      setError(message);
      toast.error("Request not submitted", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHero
        title="Request nursing care at home"
        subtitle="Tell us about the patient and the duty you need. The care desk reviews every request before a booking is confirmed."
      />
      <Section className="bg-[#F7FAF9]">
        {reference ? (
          <ReferencePanel title="Home care request received" reference={reference}>
            <p>Our desk will contact you to confirm the need, share a quotation, and schedule care.</p>
            <p>This request is not a confirmed booking yet.</p>
          </ReferencePanel>
        ) : (
          <form onSubmit={onSubmit} className="relative mx-auto max-w-3xl space-y-4">
            <Honeypot />
            <FormSection title="1. Contact person">
              <FormField label="Full name *">
                <Input name="contactName" required autoComplete="name" placeholder="Your full name" />
              </FormField>
              <FormField label="Mobile number *">
                <Input name="mobile" required inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" />
              </FormField>
              <FormField label="Email">
                <Input name="email" type="email" autoComplete="email" placeholder="Optional" />
              </FormField>
              <FormField label="Relationship with patient *">
                <Select name="relationship" required defaultValue="Son">
                  {relationships.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </FormField>
            </FormSection>

            <FormSection title="2. Patient details">
              <FormField label="Patient name *">
                <Input name="patientName" required placeholder="Patient full name" />
              </FormField>
              <FormField label="Age *">
                <Input name="patientAge" required type="number" min={0} max={120} placeholder="Age in years" />
              </FormField>
              <FormField label="Gender *">
                <Select name="patientGender" required defaultValue="Male">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </Select>
              </FormField>
            </FormSection>

            <FormSection title="3. Location">
              <FormField label="Full address *" className="sm:col-span-2">
                <Textarea name="address" required rows={3} placeholder="House, street, locality" />
              </FormField>
              <FormField label="Area *">
                <Input name="area" required placeholder="Subhash Nagar" />
              </FormField>
              <FormField label="City *">
                <Input name="city" required defaultValue="Bhilwara" />
              </FormField>
              <FormField label="State *">
                <Input name="state" required defaultValue="Rajasthan" />
              </FormField>
              <FormField label="PIN code *">
                <Input name="pinCode" required inputMode="numeric" maxLength={6} placeholder="311001" />
              </FormField>
              <FormField label="Landmark" className="sm:col-span-2">
                <Input name="landmark" placeholder="Near temple, school, or main road" />
              </FormField>
            </FormSection>

            <FormSection title="4. Required service">
              <FormField label="Service *" className="sm:col-span-2">
                <Select name="service" required defaultValue="Home Care Nursing">
                  {HOME_SERVICES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </FormField>
            </FormSection>

            <FormSection title="5. Care requirements">
              <FormField label="Care required *" className="sm:col-span-2">
                <Textarea name="careDescription" required rows={4} placeholder="Condition, daily help, and what the family needs" />
              </FormField>
              <label className="flex items-center gap-2 text-sm text-[#172D3A] sm:col-span-2">
                <input name="mobilityAssistance" type="checkbox" className="h-4 w-4 accent-[#087F8C]" />
                Mobility assistance required
              </label>
              <FormField label="Special care requirements" className="sm:col-span-2">
                <Textarea name="specialCare" rows={3} placeholder="Optional — tubes, wound care, dementia support" />
              </FormField>
              <FormField label="Doctor instructions" className="sm:col-span-2">
                <Textarea name="doctorInstructions" rows={3} placeholder="Optional" />
              </FormField>
            </FormSection>

            <FormSection title="6. Duty schedule">
              <FormField label="Duty *" className="sm:col-span-2">
                <Select name="dutyHours" required defaultValue="12 Hours">
                  {HOME_DUTIES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </FormField>
            </FormSection>

            <FormSection title="7. Booking preferences">
              <FormField label="Preferred start date *">
                <Input name="preferredStartDate" required type="date" />
              </FormField>
              <FormField label="Preferred shift *">
                <Select name="preferredShift" required defaultValue="Day">
                  {SHIFT_PREFS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Urgency *">
                <Select name="urgency" required defaultValue="Normal">
                  <option>Normal</option>
                  <option>Urgent</option>
                </Select>
              </FormField>
            </FormSection>

            <FormSection title="8. Optional documents">
              <FormField label="Prescription">
                <Input name="prescription" type="file" accept={fileAccept} />
              </FormField>
              <FormField label="Doctor instructions">
                <Input name="doctorFile" type="file" accept={fileAccept} />
              </FormField>
              <FormField label="Medical report" className="sm:col-span-2">
                <Input name="reportFile" type="file" accept={fileAccept} />
                <FieldHint>PDF, JPG, PNG, DOC, or DOCX. Maximum 2 MB each. Files stay private to the care desk.</FieldHint>
              </FormField>
            </FormSection>

            <FormSection title="9. Consent">
              <label className="flex items-start gap-2 text-sm text-[#172D3A] sm:col-span-2">
                <input name="consentContact" type="checkbox" required className="mt-0.5 h-4 w-4 accent-[#087F8C]" />
                <span>Roshan Care may contact me about this request.</span>
              </label>
              <label className="flex items-start gap-2 text-sm text-[#172D3A] sm:col-span-2">
                <input name="consentPrivacy" type="checkbox" required className="mt-0.5 h-4 w-4 accent-[#087F8C]" />
                <span>
                  I have read the{" "}
                  <Link href="/privacy" className="font-semibold text-[#087F8C] hover:underline">
                    privacy policy
                  </Link>
                  .
                </span>
              </label>
            </FormSection>

            {error ? (
              <Alert tone="danger" title="Could not submit">
                {error}
              </Alert>
            ) : null}
            <Button type="submit" loading={saving} className="w-full">
              {saving ? "Submitting…" : "Submit Home Care Request"}
            </Button>
          </form>
        )}
      </Section>
      <SiteFooter />
    </>
  );
}
