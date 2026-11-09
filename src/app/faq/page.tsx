import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { faqItems, faqsByCategory } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "FAQ — Home Nursing in Bhilwara",
  description:
    "FAQ for home nurse in Bhilwara, elderly care, 12/24 hour nursing, charges, booking, and family updates — Roshan Care.",
  keywords: [
    "home nurse Bhilwara",
    "home nursing FAQ",
    "elderly care Bhilwara",
    "24 hour nurse at home",
    "attendant charges",
    "Roshan Care",
  ],
};

export default function FaqPage() {
  const grouped = faqsByCategory();

  return (
    <>
      <PageHero
        title="Home nursing FAQ"
        subtitle="Booking, charges, elderly care, and family updates — clear answers before you call the Bhilwara care desk."
      />

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-5 md:px-8 md:py-8">
        <div className="mb-5 flex flex-wrap gap-1.5">
          {[...grouped.keys()].map((cat) => (
            <a
              key={cat}
              href={`#${cat.toLowerCase()}`}
              className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-[11px] font-semibold text-heading transition hover:border-primary/30 hover:bg-[var(--secondary)]"
            >
              {cat}
            </a>
          ))}
        </div>

        <div className="space-y-6">
          {[...grouped.entries()].map(([category, items]) => (
            <section key={category} id={category.toLowerCase()} className="scroll-mt-24">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                {category}
              </p>
              <h2 className="font-display mt-1 text-xl tracking-tight text-heading sm:text-2xl">
                {category} questions
              </h2>
              <div className="mt-3 rounded-xl border border-[var(--line)] bg-white px-3 sm:px-4">
                <FaqAccordion items={items} defaultOpen={0} />
              </div>
            </section>
          ))}
        </div>
      </div>

      <section className="border-t border-[var(--line)] bg-[#f4f7f6]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-7 sm:px-5 md:flex-row md:items-center md:justify-between md:px-8 md:py-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              {faqItems.length} answers
            </p>
            <h2 className="font-display mt-1 text-xl text-heading sm:text-2xl">Still unsure?</h2>
            <p className="mt-1 max-w-lg text-sm text-muted">
              Care desk will guide shift length, charges, and staff match before you book.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <a href="tel:+917073231360" className="btn btn-primary btn-sm w-full justify-center sm:w-auto">
              <Phone className="h-4 w-4" /> Call desk
            </a>
            <a
              href="https://wa.me/917073231360"
              className="btn btn-outline btn-sm w-full justify-center sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <Link href="/book" className="btn btn-ghost btn-sm w-full justify-center sm:w-auto">
              Book a Nurse
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
