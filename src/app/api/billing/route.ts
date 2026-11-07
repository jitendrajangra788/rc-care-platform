import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pushActivity } from "@/lib/activity";
import { readDb, writeDb } from "@/lib/db";
import type { Invoice, PaymentRecord } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await readDb();
  const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
  if (isStaffOpsRole(normalizeRole(session.role))) return NextResponse.json({ invoices: db.invoices });
  if (session.role === "family" || session.role === "patient") {
    const myBookingIds = new Set(
      db.bookings.filter((b) => b.familyUserId === session.id).map((b) => b.id),
    );
    return NextResponse.json({
      invoices: db.invoices.filter((i) => myBookingIds.has(i.bookingId)),
    });
  }
  return NextResponse.json({ invoices: [] });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
  if (!session || !isStaffOpsRole(normalizeRole(session.role))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    id?: string;
    paid?: number;
    markPaid?: boolean;
    amount?: number;
    collectAmount?: number;
    method?: PaymentRecord["method"];
    note?: string;
  };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = await readDb();
  const idx = db.invoices.findIndex((i) => i.id === body.id);
  if (idx < 0) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const current = db.invoices[idx];
  let paid = current.paid;
  let payment: PaymentRecord | undefined;

  if (typeof body.collectAmount === "number" && body.collectAmount > 0) {
    const add = Math.min(body.collectAmount, current.amount - current.paid);
    if (add <= 0) {
      return NextResponse.json({ error: "Invoice already settled" }, { status: 400 });
    }
    paid = current.paid + add;
    payment = {
      id: `pay-${Date.now()}`,
      invoiceId: current.id,
      amount: add,
      method: body.method || "upi",
      note: body.note?.trim() || "Collected from billing desk",
      recordedBy: session.id,
      recordedByName: session.name,
      createdAt: new Date().toISOString(),
    };
    db.payments = db.payments || [];
    db.payments.unshift(payment);
  } else if (body.markPaid) {
    const remaining = Math.max(0, current.amount - current.paid);
    if (remaining > 0) {
      payment = {
        id: `pay-${Date.now()}`,
        invoiceId: current.id,
        amount: remaining,
        method: body.method || "upi",
        note: body.note?.trim() || "Marked paid from billing desk",
        recordedBy: session.id,
        recordedByName: session.name,
        createdAt: new Date().toISOString(),
      };
      db.payments = db.payments || [];
      db.payments.unshift(payment);
    }
    paid = current.amount;
  } else if (typeof body.paid === "number") {
    paid = Math.max(0, Math.min(body.paid, current.amount));
  }

  const amount = typeof body.amount === "number" ? body.amount : current.amount;
  let status: Invoice["status"] = "unpaid";
  if (paid <= 0) status = "unpaid";
  else if (paid >= amount) status = "paid";
  else status = "partial";

  db.invoices[idx] = { ...current, amount, paid, status };
  pushActivity(db, {
    kind: "billing",
    title: `Invoice ${current.id} · ${status}`,
    detail: `${current.patientName} · paid ₹${paid}${payment ? ` · +₹${payment.amount}` : ""}`,
    href: "/dashboard/admin/billing",
    actorId: session.id,
    actorName: session.name,
  });
  await writeDb(db);
  return NextResponse.json({ invoice: db.invoices[idx], payment });
}

export async function POST(req: Request) {
  const session = await getSession();
  {
    const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
    if (!session || !isStaffOpsRole(normalizeRole(session.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = (await req.json()) as {
    bookingId?: string;
    amount?: number;
    dueDate?: string;
  };
  if (!body.bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }

  const db = await readDb();
  const booking = db.bookings.find((b) => b.id === body.bookingId);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (db.invoices.some((i) => i.bookingId === booking.id)) {
    return NextResponse.json({ error: "Invoice already exists for this booking" }, { status: 409 });
  }

  const amount = typeof body.amount === "number" ? body.amount : booking.amount;
  const invoice: Invoice = {
    id: `INV-${String(db.invoices.length + 101).padStart(3, "0")}`,
    bookingId: booking.id,
    patientName: booking.patientName,
    amount,
    paid: 0,
    status: "unpaid",
    dueDate: body.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  };
  db.invoices.unshift(invoice);
  pushActivity(db, {
    kind: "billing",
    title: `Invoice created · ${invoice.id}`,
    detail: booking.patientName,
    href: "/dashboard/admin/billing",
    actorId: session.id,
    actorName: session.name,
  });
  await writeDb(db);
  return NextResponse.json({ invoice }, { status: 201 });
}
