import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Section, SectionHeading } from "@/components/ui/Section";
import { cn, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Pricing" };

const packages = [
  {
    name: "Day Shift",
    shift: "8 hours",
    price: 900,
    points: ["Attendant or basic nursing", "Vitals on request", "Ideal for short visits"],
  },
  {
    name: "Extended Care",
    shift: "12 hours",
    price: 1200,
    points: ["Nurse / attendant options", "Shift notes included", "Most chosen for elderly care"],
    featured: true,
  },
  {
    name: "Round the Clock",
    shift: "24 hours",
    price: 2200,
    points: ["Live-in style coverage", "Replacement support", "Daily family briefing"],
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        title="Clear packages"
        subtitle="Transparent starting rates for Bhilwara. Final quote depends on care complexity and staff skill."
      />
      <Section>
        <SectionHeading
          eyebrow="Pricing"
          title="Choose a shift length"
          subtitle="All packages include care-desk coordination. Clinical procedures may add specialist fees."
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {packages.map((pkg) => (
            <article
              key={pkg.name}
              className={cn(
                "rounded-[var(--radius-2xl)] p-7 md:p-8",
                pkg.featured
                  ? "bg-[#0d2130] text-white shadow-[var(--shadow-lg)] ring-2 ring-primary/30"
                  : "rc-card-static",
              )}
            >
              {pkg.featured ? (
                <span className="inline-flex rounded-full bg-primary/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--secondary-deep)]">
                  Most chosen
                </span>
              ) : null}
              <p
                className={cn(
                  "text-label mt-3",
                  pkg.featured ? "text-white/50" : "text-primary",
                )}
              >
                {pkg.shift}
              </p>
              <h2 className="font-display mt-3 text-3xl tracking-[-0.03em]">{pkg.name}</h2>
              <p className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
                {formatINR(pkg.price)}
                <span
                  className={cn(
                    "text-base font-normal",
                    pkg.featured ? "text-white/50" : "text-muted",
                  )}
                >
                  {" "}
                  / day
                </span>
              </p>
              <ul
                className={cn(
                  "mt-6 space-y-3 text-[15px]",
                  pkg.featured ? "text-white/70" : "text-muted",
                )}
              >
                {pkg.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <CheckCircle2
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        pkg.featured ? "text-[var(--secondary-deep)]" : "text-success",
                      )}
                    />
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                href="/book"
                className={cn(
                  "mt-8 inline-flex w-full justify-center",
                  pkg.featured ? "btn btn-primary" : "btn btn-outline",
                )}
              >
                Request this plan
              </Link>
            </article>
          ))}
        </div>

        <div className="soft-panel mt-6 grid gap-4 p-6 md:grid-cols-3 md:p-8">
          {[
            ["Included", "Care desk matching, attendance tracking, family updates"],
            ["May add on", "Specialist nursing tasks, complex clinical procedures"],
            ["Billing", "Invoices in family portal · UPI / desk collection"],
          ].map(([t, d]) => (
            <div key={t}>
              <p className="font-name text-heading">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </Section>
      <SiteFooter />
    </>
  );
}
