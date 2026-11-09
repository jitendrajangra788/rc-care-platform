import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { getPublicBrand } from "@/lib/public-brand";

export const metadata: Metadata = { title: "Services" };

const services = [
  {
    title: "Skilled Nursing",
    image:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1000&q=80",
    description:
      "Clinical nursing at home for injections, wound care, vitals, and doctor-directed protocols.",
    items: ["Wound dressing", "Injections & IV support", "BP / sugar monitoring", "Ryles tube care"],
  },
  {
    title: "Elderly Care",
    image:
      "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1000&q=80",
    description:
      "Respectful attendant support for daily living, safety, and companionship at home.",
    items: ["Mobility assistance", "Hygiene & bathing", "Medication reminders", "Companionship"],
  },
  {
    title: "Post-Surgery Care",
    image:
      "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1000&q=80",
    description:
      "Structured recovery support after discharge — observation, wound watch, and coordination.",
    items: ["Discharge support", "Pain observation", "Wound watch", "Doctor coordination"],
  },
  {
    title: "Mother & Baby",
    image:
      "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1000&q=80",
    description:
      "Trained attendants for early days at home when mother and newborn need extra hands.",
    items: ["Newborn care", "Mother recovery", "Feeding assistance", "Safe routines"],
  },
  {
    title: "Physiotherapy",
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1000&q=80",
    description:
      "Home physiotherapy sessions focused on mobility, strength, and pain management.",
    items: ["Stroke rehab", "Joint mobility", "Pain therapy", "Strength building"],
  },
  {
    title: "Critical Bed Care",
    image:
      "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1000&q=80",
    description:
      "Round-the-clock attendant focus for bed-bound patients with hygiene and positioning.",
    items: ["24hr attendant", "Positioning & hygiene", "Vitals logging", "Family briefings"],
  },
];

export default async function ServicesPage() {
  const brand = await getPublicBrand();
  return (
    <>
      <PageHero
        orgName={brand.orgName}
        logoUrl={brand.logoUrl}
        title="Home care services"
        subtitle="Clinical nursing and attendant support for recovery, elders, and long care days in Bhilwara."
        image="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=2000&q=80"
      />
      <section className="bg-[#f4f7f6]">
        <div className="mx-auto max-w-6xl space-y-5 px-5 py-12 md:px-8 md:py-16">
          {services.map((s, i) => (
            <article
              key={s.title}
              className="overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-white shadow-[0_10px_36px_rgba(15,23,42,0.04)] lg:grid lg:grid-cols-[0.85fr_1.15fr]"
            >
              <div className={`relative min-h-[220px] ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  className="object-cover"
                  sizes="(max-width:1024px) 100vw, 40vw"
                />
              </div>
              <div className="p-6 md:p-8 lg:p-9">
                <h2 className="font-display text-2xl tracking-[-0.03em] text-heading md:text-3xl">
                  {s.title}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{s.description}</p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {s.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-heading">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/book" className="btn btn-primary mt-7">
                  Book this service <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}

          <div className="flex flex-col gap-4 rounded-[1.25rem] bg-[#0b1f33] px-6 py-7 text-white md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <h3 className="font-display text-xl tracking-[-0.02em] md:text-2xl">
                Not sure which service fits?
              </h3>
              <p className="mt-1 max-w-lg text-sm text-white/65">
                Tell us the patient condition — the care desk recommends nursing vs attendant and shift length.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/book" className="btn btn-primary btn-sm">
                Book a Nurse
              </Link>
              <a
                href="tel:+917073231360"
                className="inline-flex items-center rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Call desk
              </a>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter orgName={brand.orgName} logoUrl={brand.logoUrl} />
    </>
  );
}
