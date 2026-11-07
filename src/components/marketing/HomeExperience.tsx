"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  HeartPulse,
  MapPin,
  Phone,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { blogPosts, faqItems } from "@/lib/marketing-content";
import { formatDate } from "@/lib/format";
import { cn, formatINR } from "@/lib/utils";

const services = [
  {
    title: "Skilled Nursing",
    text: "Injections, wound care, vitals, IV support, and clinical protocols at home.",
    image:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Elderly Care",
    text: "Mobility, hygiene, medication reminders, and calm companionship.",
    image:
      "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Post-Surgery",
    text: "Discharge support, pain watch, wound observation, and doctor coordination.",
    image:
      "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Mother & Baby",
    text: "Trained attendants for recovery days, feeding help, and safe routines.",
    image:
      "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=900&q=80",
  },
];

const reasons = [
  {
    icon: ShieldCheck,
    title: "Verified professionals",
    text: "Nurses and attendants screened for skill, documents, and local reliability.",
  },
  {
    icon: MapPin,
    title: "GPS attendance",
    text: "Present marked at the care address with location and site photo.",
  },
  {
    icon: HeartPulse,
    title: "Medicine & vitals logged",
    text: "Family portal shows what was given, when, and how the patient responded.",
  },
  {
    icon: Clock3,
    title: "Backup cover",
    text: "Care desk manages replacements so a missed shift does not become a crisis.",
  },
];

const steps = [
  {
    n: "01",
    title: "Share the need",
    text: "Patient condition, shift length, and address — call, WhatsApp, or book online.",
  },
  {
    n: "02",
    title: "We match staff",
    text: "Verified nurses or attendants assigned by skill, area, and availability.",
  },
  {
    n: "03",
    title: "Care stays visible",
    text: "GPS present, medicine chart, and shift notes appear in the family portal.",
  },
];

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

const testimonials = [
  {
    quote:
      "Maa ke liye 12hr nurse lagi. Har shift pe update milta hai — pehle kabhi itna clear nahi tha.",
    name: "Amit Jain",
    area: "Subhash Nagar",
  },
  {
    quote:
      "Post-surgery wound care ghar pe mil gaya. Staff on time aayi, medicine chart bhi portal pe dikhta hai.",
    name: "Kavita Sharma",
    area: "Bapu Nagar",
  },
  {
    quote:
      "Care desk ne backup nurse same din bhej di. Emergency me bhi process calm laga.",
    name: "Rohit Mehta",
    area: "Shastri Nagar",
  },
];

const faqs = faqItems.slice(0, 4);

function hourDeskLabel() {
  const h = new Date().getHours();
  if (h < 6) return "Night cover ready in Bhilwara";
  if (h < 12) return "Morning desk matching nurses";
  if (h < 17) return "Afternoon shifts filling now";
  if (h < 21) return "Evening care desk online";
  return "Night nursing cover available";
}

