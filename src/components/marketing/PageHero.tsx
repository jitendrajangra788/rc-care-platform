import { SiteHeader } from "@/components/marketing/SiteHeader";

export function PageHero({
  title,
  subtitle,
  orgName = "Roshan Care",
  logoUrl,
}: {
  title: string;
  subtitle: string;
  /** @deprecated kept for call-site compatibility — photos removed */
  image?: string;
  orgName?: string;
  logoUrl?: string;
}) {
  return (
    <div className="relative overflow-hidden bg-[linear-gradient(145deg,#0b1f33_0%,#0d3d42_55%,#0f766e_120%)] text-white">
      <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

      {/* relative + z-index so nav stays clickable above decorative layers */}
      <div className="relative z-20">
        <SiteHeader tone="overlay" orgName={orgName} logoUrl={logoUrl} />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-7 pt-5 sm:px-5 md:px-8 md:pb-9 md:pt-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--secondary-deep)] sm:text-[11px]">
          {orgName} · Bhilwara
        </p>
        <h1 className="font-display mt-2 max-w-3xl text-[clamp(1.55rem,5vw,2.5rem)] leading-[1.1] tracking-[-0.03em] text-white">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/72 sm:text-[15px]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
