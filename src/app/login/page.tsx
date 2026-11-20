"use client";

import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { CalendarClock, Eye, EyeOff, Globe, LoaderCircle, MapPinned, Plus, ShieldCheck, Users } from "lucide-react";
import { toast } from "@/components/ui/toast";

const REMEMBER_KEY = "rc-login-id";

function identifierLooksValid(value: string) {
  const v = value.trim();
  if (!v) return false;
  if (v.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const digits = v.replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return local.length === 10 && /^[6-9]/.test(local);
}

export default function LoginPage() {
  const emailId = useId();
  const passwordId = useId();
  const busy = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function loginWith(nextEmail: string, nextPassword: string) {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");

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
        toast.error("Login failed", data.error || "Check mobile / password");
        busy.current = false;
        setLoading(false);
        return;
      }

      toast.success("Welcome back", data.user?.name || "Signed in");
      try {
        if (remember) window.localStorage.setItem(REMEMBER_KEY, nextEmail);
        else window.localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* private mode */
      }
      const dest = String(data.redirectTo || "/dashboard");
      window.location.assign(dest);
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      setError(aborted ? "Login timed out. Try again." : "Network error. Please try again.");
      toast.error(aborted ? "Timed out" : "Network error", "Please try again");
      busy.current = false;
      setLoading(false);
    } finally {
      window.clearTimeout(timer);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const id = email.trim();
    if (!identifierLooksValid(id)) {
      setError("Enter a 10-digit mobile number. Desk accounts can still use email.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    void loginWith(id, password);
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-[#f4f7fb] lg:grid lg:h-auto lg:min-h-dvh lg:grid-cols-2 lg:overflow-visible">
      <Link
        href="/"
        className="absolute right-3 top-3 z-30 inline-flex items-center gap-2 rounded-full border border-[#e4ebf2] bg-[#f7fafc] px-3.5 py-2 text-sm font-medium text-[#172d3a] shadow-sm sm:right-5 sm:top-5"
      >
        <Globe className="h-4 w-4 text-[#5f6b7a]" />
        Website
      </Link>
      <aside className="relative hidden overflow-hidden bg-[#071a33] text-white lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-10">
        <div className="pointer-events-none absolute -left-24 top-[-8%] h-72 w-72 rounded-full bg-[#12325d]/80" />
        <div className="pointer-events-none absolute -right-16 top-[18%] h-80 w-80 rounded-full bg-[#0c2748]" />
        <div className="pointer-events-none absolute bottom-[-12%] left-[18%] h-96 w-96 rounded-full bg-[#0d2c52]" />

        <div className="relative z-10 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#1d6fb8]">
            <Plus className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <span className="text-xl font-semibold tracking-tight">Roshan Care</span>
        </div>

        <div className="relative z-10 max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#12345c] px-3 py-1 text-xs font-medium text-[#d6e4f5]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7eb6ee]" />
            Home healthcare platform
          </span>
          <h2 className="mt-6 text-4xl font-semibold leading-[1.15] tracking-tight xl:text-5xl">
            Modern Home
            <br />
            Care Management
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#b7c6d9]">
            Duties, attendance, and family updates in one place — Morning, Night, and Visit.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-[#d5e2f0]">
            <li className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#12345c]">
                <Users className="h-4 w-4 text-[#8eb7e8]" />
              </span>
              Assigned duties and care notes
            </li>
            <li className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#12345c]">
                <CalendarClock className="h-4 w-4 text-[#8eb7e8]" />
              </span>
              Morning, Night, and Visit shifts
            </li>
            <li className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#12345c]">
                <MapPinned className="h-4 w-4 text-[#8eb7e8]" />
              </span>
              Care-site GPS attendance
            </li>
            <li className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#12345c]">
                <ShieldCheck className="h-4 w-4 text-[#8eb7e8]" />
              </span>
              Staff see only their own duty
            </li>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-[#8ea3bb]">© 2026 Roshan Care · Bhilwara</p>
      </aside>

      <section className="flex h-full items-center justify-center overflow-hidden px-4 py-3 sm:px-8 lg:h-auto lg:min-h-dvh lg:py-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-3 flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#1d6fb8] text-white">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold text-[#12263f]">Roshan Care</span>
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-[#12263f] sm:text-[1.65rem]">
            {forgot ? "Reset access" : "Welcome back"}
          </h1>
          <p className="mt-0.5 text-xs text-[#8b97a8] sm:text-sm">
            {forgot
              ? "The care desk verifies your account before a password is changed."
              : "Sign in to your Roshan Care account"}
          </p>

          <div className="mt-3 rounded-2xl border border-[#e6ebf2] bg-white p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:mt-6 sm:p-5">
            {forgot ? (
              <div className="space-y-3">
                <a
                  href="tel:+917073231360"
                  className="flex h-11 w-full items-center justify-center rounded-lg bg-[#1d6fb8] text-sm font-semibold text-white"
                >
                  Call 70732 31360
                </a>
                <button
                  type="button"
                  className="h-11 w-full rounded-lg border border-[#e6ebf2] text-sm font-semibold text-[#12263f]"
                  onClick={() => setForgot(false)}
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-2.5 sm:space-y-4" autoComplete="off">
                <label className="block text-sm font-medium text-[#344054]" htmlFor={emailId}>
                  Mobile or email
                  <input
                    id={emailId}
                    name="rc-login-id"
                    className="mt-1 h-10 w-full rounded-lg border border-[#e4e9f0] bg-white px-3 text-[15px] text-[#12263f] outline-none placeholder:text-[#b0b8c4] focus:border-[#1d6fb8] focus:ring-2 focus:ring-[#1d6fb8]/20 sm:mt-1.5 sm:h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Mobile number or email"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-[#344054]" htmlFor={passwordId}>
                  Password
                  <span className="relative mt-1 block sm:mt-1.5">
                    <input
                      id={passwordId}
                      name="rc-login-secret"
                      className="h-10 w-full rounded-lg border border-[#e4e9f0] bg-white px-3 pr-11 text-[15px] text-[#12263f] outline-none placeholder:text-[#b0b8c4] focus:border-[#1d6fb8] focus:ring-2 focus:ring-[#1d6fb8]/20 sm:h-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-[#98a2b3] hover:bg-[#f4f7fb]"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>

                <div className="flex items-center justify-between text-[13px]">
                  <label className="flex items-center gap-2 text-[#344054]">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#1d6fb8]"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgot(true)}
                    className="font-medium text-[#1d6fb8]"
                  >
                    Forgot password?
                  </button>
                </div>

                {error ? (
                  <p role="alert" className="rounded-lg bg-[#fde8e8] px-3 py-2 text-[13px] text-[#b42318]">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1d6fb8] text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
                >
                  {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Sign in
                </button>
              </form>
            )}

            <p className="mt-3 border-t border-[#eef2f6] pt-3 text-center text-sm text-[#667085] sm:mt-4 sm:pt-4">
              Don&apos;t have an account?{" "}
              <Link href="/careers/apply" className="font-semibold text-[#1d6fb8]">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