export function HomeExperience() {
  const [scrolled, setScrolled] = useState(false);
  const [hourLabel] = useState(hourDeskLabel);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.72);
    const boot = window.setTimeout(onScroll, 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(boot);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        <SiteHeader tone="light" />
      </div>

      {/* Hero */}
      <section className="relative min-h-[85svh] overflow-hidden text-white">
        <Image
          src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=2400&q=80"
          alt="Nurse holding a patient's hand during home care"
          fill
          priority
          className="home-kenburns object-cover object-[center_28%]"
          sizes="100vw"
        />
        <div className="home-hero-veil absolute inset-0" />

        <div className="relative z-10 flex min-h-[85svh] flex-col">
          <div className={cn("transition-opacity duration-500", scrolled ? "opacity-0" : "opacity-100")}>
            <SiteHeader tone="overlay" />
          </div>

          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-10 pt-6 md:px-8 md:pb-12">
            <p className="animate-rise text-label text-white/70">{hourLabel}</p>
            <h1 className="animate-rise-delay font-display mt-4 max-w-4xl text-[clamp(2.5rem,8vw,4.5rem)] leading-[0.9] tracking-[-0.045em]">
              Roshan Care
            </h1>
            <p className="animate-rise-delay-2 mt-5 max-w-xl text-lg font-medium leading-snug text-white/90 md:text-xl">
              Trusted home nursing in Bhilwara — verified staff, clear packages, and updates every
              shift.
            </p>
            <div className="animate-rise-delay-2 mt-5 flex flex-wrap gap-2">
              <Link href="/book" className="btn btn-primary">
                Book a Nurse <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a
                href="tel:+917073231360"
                className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
              >
                <Phone className="h-4 w-4" /> Call Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-[var(--line)] bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-5 sm:grid-cols-2 md:grid-cols-4 md:px-8">
          {[
            ["Since 2018", "Serving Bhilwara families"],
            ["Verified staff", "Skill + document screened"],
            ["GPS attendance", "Present with site photo"],
            ["Family portal", "Notes & medicine chart"],
          ].map(([title, text]) => (
            <div key={title} className="flex gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-name text-sm text-heading">{title}</p>
                <p className="mt-0.5 text-xs text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services overview */}
      <section className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-label text-primary">Services</p>
            <h2 className="font-display mt-3 text-display-lg text-heading">
              Home care for recovery, age, and long days
            </h2>
            <p className="mt-4 text-body">
              Clinical nursing and personal attendant support — packaged so families know who is
              coming and what the shift covers.
            </p>
          </div>
          <Link href="/services" className="btn btn-outline">
            All services <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <article
              key={s.title}
              className="rc-card group overflow-hidden"
            >
              <div className="relative h-36 overflow-hidden">
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width:768px) 100vw, 25vw"
                />
              </div>
              <div className="p-3.5">
                <h3 className="font-display text-xl text-heading">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Why choose */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
          <div className="max-w-2xl">
            <p className="text-label text-primary">Why Roshan Care</p>
            <h2 className="font-display mt-3 text-display-lg text-heading">
              Not just a nurse at the door — a living care desk
            </h2>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {reasons.map((r) => (
              <div key={r.title} className="rc-card-static flex gap-3 p-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <r.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-name text-lg text-heading">{r.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <p className="text-label text-primary">How it works</p>
        <h2 className="font-display mt-3 max-w-3xl text-display-lg text-heading">
          One call. One match. Care that stays visible.
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((step, idx) => (
            <div
              key={step.n}
              className={cn(
                "relative",
                idx > 0 && "md:border-l md:border-[var(--line)] md:pl-8",
              )}
            >
              <span className="font-display text-5xl leading-none tracking-[-0.06em] text-primary/20">
                {step.n}
              </span>
              <h3 className="font-display mt-4 text-2xl text-heading">{step.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{step.text}</p>
            </div>
          ))}
        </div>
        <Link href="/how-it-works" className="btn btn-secondary mt-5">
          See full process
        </Link>
      </section>


      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <div className="max-w-2xl">
          <p className="text-label text-primary">Packages</p>
          <h2 className="font-display mt-3 text-display-lg text-heading">
            Clear starting rates
          </h2>
          <p className="mt-4 text-body">
            Transparent shift packages for Bhilwara. Final quote depends on care complexity.
          </p>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {packages.map((pkg) => (
            <article
              key={pkg.name}
              className={cn(
                "rounded-[var(--radius-xl)] p-4",
                pkg.featured
                  ? "bg-[#0d2130] text-white shadow-[var(--shadow-lg)]"
                  : "rc-card-static",
              )}
            >
              <p
                className={cn(
                  "text-label",
                  pkg.featured ? "text-white/50" : "text-primary",
                )}
              >
                {pkg.shift}
              </p>
              <h3 className="font-display mt-3 text-3xl tracking-[-0.03em]">{pkg.name}</h3>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
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
                  "mt-6 space-y-2.5 text-[15px]",
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
                  "mt-8 inline-flex",
                  pkg.featured ? "btn btn-primary" : "btn btn-outline",
                )}
              >
                Request this plan
              </Link>
            </article>
          ))}
        </div>
        <Link href="/pricing" className="mt-8 inline-flex text-sm font-semibold text-primary">
          Full pricing details <ArrowUpRight className="ml-1 inline h-4 w-4" />
        </Link>
      </section>

      {/* Testimonials */}
      <section className="bg-[#0d2130] text-white">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
          <p className="text-label text-[var(--secondary-deep)]">Families</p>
          <h2 className="font-display mt-3 text-display-lg text-white">
            What patients&apos; families say
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <blockquote
                key={t.name}
                className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="mt-4 text-[15px] leading-relaxed text-white/80">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-5">
                  <p className="font-name text-white">{t.name}</p>
                  <p className="text-xs text-white/45">{t.area}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>


      {/* Blog teaser */}
      <section className="border-t border-[var(--line)] bg-[linear-gradient(180deg,#f7faf9_0%,#ffffff_48%,#f7faf9_100%)]">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-label text-primary">Blog</p>
              <h2 className="font-display mt-3 text-display-lg text-heading">
                Care guides for families
              </h2>
              <p className="mt-3 max-w-xl text-body">
                Recovery checklists, elderly safety, GPS trust, aur medicine charts — practical
                notes from the Bhilwara desk.
              </p>
            </div>
            <Link href="/blog" className="btn btn-outline">
              All articles <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {blogPosts.slice(0, 2).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-surface transition hover:border-primary/25 hover:shadow-[var(--shadow-md)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={post.image}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width:768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                    {post.category}
                  </p>
                  <h3 className="font-display mt-2 text-lg text-heading">{post.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{post.excerpt}</p>
                  <p className="mt-3 text-[11px] font-semibold text-muted">
                    {formatDate(post.publishedAt)} · {post.readMins} min
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[var(--line)] bg-surface">
        <div className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-label text-primary">FAQ</p>
              <h2 className="font-display mt-3 text-display-lg text-heading">
                Common questions
              </h2>
            </div>
            <Link href="/faq" className="text-sm font-semibold text-primary hover:underline">
              Full FAQ →
            </Link>
          </div>
          <div className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 py-3 text-left"
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    aria-expanded={open}
                  >
                    <span className="font-name text-[15px] text-heading md:text-base">{f.q}</span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-muted transition",
                        open && "rotate-180 text-primary",
                      )}
                    />
                  </button>
                  {open ? (
                    <p className="pb-3 text-sm leading-relaxed text-muted">{f.a}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden bg-[#0d2130] text-white">
        <div className="pointer-events-none absolute -right-20 top-0 h-[420px] w-[420px] rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-[320px] w-[320px] rounded-full bg-[var(--secondary)]/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
          <div className="flex flex-wrap items-center gap-3 text-white/50">
            <Stethoscope className="h-4 w-4" />
            <span className="text-label text-white/45">Bhilwara care desk</span>
          </div>
          <h2 className="font-display mt-5 max-w-4xl text-4xl tracking-[-0.04em] md:text-5xl">
            Need a nurse today?
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">
            Tell us the shift and care type. We match a verified professional and keep your family
            updated through the portal.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href="/book" className="btn btn-primary">
              Book a Nurse <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href="tel:+917073231360"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Phone className="h-4 w-4" /> Call Now
            </a>
            <a
              href="https://wa.me/917073231360"
              className="inline-flex items-center gap-2 px-4 py-3.5 text-sm font-semibold text-white/75 hover:text-white"
            >
              WhatsApp desk
            </a>
          </div>
          <a
            href="tel:+917073231360"
            className="font-display mt-6 block text-[clamp(1.6rem,4vw,2.5rem)] leading-none tracking-[-0.04em] text-white/90 transition hover:text-[var(--secondary-deep)]"
          >
            +91 70732 31360
          </a>
        </div>
      </section>
    </>
  );
}
