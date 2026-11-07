import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Section, SectionHeading } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Services" };

const services = [
  {
    title: "Skilled Nursing",
    image:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1000&q=80",
    description:
      "Clinical nursing at home for injections, wound care, vitals, and doctor-directed protocols.",
    items: ["Wound dressing", "Injections & IV support", "BP / sugar monitoring", "Ryles tube care"],
    suitable: ["Post-procedure patients", "Chronic illness", "Doctor-prescribed nursing tasks"],
  },
  {
    title: "Elderly Care",
    image:
      "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1000&q=80",
    description:
      "Respectful attendant support for daily living, safety, and companionship at home.",
    items: ["Mobility assistance", "Hygiene & bathing", "Medication reminders", "Companionship"],
    suitable: ["Senior citizens", "Mobility-limited elders", "Families needing day cover"],
  },
  {
    title: "Post-Surgery Care",
    image:
      "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1000&q=80",
    description:
      "Structured recovery support after discharge — observation, wound watch, and coordination.",
    items: ["Discharge support", "Pain observation", "Wound watch", "Doctor coordination"],
    suitable: ["Recent surgery patients", "Orthopedic recovery", "Short-term intensive cover"],
  },
  {
    title: "Mother & Baby",
    image:
      "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1000&q=80",
    description:
      "Trained attendants for early days at home when mother and newborn need extra hands.",
    items: ["Newborn care", "Mother recovery", "Feeding assistance", "Safe routines"],
    suitable: ["New mothers", "Joint-family support gaps", "First-time parents"],
  },
  {
    title: "Physiotherapy",
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1000&q=80",
    description:
      "Home physiotherapy sessions focused on mobility, strength, and pain management.",
    items: ["Stroke rehab", "Joint mobility", "Pain therapy", "Strength building"],
    suitable: ["Stroke recovery", "Joint pain / stiffness", "Post-fracture rehab"],
  },
  {
    title: "Critical Bed Care",
    image:
      "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1000&q=80",
    description:
      "Round-the-clock attendant focus for bed-bound patients with hygiene and positioning.",
    items: ["24hr attendant", "Positioning & hygiene", "Vitals logging", "Family briefings"],
    suitable: ["Bed-bound patients", "Long-term home care", "Night + day cover needs"],
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title="Home care services"
        subtitle="Clinical and personal care packages for recovery, elderly support, and long-day coverage in Bhilwara."
        image="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=2000&q=80"
      />
      <Section>
        <SectionHeading
          eyebrow="Care menu"
          title="What we provide"
          subtitle="Choose a care type, then book 8 / 12 / 24 hour coverage with desk coordination."
        />
        <div className="mt-6 grid gap-4">
          {services.map((s, i) => (
            <article
              key={s.title}
              className="rc-card-static overflow-hidden lg:grid lg:grid-cols-[0.9fr_1.1fr]"
            >
              <div className={`relative min-h-[240px] ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  className="object-cover"
                  sizes="(max-width:1024px) 100vw, 40vw"
                />
              </div>
              <div className="p-6 md:p-8 lg:p-10">
                <h2 className="font-display text-3xl tracking-[-0.03em] text-heading">
                  {s.title}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{s.description}</p>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-label text-primary">Includes</p>
                    <ul className="mt-3 space-y-2">
                      {s.items.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-heading">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-label text-primary">Best for</p>
                    <ul className="mt-3 space-y-2">
                      {s.suitable.map((item) => (
                        <li key={item} className="text-sm text-muted">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <Link href="/book" className="btn btn-primary mt-8">
                  Book this service <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-6 rounded-[var(--radius-2xl)] bg-[#0d2130] px-6 py-10 text-white md:px-10">
          <h3 className="font-display text-3xl tracking-[-0.03em]">
            Not sure which service fits?
          </h3>
          <p className="mt-3 max-w-xl text-white/65">
            Tell us the patient condition — care desk recommends nursing vs attendant and the right
            shift length.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/book" className="btn btn-primary">
              Book a Nurse
            </Link>
            <a href="tel:+917073231360" className="btn btn-outline border-white/20 text-white hover:bg-white/10">
              Call care desk
            </a>
          </div>
        </div>
      </Section>
      <SiteFooter />
    </>
  );
}
