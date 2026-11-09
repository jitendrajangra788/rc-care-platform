"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Baby,
  BedDouble,
  CheckCircle2,
  Heart,
  Home,
  Phone,
  Plus,
  Stethoscope,
  Activity,
  Ambulance,
  type LucideIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { ContactCallbackSection } from "@/components/marketing/ContactCallbackSection";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { faqItems } from "@/lib/marketing-content";
import { cn } from "@/lib/utils";

const services: {
  title: string;
  tagline: string;
  text: string;
  icon: LucideIcon;
  accent?: "danger";
}[] = [
  {
    title: "Nursing staff",
    tagline: "Treatment at home",
    text: "Trained nurses for medicines, dressing, vitals and post-surgery care.",
    icon: Plus,
  },
  {
    title: "Elderly care",
    tagline: "Support at every step",
    text: "Daily routine help, medicines on time, mobility support and company.",
    icon: Heart,
  },
  {
    title: "House maid",
    tagline: "Care for the home",
    text: "Reliable helpers for household work and patient assistance.",
    icon: Home,
  },
  {
    title: "Baby care",
    tagline: "Love and safety",
    text: "Safe, affectionate care for infants and young children.",
    icon: Baby,
  },
  {
    title: "Physiotherapy",
    tagline: "Move better",
    text: "Home physiotherapy for comfortable recovery and mobility.",
    icon: Activity,
  },
  {
    title: "Doctor visit",
    tagline: "Consultation at home",
    text: "Doctor consultation at home when hospital travel is hard.",
    icon: Stethoscope,
  },
  {
    title: "Equipment",
    tagline: "Rent · buy · delivery",
    text: "Medical equipment on rent or purchase, delivered to your door.",
    icon: BedDouble,
  },
  {
    title: "Ambulance",
    tagline: "24×7 service",
    text: "Ambulance day and night — one phone call away.",
    icon: Ambulance,
    accent: "danger",
  },
];

const steps = [
  {
    n: "01",
    title: "Share the need",
    text: "Patient condition, shift hours, and address — call, WhatsApp, or book online.",
  },
  {
    n: "02",
    title: "We send staff",
    text: "Verified nurse or attendant matched for skill, area, and availability.",
  },
  {
    n: "03",
    title: "You stay updated",
    text: "Clear notes after every shift so the family never feels left out.",
  },
];

const trust = [
  ["Since 2018", "Serving Bhilwara families"],
  ["Verified staff", "Skill + document screened"],
  ["On-time shifts", "Desk backup if needed"],
  ["Family updates", "Notes after every visit"],
];

