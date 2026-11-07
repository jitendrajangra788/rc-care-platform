import Link from "next/link";
import { Phone, MapPin, MessageCircle } from "lucide-react";

const explore = [
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/blog", label: "Blog & guides" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/book", label: "Book a Nurse" },
];

const care = [
  { href: "/contact", label: "Contact desk" },
  { href: "/careers", label: "Careers" },
  { href: "/login", label: "Family / staff login" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-[#0d2130] text-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 md:grid-cols-[1.35fr_1fr_1fr] md:px-8 md:py-12">
        <div>
          <p className="font-display text-4xl tracking-[-0.03em]">Roshan Care</p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--secondary-deep)]">
            Trusted Home Healthcare
          </p>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/65">
            Verified nurses and attendants for Bhilwara families — clear packages, GPS attendance,
            and updates after every shift.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href="tel:+917073231360" className="btn btn-primary btn-sm">
              <Phone className="h-3.5 w-3.5" /> Call now
            </a>
            <a
              href="https://wa.me/917073231360"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          </div>
        </div>

        <div>
          <p className="text-label text-[var(--secondary-deep)]">Explore</p>
          <div className="mt-4 flex flex-col gap-2.5 text-[15px] text-white/70">
            {explore.map((l) => (
              <Link key={l.href} href={l.href} className="transition hover:text-white">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-label text-[var(--secondary-deep)]">Care desk</p>
          <div className="mt-4 space-y-3 text-[15px] text-white/70">
            <p className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              S-315, Subhash Nagar Tempu Stand, Bhilwara 311001
            </p>
            <a href="tel:+917073231360" className="flex items-center gap-2 hover:text-white">
              <Phone className="h-4 w-4 text-primary" />
              +91 70732 31360
            </a>
            <a
              href="https://wa.me/917073231360"
              className="flex items-center gap-2 hover:text-white"
            >
              <MessageCircle className="h-4 w-4 text-primary" />
              WhatsApp Care Desk
            </a>
            <a href="tel:108" className="block font-semibold text-accent">
              108 Emergency
            </a>
            <div className="pt-2">
              {care.map((l) => (
                <Link
                  key={l.href + l.label}
                  href={l.href}
                  className="mt-2 block transition hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-sm text-white/40 md:px-8">
        © 2026 Roshan Care · Home nursing for Bhilwara & nearby areas
      </div>
    </footer>
  );
}
