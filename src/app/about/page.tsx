import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { getPublicBrand } from "@/lib/public-brand";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const brand = await getPublicBrand();
  return (
    <>
      <PageHero
        orgName={brand.orgName}
        logoUrl={brand.logoUrl}
        title={`About ${brand.orgName}`}
        subtitle="Home care for Bhilwara families since 2018 — local people, careful matching, and a desk that stays reachable."
      />
      <section className="bg-[#f4f7f6]">
        <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Our story
              </p>
              <h2 className="font-display mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.08] tracking-[-0.03em] text-heading">
                Local care. Serious follow-through.
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-muted">
                {brand.orgName} began as a neighbourhood home-nursing desk and grew with one promise:
                families should always know who is coming, what the shift covers, and how the patient is doing.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                Today we combine trained staff with clear attendance and shift notes — without losing the warmth of care at home.
              </p>
              <Link href="/book" className="btn btn-primary mt-7">
                Request care <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative min-h-[320px] overflow-hidden rounded-[1.35rem] shadow-[0_18px_50px_rgba(15,23,42,0.1)]">
              <Image
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80"
                alt="Care team supporting a patient"
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 50vw"
              />
            </div>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-[var(--line)] md:grid-cols-3">
            {[
              ["Since 2018", "Serving patients across Bhilwara with dependable home support."],
              ["People first", "Staff matched by skill, area, and patient need — not random dispatch."],
              ["Always reachable", "Care desk, phone, and WhatsApp for quick replacements."],
            ].map(([title, text]) => (
              <div key={title} className="bg-white p-6 md:p-7">
                <h3 className="font-display text-xl tracking-[-0.02em] text-heading md:text-2xl">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter orgName={brand.orgName} logoUrl={brand.logoUrl} />
    </>
  );
}
