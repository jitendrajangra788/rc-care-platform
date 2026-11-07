import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Section, SectionHeading } from "@/components/ui/Section";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About Roshan Care"
        subtitle="Home care for Bhilwara families since 2018 — now with a modern system for staffing, billing, and family updates."
      />
      <Section>
        <div className="grid items-center gap-5 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Our story"
              title="Local care. Serious systems."
              subtitle="We combine trained nursing staff with digital duty tracking so families are never left guessing."
            />
            <p className="mt-6 text-[15px] leading-relaxed text-muted">
              Roshan Care started as a neighbourhood home-nursing desk and grew into a platform
              that keeps attendance, medicines, and shift notes visible — without losing the human
              warmth of in-home care.
            </p>
            <Link href="/book" className="btn btn-primary mt-8">
              Request care
            </Link>
          </div>
          <div className="relative min-h-[320px] overflow-hidden rounded-[var(--radius-2xl)]">
            <Image
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80"
              alt="Care team supporting a patient"
              fill
              className="object-cover"
              sizes="(max-width:1024px) 100vw, 50vw"
            />
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ["Since 2018", "Serving patients across Bhilwara with dependable home support."],
            ["People first", "Staff matched by skill, area, and patient need — not random dispatch."],
            ["Always reachable", "Care desk, phone, and WhatsApp for quick replacements."],
          ].map(([title, text]) => (
            <div key={title} className="rc-card-static p-6">
              <h2 className="font-display text-2xl tracking-[-0.03em] text-heading md:text-3xl">
                {title}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </Section>
      <SiteFooter />
    </>
  );
}