export function HomeExperience({
  orgName = "Roshan Care",
  logoUrl = "",
}: {
  orgName?: string;
  logoUrl?: string;
}) {
  return (
    <>
      <SiteHeader tone="light" orgName={orgName} logoUrl={logoUrl} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(165deg,#f3faf8_0%,#eef6f4_42%,#f7faf9_100%)]">
        <div className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-5 md:px-8 md:py-10">
          <p className="animate-rise text-[10px] font-semibold uppercase tracking-[0.16em] text-primary sm:text-[11px]">
            Home nursing · Bhilwara
          </p>
          <h1 className="animate-rise-delay font-display mt-2.5 max-w-3xl text-[clamp(1.7rem,6.5vw,3rem)] leading-[1.1] tracking-[-0.035em] text-heading">
            Home nurse & elderly care you can trust in Bhilwara
          </h1>
          <p className="animate-rise-delay-2 mt-3 max-w-xl text-[0.95rem] leading-relaxed text-muted sm:text-base">
            {orgName} provides verified nurses, attendants, and 12 / 24 hour home care — clear
            shifts and updates for your family.
          </p>
          <div className="animate-rise-delay-2 mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link href="/book" className="btn btn-primary w-full justify-center sm:w-auto">
              Book a Nurse <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href="tel:+917073231360"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line-strong)] bg-white px-5 py-3 text-sm font-semibold text-heading shadow-sm transition hover:bg-[#f0f7f6] sm:w-auto"
            >
              <Phone className="h-4 w-4 text-primary" /> Call 70732 31360
            </a>
          </div>
          <p className="mt-3 text-xs text-muted sm:text-sm">
            Prefer WhatsApp?{" "}
            <a href="https://wa.me/917073231360" className="font-semibold text-primary hover:underline">
              Message care desk
            </a>
          </p>
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-[var(--line)] bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 py-4 sm:gap-4 sm:px-5 md:grid-cols-4 md:px-8 md:py-4">
          {trust.map(([title, text]) => (
            <div key={title} className="flex gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary sm:h-9 sm:w-9">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-heading sm:text-sm">{title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted sm:text-xs">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-9 sm:px-5 md:px-8 md:py-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-[11px]">
            Our services
          </p>
          <h2 className="font-display mt-2 max-w-2xl text-[clamp(1.45rem,4vw,2.25rem)] leading-[1.1] tracking-[-0.03em] text-heading">
            Complete home care for your family
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Nursing, elderly care, physiotherapy, equipment & ambulance — one call.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {services.map((s) => {
              const Icon = s.icon;
              const danger = s.accent === "danger";
              return (
                <Link
                  key={s.title}
                  href={danger ? "tel:108" : "/book"}
                  className={cn(
                    "rounded-xl border bg-white p-4 transition hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)] active:scale-[0.99]",
                    danger
                      ? "border-danger/35 hover:border-danger/55"
                      : "border-[var(--line)] hover:border-primary/25",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-lg",
                      danger ? "bg-danger text-white" : "bg-[#eef1f4] text-heading",
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-3 text-[0.95rem] font-semibold text-heading">{s.title}</h3>
                  <p className="mt-0.5 text-xs font-medium text-heading/75">{s.tagline}</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{s.text}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-t border-[var(--line)] bg-[#f4f7f6]">
        <div className="mx-auto max-w-6xl px-4 py-9 sm:px-5 md:px-8 md:py-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary sm:text-[11px]">
            How it works
          </p>
          <h2 className="font-display mt-2 max-w-2xl text-[clamp(1.45rem,4vw,2.15rem)] leading-[1.1] tracking-[-0.03em] text-heading">
            Book once. Care arrives. Family stays calm.
          </h2>
          <div className="mt-6 grid gap-5 sm:gap-6 md:grid-cols-3 md:gap-0">
            {steps.map((step, idx) => (
              <div
                key={step.n}
                className={cn("md:px-5", idx > 0 && "md:border-l md:border-[var(--line)]")}
              >
                <span className="font-display text-3xl leading-none tracking-[-0.06em] text-primary/30 sm:text-4xl">
                  {step.n}
                </span>
                <h3 className="font-display mt-2.5 text-lg text-heading sm:text-xl">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5 md:px-8 md:py-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary sm:text-[11px]">
            From a Bhilwara family
          </p>
          <blockquote className="font-display mt-2.5 max-w-3xl text-xl leading-snug tracking-[-0.02em] text-heading sm:text-2xl md:text-[1.65rem]">
            “Every shift comes with a clear update — we never had this much visibility before.”
          </blockquote>
          <footer className="mt-3 text-xs text-muted sm:text-sm">Amit Jain · Subhash Nagar</footer>
        </div>
      </section>

      {/* Contact / callback — reference style */}
      <ContactCallbackSection />

      {/* FAQ */}
      <section className="border-t border-[var(--line)] bg-white">
        <div className="mx-auto max-w-3xl px-4 py-9 sm:px-5 md:px-8 md:py-12">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary sm:text-[11px]">
                FAQ
              </p>
              <h2 className="font-display mt-2 text-[clamp(1.45rem,4vw,2.1rem)] leading-[1.1] tracking-[-0.03em] text-heading">
                Home nursing questions
              </h2>
            </div>
            <Link href="/faq" className="text-sm font-semibold text-primary hover:underline">
              All FAQs →
            </Link>
          </div>
          <div className="mt-5 rounded-xl border border-[var(--line)] bg-[#f8faf9] px-3 sm:px-4">
            <FaqAccordion items={faqItems.slice(0, 6)} />
          </div>
        </div>
      </section>
    </>
  );
}
