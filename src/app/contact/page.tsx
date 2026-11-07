"use client";

import { FormEvent, useState } from "react";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { IconBadge } from "@/components/ui/IconBadge";
import { toast } from "@/components/ui/toast";

export default function ContactPage() {
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        careType: fd.get("careType"),
        message: fd.get("message"),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error("Message not sent", data.error || "Try again");
      return;
    }
    setDone(true);
    toast.success("Message sent successfully", "Care desk will contact you shortly");
    e.currentTarget.reset();
  }

  return (
    <>
      <PageHero
        title="Contact care desk"
        subtitle="S-315, Subhash Nagar Tempu Stand, Bhilwara 311001 · +91 70732 31360"
      />
      <Section>
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionHeading
              eyebrow="Contact"
              title="Send a message"
              subtitle="For urgent needs, call or WhatsApp. We respond on phone and chat."
            />
            <div className="mt-8 space-y-4">
              <a
                href="tel:+917073231360"
                className="rc-card flex items-center gap-4 p-4 transition hover:border-primary/25"
              >
                <IconBadge tone="primary">
                  <Phone className="h-4 w-4" />
                </IconBadge>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Call</p>
                  <p className="font-name text-heading">+91 70732 31360</p>
                </div>
              </a>
              <a
                href="https://wa.me/917073231360"
                className="rc-card flex items-center gap-4 p-4 transition hover:border-primary/25"
              >
                <IconBadge tone="success">
                  <MessageCircle className="h-4 w-4" />
                </IconBadge>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    WhatsApp
                  </p>
                  <p className="font-name text-heading">Care Desk chat</p>
                </div>
              </a>
              <div className="rc-card-static flex items-start gap-4 p-4">
                <IconBadge tone="secondary">
                  <MapPin className="h-4 w-4" />
                </IconBadge>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Visit / post
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-heading">
                    S-315, Subhash Nagar Tempu Stand, Bhilwara 311001
                  </p>
                </div>
              </div>
              <a href="tel:108" className="inline-flex text-sm font-semibold text-danger">
                108 Emergency
              </a>
            </div>
          </div>

          <form onSubmit={onSubmit} className="rc-card-static space-y-4 p-6 md:p-8">
            <FormField label="Name *">
              <Input name="name" required placeholder="Your name" autoComplete="name" />
            </FormField>
            <FormField label="Phone *">
              <Input
                name="phone"
                required
                placeholder="Mobile number"
                inputMode="tel"
                autoComplete="tel"
              />
            </FormField>
            <FormField label="Email">
              <Input
                name="email"
                type="email"
                placeholder="Optional email"
                autoComplete="email"
              />
            </FormField>
            <FormField label="Care type">
              <Select name="careType" defaultValue="Elderly Care">
                <option>Elderly Care</option>
                <option>Skilled Nursing</option>
                <option>Post-Surgery</option>
                <option>24hr Nursing</option>
                <option>Physiotherapy</option>
              </Select>
            </FormField>
            <FormField label="Message *">
              <Textarea name="message" required rows={5} placeholder="How can we help?" />
            </FormField>
            <Button type="submit" loading={saving} className="w-full">
              {saving ? "Sending…" : "Submit enquiry"}
            </Button>
            {done ? (
              <Alert tone="success" title="Thanks — message received">
                Our desk will reach out shortly.
              </Alert>
            ) : null}
          </form>
        </div>
      </Section>
      <SiteFooter />
    </>
  );
}
