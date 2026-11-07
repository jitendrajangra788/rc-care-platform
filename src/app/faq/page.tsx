import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { faqItems, faqsByCategory } from "@/lib/marketing-content";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Roshan Care FAQ — booking, pricing, GPS attendance, family updates, and home nursing in Bhilwara.",
};

export default function FaqPage() {
  const grouped = faqsByCategory();

  return (
    <>
      <PageHero
        title="Frequently asked questions"
        subtitle="Booking, packages, family portal, aur staff replacement — clear answers before you call the desk."
        image="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=2000&q=80"
      />

      <Section className="py-10 md:py-12">
        <div className="flex flex-wrap gap-2">
          {[...grouped.keys()].map((cat) => (
            <a
              key={cat}
              href={`#${cat.toLowerCase()}`}
              className="rounded-full border border-[var(--line)] bg-surface px-4 py-2 text-xs font-semibold text-heading transition hover:border-primary/30 hover:bg-[var(--secondary)]"
            >
              {cat}
            </a>
          ))}
        </div>
      </Section>

      <div className="mx-auto max-w-6xl space-y-8 px-5 pb-20 md:px-8 md:pb-28">
        {[...grouped.entries()].map(([category, items]) => (
          <section key={category} id={category.toLowerCase()} className="scroll-mt-28">
            <p className="text-label text-primary">{category}</p>
            <h2 className="font-display mt-2 text-2xl tracking-tight text-heading md:text-3xl">
              {category} questions
            </h2>
            <div className="mt-6 max-w-3xl">
              <FaqAccordion items={items} defaultOpen={0} />
            </div>
          </section>
        ))}
      </div>

      <section className="border-t border-[var(--line)] bg-[linear-gradient(180deg,#f7faf9_0%,#eef6f3_100%)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-14 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-label text-primary">{faqItems.length} answers published</p>
            <h2 className="font-display mt-2 text-3xl tracking-tight text-heading">
              Still unsure?
            </h2>
            <p className="mt-2 max-w-lg text-sm text-muted">
              Care desk Bhilwara se directly guide karegi — shift, rate, aur staff match clear
              batayenge.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="tel:+917073231360" className="btn btn-primary">
              <Phone className="h-4 w-4" /> Call desk
            </a>
            <a
              href="https://wa.me/917073231360"
              className="btn btn-outline"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <Link href="/blog" className="btn btn-ghost">
              Read care guides
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
