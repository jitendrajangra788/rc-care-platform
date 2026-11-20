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
import {
  CAREER_SKILLS,
  EDUCATIONS,
  JOB_ROLES,
  NURSING_QUALIFICATIONS,
  SHIFT_PREFS,
} from "@/lib/enquiry-options";

export function CareerApplyForm() {
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [experience, setExperience] = useState<"Fresher" | "Experienced">("Fresher");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const skills = fd.getAll("skill").map(String);
    if (!skills.length) {
      setError("Select at least one skill");
      return;
    }
    setSaving(true);
    try {
      const documents = (
        await Promise.all([
          optionalFile(form.elements.namedItem("resume") as HTMLInputElement, "Resume", true),
          optionalFile(form.elements.namedItem("qualificationFile") as HTMLInputElement, "Qualification Certificate"),
          optionalFile(form.elements.namedItem("experienceFile") as HTMLInputElement, "Experience Certificate"),
        ])
      ).filter((file) => file !== null);

      const res = await fetch("/api/career-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fd.get("fullName"),
          mobile: fd.get("mobile"),
          email: fd.get("email"),
          dateOfBirth: fd.get("dateOfBirth"),
          gender: fd.get("gender"),
          address: fd.get("address"),
          city: fd.get("city"),
          state: fd.get("state"),
          pinCode: fd.get("pinCode"),
          applyingFor: fd.get("applyingFor"),
          preferredLocation: fd.get("preferredLocation"),
          expectedSalary: fd.get("expectedSalary") || "",
          employmentType: fd.get("employmentType"),
          preferredShift: fd.get("preferredShift"),
          highestEducation: fd.get("highestEducation"),
          nursingQualification: fd.get("nursingQualification"),
          institutionName: fd.get("institutionName"),
          passingYear: fd.get("passingYear"),
          experienceLevel: fd.get("experienceLevel"),
          yearsOfExperience: experience === "Experienced" ? Number(fd.get("yearsOfExperience") || 0) : 0,
          previousEmployer: fd.get("previousEmployer") || "",
          previousRole: fd.get("previousRole") || "",
          skills,
          otherSkills: fd.get("otherSkills") || "",
          availabilityType: fd.get("availabilityType"),
          availabilityShift: fd.get("availabilityShift"),
          joiningDate: fd.get("joiningDate"),
          documents,
          about: fd.get("about") || "",
          referenceContact: fd.get("referenceContact") || "",
          consent: fd.get("consent") === "on",
          website: fd.get("website") || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not submit the application");
        toast.error("Application not submitted", data.error || "Check the form and try again");
        return;
      }
      setReference(String(data.id || ""));
      toast.success("Application received", data.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit the application";
      setError(message);
      toast.error("Application not submitted", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHero
        title="Apply to join Roshan Care"
        subtitle="Nurses and caregivers can share their qualification, experience, and documents. Submitting this form does not create a staff login."
      />
      <Section className="bg-[#F7FAF9]">
        {reference ? (
          <ReferencePanel title="Job application received" reference={reference}>
            <p>Keep this reference number. The hiring desk will review your documents and contact you if you are shortlisted.</p>
            <p>A staff account is created only after verification and selection.</p>
          </ReferencePanel>
        ) : (
          <form onSubmit={onSubmit} className="relative mx-auto max-w-3xl space-y-4">
            <Honeypot />
            <FormSection title="1. Personal details">
              <FormField label="Full name *">
                <Input name="fullName" required autoComplete="name" />
              </FormField>
              <FormField label="Mobile number *">
                <Input name="mobile" required inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" />
              </FormField>
              <FormField label="Email *">
                <Input name="email" type="email" required autoComplete="email" />
              </FormField>
              <FormField label="Date of birth *">
                <Input name="dateOfBirth" type="date" required />
              </FormField>
              <FormField label="Gender *">
                <Select name="gender" required defaultValue="Female">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </Select>
              </FormField>
            </FormSection>

            <FormSection title="2. Address">
              <FormField label="Full address *" className="sm:col-span-2">
                <Textarea name="address" required rows={3} />
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
            </FormSection>

            <FormSection title="3. Job details">
              <FormField label="Applying for *">
                <Select name="applyingFor" required defaultValue="Nurse">
                  {JOB_ROLES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Preferred work location *">
                <Input name="preferredLocation" required defaultValue="Bhilwara" />
              </FormField>
              <FormField label="Expected salary">
                <Input name="expectedSalary" placeholder="Monthly or per shift" />
              </FormField>
              <FormField label="Employment type *">
                <Select name="employmentType" required defaultValue="Full Time">
                  <option>Full Time</option>
                  <option>Part Time</option>
                </Select>
              </FormField>
              <FormField label="Preferred shift *">
                <Select name="preferredShift" required defaultValue="Day">
                  {SHIFT_PREFS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </FormField>
            </FormSection>

            <FormSection title="4. Education and qualification">
              <FormField label="Highest education *">
                <Select name="highestEducation" required defaultValue="Graduate">
                  {EDUCATIONS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Nursing qualification *">
                <Select name="nursingQualification" required defaultValue="GNM">
                  {NURSING_QUALIFICATIONS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Institution name *">
                <Input name="institutionName" required />
              </FormField>
              <FormField label="Passing year *">
                <Input name="passingYear" required inputMode="numeric" maxLength={4} placeholder="2022" />
              </FormField>
            </FormSection>

            <FormSection title="5. Work experience">
              <FormField label="Experience *">
                <Select
                  name="experienceLevel"
                  required
                  value={experience}
                  onChange={(e) => setExperience(e.target.value as "Fresher" | "Experienced")}
                >
                  <option>Fresher</option>
                  <option>Experienced</option>
                </Select>
              </FormField>
              <FormField label={experience === "Experienced" ? "Years of experience *" : "Years of experience"}>
                <Input
                  name="yearsOfExperience"
                  type="number"
                  min={0}
                  max={60}
                  required={experience === "Experienced"}
                  disabled={experience === "Fresher"}
                  defaultValue={0}
                />
              </FormField>
              <FormField label="Previous employer">
                <Input name="previousEmployer" />
              </FormField>
              <FormField label="Previous job role">
                <Input name="previousRole" />
              </FormField>
            </FormSection>

            <FormSection title="6. Skills">
              <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
                {CAREER_SKILLS.map((skill) => (
                  <label key={skill} className="flex items-center gap-2 text-sm text-[#172D3A]">
                    <input type="checkbox" name="skill" value={skill} className="h-4 w-4 accent-[#087F8C]" />
                    {skill}
                  </label>
                ))}
              </div>
              <FormField label="Other skills" className="sm:col-span-2">
                <Input name="otherSkills" placeholder="Optional" />
              </FormField>
            </FormSection>

            <FormSection title="7. Availability">
              <FormField label="Full time / part time *">
                <Select name="availabilityType" required defaultValue="Full Time">
                  <option>Full Time</option>
                  <option>Part Time</option>
                </Select>
              </FormField>
              <FormField label="Day / night / rotational *">
                <Select name="availabilityShift" required defaultValue="Day">
                  {SHIFT_PREFS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Available joining date *">
                <Input name="joiningDate" type="date" required />
              </FormField>
            </FormSection>

            <FormSection title="8. Documents">
              <FormField label="Resume *">
                <Input name="resume" type="file" required accept={fileAccept} />
              </FormField>
              <FormField label="Qualification certificate">
                <Input name="qualificationFile" type="file" accept={fileAccept} />
              </FormField>
              <FormField label="Experience certificate" className="sm:col-span-2">
                <Input name="experienceFile" type="file" accept={fileAccept} />
                <FieldHint>PDF, JPG, PNG, DOC, or DOCX. Maximum 2 MB each. Documents are visible only to the hiring desk.</FieldHint>
              </FormField>
            </FormSection>

            <FormSection title="9. Additional information">
              <FormField label="About yourself" className="sm:col-span-2">
                <Textarea name="about" rows={4} placeholder="A short note about your work" />
              </FormField>
              <FormField label="Reference contact" className="sm:col-span-2">
                <Input name="referenceContact" placeholder="Name and mobile of a reference" />
              </FormField>
              <label className="flex items-start gap-2 text-sm text-[#172D3A] sm:col-span-2">
                <input name="consent" type="checkbox" required className="mt-0.5 h-4 w-4 accent-[#087F8C]" />
                <span>
                  I confirm these details are correct and agree to the{" "}
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
              {saving ? "Submitting…" : "Submit Job Application"}
            </Button>
          </form>
        )}
      </Section>
      <SiteFooter />
    </>
  );
}
