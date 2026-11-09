import Link from "next/link";
import { Phone, MapPin, MessageCircle } from "lucide-react";

const links = [
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/book", label: "Book a Nurse" },
  { href: "/login", label: "Login" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter({
  orgName = "Roshan Care",
  logoUrl = "",
}: {
  orgName?: string;
  logoUrl?: string;
}) {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#071824] text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:grid-cols-[1.35fr_1fr] md:px-8 md:py-9">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white/95">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
              ) : (
                <span className="font-display text-lg font-semibold text-[var(--primary-deep)]">
                  {orgName.slice(0, 1)}
                </span>
              )}
            </span>
            <div>
              <p className="font-display text-2xl tracking-[-0.03em]">{orgName}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--secondary-deep)]">
                Home Nursing · Bhilwara
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
            Verified nurses and attendants for families — clear shifts and calm updates from the care desk.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="tel:+917073231360" className="btn btn-primary btn-sm">
              <Phone className="h-3.5 w-3.5" /> Call now
            </a>
            <a
              href="https://wa.me/917073231360"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          </div>
        </div>

        <div className="space-y-3 text-sm text-white/65">
          <p className="flex gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            S-315, Subhash Nagar Tempu Stand, Bhilwara 311001
          </p>
          <a href="tel:+917073231360" className="flex items-center gap-2 hover:text-white">
            <Phone className="h-4 w-4 text-primary" />
            +91 70732 31360
          </a>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1 text-[13px]">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="transition hover:text-white">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-3 text-center text-xs text-white/40 md:px-8">
        © 2026 {orgName} · Home nursing in Bhilwara
      </div>
    </footer>
  );
}
