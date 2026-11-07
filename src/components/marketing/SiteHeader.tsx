"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ tone = "light" }: { tone?: "light" | "dark" | "overlay" }) {
  const [open, setOpen] = useState(false);
  const overlay = tone === "overlay" || tone === "dark";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        overlay
          ? "bg-gradient-to-b from-[#07131f]/70 via-[#07131f]/25 to-transparent"
          : "border-b border-[var(--line)] bg-surface/85 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5 md:px-8 md:py-4">
        <Link href="/" className="min-w-0 flex-1">
          <span
            className={cn(
              "font-display block truncate text-[1.45rem] leading-none tracking-[-0.03em] sm:text-[1.7rem] md:text-[1.85rem]",
              overlay ? "text-white" : "text-heading",
            )}
          >
            Roshan Care
          </span>
          <span
            className={cn(
              "mt-1 block truncate text-[9px] font-semibold uppercase tracking-[0.16em] sm:text-[10px] sm:tracking-[0.2em]",
              overlay ? "text-white/65" : "text-primary",
            )}
          >
            Trusted Home Healthcare
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-2 text-[13px] font-medium transition",
                overlay
                  ? "text-white/80 hover:bg-white/10 hover:text-white"
                  : "text-muted hover:bg-paper-2 hover:text-heading",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
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
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-xl px-3 py-3 text-sm font-medium",
                  overlay ? "text-white" : "text-heading",
                )}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
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
            <div className="mt-2 grid gap-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-full px-4 py-3 text-center text-sm font-semibold",
                  overlay ? "bg-white/10 text-white" : "bg-paper-2 text-heading",
                )}
              >
                Login
              </Link>
              <Link
                href="/book"
                onClick={() => setOpen(false)}
                className="btn btn-primary w-full"
              >
                Book a Nurse
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
