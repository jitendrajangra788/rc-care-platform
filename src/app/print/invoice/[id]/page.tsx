import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { defaultSettings } from "@/lib/defaults";
import { readDb } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { isStaffOpsRole, normalizeRole } from "@/lib/permissions";
import { bookingsForUser } from "@/lib/scope";
import { InvoicePrint } from "@/components/billing/InvoicePrint";

function paramFlag(
  value: string | string[] | undefined,
): boolean {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "1" || v === "true";
}

function paramString(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export default async function InvoicePrintSheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { id } = await Promise.resolve(params);
  const sp = await Promise.resolve(searchParams || {});
  const auto = paramFlag(sp.auto);
  const db = await readDb();
  const invoice = db.invoices.find((i) => i.id === id);
  if (!invoice) notFound();

  const role = normalizeRole(user.role);
  const ops = isStaffOpsRole(role);
  if (!ops) {
    const allowed = new Set(bookingsForUser(db, user).map((b) => b.id));
    if (!allowed.has(invoice.bookingId)) notFound();
  }

  const defaultBack = ops ? "/dashboard/admin/billing" : "/dashboard/family/billing";
  const backRaw = paramString(sp.back);
  const backHref =
    backRaw && backRaw.startsWith("/dashboard/") ? backRaw : defaultBack;

  const settings = { ...defaultSettings, ...(db.settings || {}) };
  const booking = db.bookings.find((b) => b.id === invoice.bookingId);
  const payments = (db.payments || [])
    .filter((p) => p.invoiceId === invoice.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((p) => ({
      amount: p.amount,
      method: p.method,
      createdAt: p.createdAt,
      note: p.note,
    }));

  const period = booking?.startDate
    ? `${formatDate(booking.startDate)}${booking.endDate ? ` → ${formatDate(booking.endDate)}` : " → Ongoing"}`
    : undefined;

  return (
    <InvoicePrint
      autoPrint={auto}
      backHref={backHref}
      brand={{
        orgName: settings.orgName,
        supportPhone: settings.supportPhone,
        supportEmail: settings.supportEmail,
        city: settings.city,
        address: settings.address,
        adminName: settings.adminName,
        logoUrl: settings.logoUrl,
        gstin: settings.gstin,
        invoiceTagline: settings.invoiceTagline,
        upiId: settings.upiId,
      }}
      invoice={{
        id: invoice.id,
        patientName: invoice.patientName,
        bookingId: invoice.bookingId,
        amount: invoice.amount,
        paid: invoice.paid,
        status: invoice.status,
        dueDate: invoice.dueDate,
        careType: booking?.careType,
        shift: booking?.shift,
        address: booking?.address,
        phone: booking?.phone,
        area: booking?.area,
        period,
        payments,
      }}
    />
  );
}
