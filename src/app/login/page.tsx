"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  LoaderCircle,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const showDemos = process.env.NEXT_PUBLIC_DEMO_LOGINS !== "false";

const demos = [
  {
    role: "Admin",
    title: "Care Desk",
    email: "admin@roshancare.in",
    password: "admin123",
  },
  {
    role: "Coordinator",
    title: "Coordinator",
    email: "coord@roshancare.in",
    password: "coord123",
  },
  {
    role: "Nurse",
    title: "Nurse",
    email: "nurse@roshancare.in",
    password: "12345678",
  },
] as const;

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-[0.85rem] bg-primary text-white shadow-[var(--shadow-sm)]",
        className,
      )}
      aria-hidden
    >
      <HeartPulse className="h-4 w-4" strokeWidth={2.25} />
    </span>
  );
}

export default function LoginPage() {
  const emailId = useId();
  const passwordId = useId();
  const busy = useRef(false);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  async function loginWith(nextEmail: string, nextPassword: string, demoRole?: string) {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    setEmail(nextEmail);
    setPassword(nextPassword);
    if (demoRole) setActiveDemo(demoRole);

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        signal: controller.signal,
        body: JSON.stringify({ email: nextEmail, password: nextPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Login failed");
        toast.error("Login failed", data.error || "Check email / password");
        busy.current = false;
        setLoading(false);
        setActiveDemo(null);
        return;
      }

      toast.success("Welcome back", data.user?.name || "Signed in");
      // Full navigation so session cookie + role dashboard assign reliably
      const dest = String(data.redirectTo || "/dashboard");
      window.location.assign(dest);
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      setError(aborted ? "Login timed out. Try again." : "Network error. Please try again.");
      toast.error(aborted ? "Timed out" : "Network error", "Please try again");
      busy.current = false;
      setLoading(false);
      setActiveDemo(null);
    } finally {
      window.clearTimeout(timer);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void loginWith(email.trim(), password);
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-white">
      <div className="relative z-10 flex h-full w-full items-stretch justify-center p-2.5 sm:items-center sm:p-4 md:p-5">
        <div className="animate-rise grid h-full w-full max-w-[980px] overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-white shadow-[0_16px_48px_rgba(15,23,42,0.08)] sm:h-auto sm:max-h-[min(100%,640px)] md:grid-cols-2 md:min-h-0 md:h-[min(100%,600px)]">
          {/* Left visual — desktop only */}
          <aside className="relative isolate hidden overflow-hidden md:block">
            <Image
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1400&q=80"
              alt=""
              fill
              priority
              className="object-cover object-[center_16%]"
              sizes="490px"
            />
            <div className="absolute inset-0 bg-[linear-gradient(165deg,rgba(11,31,51,0.08)_0%,rgba(11,31,51,0.28)_45%,rgba(7,40,48,0.94)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 space-y-3 p-7 lg:p-8">
              <div className="flex items-center gap-2.5">
                <BrandMark className="h-10 w-10 bg-white/12 ring-1 ring-white/35 backdrop-blur-md" />
                <div>
                  <p className="font-display text-[1.55rem] leading-none tracking-[-0.035em] text-white">
                    Roshan Care
                  </p>
                  <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-teal-100/75">
                    Trusted Home Healthcare
                  </p>
                </div>
              </div>
              <p className="max-w-[19rem] text-[13px] leading-relaxed text-white/85">
                Bookings, GPS present, medicine charts, and family updates — one desk for Bhilwara.
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-white/65">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-200" />
                  Session secured
                </span>
                <a href="tel:+917073231360" className="inline-flex items-center gap-1 hover:text-white">
                  <Phone className="h-3.5 w-3.5 text-teal-200" />
                  70732 31360
                </a>
              </div>
            </div>
          </aside>

          {/* Form column */}
          <section className="flex h-full min-h-0 flex-col justify-between px-4 py-3.5 sm:px-7 sm:py-5 lg:px-9">
            <div className="min-h-0">
              {/* Compact mobile brand */}
              <div className="mb-3 flex items-center gap-2.5 md:mb-4 md:hidden">
                <BrandMark />
                <div>
                  <p className="font-display text-lg leading-none tracking-[-0.03em] text-heading">
                    Roshan Care
                  </p>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                    Care desk login
                  </p>
                </div>
              </div>

              <div className="mb-3 hidden md:block">
                <BrandMark />
              </div>

              <h1 className="font-display text-[1.55rem] leading-none tracking-[-0.035em] text-heading sm:text-[1.85rem]">
                Welcome back
              </h1>
              <p className="mt-1 text-[13px] text-muted">Sign in to your care desk.</p>

              <form onSubmit={onSubmit} className="mt-3.5 space-y-2.5 sm:mt-4 sm:space-y-3">
                <div>
                  <label htmlFor={emailId} className="mb-1 block text-[13px] font-semibold text-heading">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      id={emailId}
                      className="field field-with-icon !h-10 !rounded-[0.85rem] !py-0 text-[15px]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      autoComplete="username"
                      placeholder="you@roshancare.in"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label htmlFor={passwordId} className="text-[13px] font-semibold text-heading">
                      Password
                    </label>
                    <a
                      href="tel:+917073231360"
                      className="text-[12px] font-semibold text-primary hover:text-[var(--primary-deep)]"
                    >
                      Forgot?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      id={passwordId}
                      className="field field-with-icon !h-10 !rounded-[0.85rem] !py-0 pr-11 text-[15px]"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-[var(--surface-muted)] hover:text-heading"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="rounded-[0.75rem] bg-[var(--danger-soft)] px-3 py-2 text-[13px] text-danger"
                  >
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary h-10 w-full !rounded-[0.85rem] !text-sm disabled:cursor-wait"
                >
                  {loading && !activeDemo ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Log In
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {showDemos ? (
                <div className="mt-3 border-t border-[var(--line)] pt-3 sm:mt-4 sm:pt-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                    Quick demo
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {demos.map((d) => (
                      <button
                        key={d.role}
                        type="button"
                        disabled={loading}
                        onClick={() => void loginWith(d.email, d.password, d.role)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] font-semibold transition",
                          "disabled:cursor-wait disabled:opacity-60",
                          activeDemo === d.role
                            ? "border-primary bg-[var(--primary-soft)] text-primary"
                            : "border-[var(--line)] bg-[#f8fafc] text-heading hover:border-primary/35 hover:bg-[var(--primary-soft)]",
                        )}
                      >
                        {activeDemo === d.role ? (
                          <LoaderCircle className="h-3 w-3 animate-spin" />
                        ) : null}
                        {d.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-2 flex shrink-0 items-center justify-between gap-2 pt-1 text-[12px] text-muted sm:mt-3">
              <Link href="/" className="font-semibold hover:text-primary">
                ← Website
              </Link>
              <Link href="/book" className="font-semibold text-primary hover:underline">
                Book a nurse
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
