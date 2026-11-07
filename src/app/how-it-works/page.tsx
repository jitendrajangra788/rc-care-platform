import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Section, SectionHeading } from "@/components/ui/Section";

export const metadata: Metadata = { title: "How it works" };

const steps = [
  {
    n: "01",
    title: "Request care",
    text: "Share patient needs, area, and preferred shift online, on call, or WhatsApp.",
  },
  {
    n: "02",
    title: "Care assessment",
    text: "Our desk matches nursing, attendant, or physio skills to the case.",
  },
  {
    n: "03",
    title: "Staff assigned",
    text: "A verified professional is assigned with clear timing and backup cover.",
  },
  {
    n: "04",
    title: "Daily updates",
    text: "GPS attendance, medicine chart, and care notes sync to the family portal.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        title="How Roshan Care works"
        subtitle="A simple path from enquiry to trusted home care — clear for families and coordinators."
      />
      <Section>
        <SectionHeading
          eyebrow="Process"
          title="Four clear steps"
          subtitle="From first message to visible daily care — without guesswork."
        />
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {steps.map((step) => (
            <div key={step.n} className="rc-card-static p-6 md:p-8">
              <p className="font-display text-5xl leading-none tracking-[-0.06em] text-primary/20">
                {step.n}
              </p>
              <h2 className="font-display mt-4 text-3xl tracking-[-0.03em] text-heading">
                {step.title}
              </h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">{step.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/book" className="btn btn-primary">
            Start a request <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link href="/pricing" className="btn btn-outline">
            View packages
          </Link>
        </div>
      </Section>
      <SiteFooter />
    </>
  );
}
