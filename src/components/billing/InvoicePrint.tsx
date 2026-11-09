"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export type InvoicePrintData = {
  id: string;
  patientName: string;
  bookingId: string;
  amount: number;
  paid: number;
  status: string;
  dueDate: string;
  careType?: string;
  shift?: string;
  address?: string;
  phone?: string;
  area?: string;
  period?: string;
  payments?: { amount: number; method: string; createdAt: string; note?: string }[];
};

export type InvoiceOrgBrand = {
  orgName: string;
  supportPhone?: string;
  supportEmail?: string;
  city?: string;
  address?: string;
  adminName?: string;
  logoUrl?: string;
  gstin?: string;
  invoiceTagline?: string;
  upiId?: string;
};

export function InvoicePrint({
  brand,
  invoice,
  backHref,
  autoPrint = false,
}: {
  brand: InvoiceOrgBrand;
  invoice: InvoicePrintData;
  backHref: string;
  autoPrint?: boolean;
}) {
  const router = useRouter();
  const printedRef = useRef(false);
  const balance = Math.max(0, invoice.amount - invoice.paid);
  const printedAt = new Date().toLocaleString("en-IN");
  const org = brand.orgName || "Roshan Care";

  useEffect(() => {
    if (!autoPrint || printedRef.current) return;
    printedRef.current = true;

    const goBack = () => router.replace(backHref);
    const timer = window.setTimeout(() => window.print(), 450);
    const onAfterPrint = () => goBack();
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [autoPrint, backHref, router]);

  return (
    <div className="rc-print-root min-h-screen bg-[#eef2f6] px-3 py-4">
      <div className="rc-no-print mx-auto mb-3 flex max-w-[760px] flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => router.push(backHref)}>
          ← Back to billing
        </button>
        <Button type="button" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      <article className="rc-print-sheet mx-auto max-w-[760px] overflow-hidden rounded-[1.1rem] border border-[var(--line)] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        {/* Brand header */}
        <header className="bg-[linear-gradient(115deg,#087F8C_0%,#0d5f59_70%,#0b1f33_100%)] px-5 py-5 text-white sm:px-7 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[0.9rem] bg-white ring-1 ring-white/40">
                {brand.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logoUrl}
                    alt={org}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <span className="font-display text-xl font-semibold text-[var(--primary-deep)]">
                    {org.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-display text-2xl leading-none tracking-[-0.03em] sm:text-[1.75rem]">
                  {org}
                </p>
                <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-100/85">
                  {brand.invoiceTagline || "Trusted Home Healthcare"}
                </p>
                <p className="mt-1 text-xs text-white/75">
                  {[brand.address, brand.city].filter(Boolean).join(" · ") || "Home nursing care"}
                </p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                Tax Invoice
              </p>
              <p className="mt-1 font-display text-xl text-white">{invoice.id}</p>
              <p className="mt-1 text-white/80">Due {formatDate(invoice.dueDate)}</p>
              <p className="mt-2 inline-flex rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                {invoice.status}
              </p>
            </div>
          </div>
        </header>

        <div className="px-5 py-5 sm:px-7 sm:py-6">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-[0.85rem] border border-[var(--line)] bg-[#f8fafc] p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Bill to</p>
              <p className="font-display mt-1 text-lg text-heading">{invoice.patientName}</p>
              {invoice.phone ? <p className="text-muted">{formatPhone(invoice.phone)}</p> : null}
              {invoice.address ? <p className="mt-1 text-muted">{invoice.address}</p> : null}
              {invoice.area ? <p className="text-muted">{invoice.area}</p> : null}
            </div>
            <div className="rounded-[0.85rem] border border-[var(--line)] bg-[#f8fafc] p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                From · Care desk
              </p>
              <p className="mt-1 font-semibold text-heading">
                {brand.adminName || org}
              </p>
              {brand.supportPhone ? (
                <p className="text-muted">{formatPhone(brand.supportPhone)}</p>
              ) : null}
              {brand.supportEmail ? <p className="text-muted">{brand.supportEmail}</p> : null}
              {brand.gstin ? (
                <p className="mt-1 text-xs font-medium text-heading">GSTIN: {brand.gstin}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-[0.85rem] border border-[var(--line)] px-3.5 py-3 text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Care booking
            </p>
            <p className="mt-1 font-semibold text-heading">{invoice.bookingId}</p>
            <p className="text-muted">
              {[invoice.careType, invoice.shift ? `${invoice.shift} shift` : null, invoice.period]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <table className="mt-5 w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="py-2.5 font-semibold">Description</th>
                <th className="py-2.5 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--line)]">
                <td className="py-3.5">
                  <p className="font-semibold text-heading">
                    Home nursing care
                    {invoice.careType ? ` — ${invoice.careType}` : ""}
                  </p>
                  <p className="text-xs text-muted">
                    Booking {invoice.bookingId}
                    {invoice.shift ? ` · ${invoice.shift}` : ""}
                  </p>
                </td>
                <td className="py-3.5 text-right font-semibold tabular-nums text-heading">
                  {formatCurrency(invoice.amount)}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-muted">Amount paid</td>
                <td className="py-2 text-right tabular-nums text-success">
                  {formatCurrency(invoice.paid)}
                </td>
              </tr>
              <tr className="border-t-2 border-[var(--line)]">
                <td className="py-3.5 text-base font-semibold text-heading">Balance due</td>
                <td
                  className={`py-3.5 text-right text-xl font-semibold tabular-nums ${
                    balance > 0 ? "text-[#c2410c]" : "text-success"
                  }`}
                >
                  {formatCurrency(balance)}
                </td>
              </tr>
            </tbody>
          </table>

          {invoice.payments && invoice.payments.length > 0 ? (
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Payment history
              </p>
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] text-left text-[11px] text-muted">
                    <th className="py-1.5 font-semibold">Date</th>
                    <th className="py-1.5 font-semibold">Method</th>
                    <th className="py-1.5 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p, i) => (
                    <tr key={`${p.createdAt}-${i}`} className="border-b border-[var(--line)]">
                      <td className="py-1.5 text-muted">{formatDate(p.createdAt)}</td>
                      <td className="py-1.5 capitalize text-heading">{p.method}</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {brand.upiId && balance > 0 ? (
            <div className="mt-5 rounded-[0.85rem] border border-primary/20 bg-[var(--primary-soft)] px-3.5 py-3 text-sm">
              <p className="font-semibold text-heading">Pay via UPI</p>
              <p className="mt-0.5 font-mono text-primary">{brand.upiId}</p>
              <p className="mt-1 text-xs text-muted">
                Use invoice ID <strong>{invoice.id}</strong> in payment note.
              </p>
            </div>
          ) : null}

          <footer className="mt-7 border-t border-[var(--line)] pt-4 text-xs text-muted">
            <p>
              Printed {printedAt} · {org}
              {brand.adminName ? ` · ${brand.adminName}` : ""}
            </p>
            <p className="mt-1">
              System-generated invoice for home healthcare. Queries:{" "}
              {brand.supportPhone ? formatPhone(brand.supportPhone) : "care desk"}
              {brand.supportEmail ? ` · ${brand.supportEmail}` : ""}.
            </p>
          </footer>
        </div>
      </article>
    </div>
  );
}
