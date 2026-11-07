import Image from "next/image";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export function PageHero({
  title,
  subtitle,
  image = "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=2000&q=80",
}: {
  title: string;
  subtitle: string;
  image?: string;
}) {
  return (
    <div className="relative overflow-hidden bg-[#0d2130] text-white">
      <Image
        src={image}
        alt=""
        fill
        priority
        className="object-cover object-center opacity-35"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d2130]/75 via-[#0d2130]/80 to-[#0d2130]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(8,127,140,0.35),transparent_42%),radial-gradient(circle_at_90%_10%,rgba(221,245,236,0.12),transparent_35%)]" />
      <SiteHeader tone="overlay" />
      <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-6 md:px-8 md:pb-12 md:pt-8">
        <p className="font-display text-3xl tracking-[-0.03em] text-white md:text-4xl">
          Roshan Care
        </p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--secondary-deep)]">
          Trusted Home Healthcare
        </p>
        <h1 className="font-display mt-8 max-w-3xl text-3xl leading-[1.08] tracking-[-0.03em] text-white/95 md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
