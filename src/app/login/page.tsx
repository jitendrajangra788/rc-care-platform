"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { toast } from "@/components/ui/toast";

// Show demo accounts unless explicitly disabled (helpful on Vercel preview/demo).
const showDemos = process.env.NEXT_PUBLIC_DEMO_LOGINS !== "false";

const demos = [
  {
    role: "Admin",
    title: "Care Desk",
    email: "admin@roshancare.in",
    password: "admin123",
    hint: "Bookings, staff, billing, leads",
  },
  {
    role: "Coordinator",
    title: "Care Coordinator",
    email: "coord@roshancare.in",
    password: "coord123",
    hint: "CRM, schedule, attendance",
  },
  {
    role: "Nurse",
    title: "Nurse Panel",
    email: "nurse@roshancare.in",
    password: "12345678",
    hint: "Duties, vitals, care notes",
  },
  {
    role: "Family",
    title: "Family Portal",
    email: "family@roshancare.in",
    password: "family123",
    hint: "Updates, invoices, care status",
  },
  {
    role: "Patient",
    title: "Patient Portal",
    email: "patient@roshancare.in",
    password: "patient123",
    hint: "Appointments and care history",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const busy = useRef(false);
  const [email, setEmail] = useState("admin@roshancare.in");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loginWith(nextEmail: string, nextPassword: string) {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    setEmail(nextEmail);
    setPassword(nextPassword);

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
        return;
      }
      toast.success("Login successful", `Welcome ${data.user?.name || ""}`.trim());
      router.replace(String(data.redirectTo || "/dashboard"));
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      setError(aborted ? "Login timed out. Try again." : "Network error. Please try again.");
      toast.error(aborted ? "Timed out" : "Network error", "Please try again");
    } finally {
      window.clearTimeout(timer);
      busy.current = false;
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void loginWith(email.trim(), password);
  }

  return (
    <div className="relative z-0 min-h-screen pb-[env(safe-area-inset-bottom)]">
      <SiteHeader />
      <div className="relative z-10 mx-auto grid max-w-6xl items-start gap-6 px-4 py-8 sm:px-5 sm:py-10 md:grid-cols-2 md:gap-10 md:px-8 md:py-16">
        <div className="order-2 md:order-1">
          <p className="text-label text-primary">Welcome back</p>
          <h1 className="font-display mt-3 text-[2rem] leading-tight tracking-[-0.03em] sm:text-4xl md:mt-4 md:text-6xl">
            Sign in to Roshan Care
          </h1>
          <p className="mt-3 max-w-md text-sm text-ink-soft sm:mt-4 sm:text-base">
            {showDemos
              ? "Choose a role below for one-click demo login, or sign in with email."
              : "Sign in with your Roshan Care email and password."}
          </p>
          {showDemos ? (
            <div className="mt-5 grid gap-2 sm:mt-8 sm:gap-3">
              {demos.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  disabled={loading}
                  onClick={() => void loginWith(d.email, d.password)}
                  className="soft-panel relative z-10 block w-full cursor-pointer rounded-2xl px-3.5 py-3.5 text-left transition hover:bg-white active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 sm:px-4 sm:py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-primary">{d.title}</span>
                      <span className="mt-1 block text-xs text-ink-soft">{d.hint}</span>
                      <span className="mt-1 block truncate text-[11px] text-ink-soft/80">
                        {d.email}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-heading">{d.role}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <form
          onSubmit={onSubmit}
          className="soft-panel relative z-10 order-1 rounded-[var(--radius-2xl)] p-4 sm:p-6 md:order-2 md:p-8"
        >
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Email</span>
            <input
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="username"
              required
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="mb-1 block text-muted">Password</span>
            <input
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-6 w-full cursor-pointer disabled:cursor-wait"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <p className="mt-4 text-center text-xs text-muted">
            <Link href="/" className="text-primary">
              Back to home
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
