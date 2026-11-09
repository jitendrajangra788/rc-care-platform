"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const links = [
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({
  tone = "light",
  logoUrl: logoProp,
  orgName = "Roshan Care",
}: {
  tone?: "light" | "dark" | "overlay";
  logoUrl?: string;
  orgName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(logoProp || "");
  const { locale, setLocale } = useLocale();
  const pathname = usePathname();
  const overlay = tone === "overlay" || tone === "dark";

  useEffect(() => {
    if (logoProp) {
      setLogoUrl(logoProp);
      return;
    }
    let cancelled = false;
    fetch("/api/public/brand")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.logoUrl) setLogoUrl(String(data.logoUrl));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [logoProp]);

  return (
    <header
      className={cn(
        "relative z-50 transition-colors duration-300",
        overlay
          ? "bg-transparent"
          : "sticky top-0 border-b border-[var(--line)] bg-white/92 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 md:px-8 md:py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          {logoUrl ? (
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg",
                overlay ? "bg-white/95" : "bg-[#f0f7f6] ring-1 ring-[var(--line)]",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="" className="h-full w-full object-contain p-0.5" />
            </span>
          ) : null}
          <span className="min-w-0">
            <span
              className={cn(
                "font-display block truncate text-[1.35rem] leading-none tracking-[-0.03em] sm:text-[1.55rem]",
                overlay ? "text-white" : "text-heading",
              )}
            >
              {orgName}
            </span>
            <span
              className={cn(
                "mt-1 block truncate text-[9px] font-semibold uppercase tracking-[0.18em] sm:text-[10px] sm:tracking-[0.2em]",
                overlay ? "text-white/65" : "text-primary",
              )}
            >
              Trusted Home Healthcare
            </span>
          </span>
        </Link>

        <nav className="relative z-50 hidden items-center gap-0.5 xl:flex">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-2 text-[13px] font-medium transition",
                  overlay
                    ? active
                      ? "bg-white/15 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                    : active
                      ? "bg-[#e8f5f3] text-primary"
                      : "text-muted hover:bg-paper-2 hover:text-heading",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <div
            className={cn(
              "inline-flex rounded-full border p-0.5 text-[11px] font-bold uppercase tracking-wide",
              overlay ? "border-white/20" : "border-[var(--line)]",
            )}
            role="group"
            aria-label="Language"
          >
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={cn(
                "rounded-full px-2.5 py-1.5 transition",
                locale === "en"
                  ? overlay
                    ? "bg-white text-[#066670]"
                    : "bg-primary text-white"
                  : overlay
                    ? "text-white/70 hover:text-white"
                    : "text-muted hover:text-heading",
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLocale("hi")}
              className={cn(
                "rounded-full px-2.5 py-1.5 transition",
                locale === "hi"
                  ? overlay
                    ? "bg-white text-[#066670]"
                    : "bg-primary text-white"
                  : overlay
                    ? "text-white/70 hover:text-white"
                    : "text-muted hover:text-heading",
              )}
            >
              HI
            </button>
          </div>
          <a
            href="tel:+917073231360"
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-semibold transition",
              overlay ? "text-white hover:bg-white/10" : "text-heading hover:bg-paper-2",
            )}
          >
            <Phone className="h-3.5 w-3.5 text-primary" />
            70732 31360
          </a>
          <Link
            href="/login"
            className={cn(
              "rounded-full px-4 py-2 text-[13px] font-semibold transition",
              overlay
                ? "bg-white/12 text-white hover:bg-white/18"
                : "bg-paper-2 text-heading hover:bg-secondary",
            )}
          >
            Login
          </Link>
          <Link href="/book" className="btn btn-primary btn-sm">
            Book a Nurse
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "hi" : "en")}
            className={cn(
              "rounded-full px-2.5 py-2 text-[11px] font-bold uppercase",
              overlay ? "bg-white/12 text-white" : "bg-paper-2 text-heading",
            )}
            aria-label="Switch language"
          >
            {locale === "en" ? "HI" : "EN"}
          </button>
          <Link href="/book" className="btn btn-primary btn-sm">
            Book
          </Link>
          <button
            type="button"
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full transition",
              overlay ? "bg-white/12 text-white" : "bg-paper-2 text-heading",
            )}
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          className={cn(
            "border-t px-5 py-4 lg:hidden",
            overlay ? "border-white/10 bg-[#0a1c2e]/95" : "border-[var(--line)] bg-surface",
          )}
        >
          <div className="flex flex-col gap-1">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-xl px-3 py-3 text-sm font-medium",
                    overlay
                      ? active
                        ? "bg-white/15 text-white"
                        : "text-white"
                      : active
                        ? "bg-[#e8f5f3] text-primary"
                        : "text-heading",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <a
              href="tel:+917073231360"
              className={cn(
                "rounded-xl px-3 py-3 text-sm font-medium",
                overlay ? "text-white" : "text-heading",
              )}
              onClick={() => setOpen(false)}
            >
              Call 70732 31360
            </a>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={cn(
                "mt-2 rounded-full px-4 py-3 text-center text-sm font-semibold",
                overlay ? "bg-white/10 text-white" : "bg-paper-2 text-heading",
              )}
            >
              Login
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
