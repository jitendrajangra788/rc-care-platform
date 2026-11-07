import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-guard";
import { pushAudit } from "@/lib/audit";
import { readDb, writeDb } from "@/lib/db";
import type { PaymentRecord } from "@/lib/types";
import { parseBody, paymentSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requirePermission("payments.read");
  if ("error" in auth) return auth.error;
  const db = await readDb();
  return NextResponse.json({
    payments: db.payments || [],
    invoices: db.invoices,
  });
}

export async function POST(req: Request) {
  const auth = await requirePermission("payments.write");
  if ("error" in auth) return auth.error;
  const parsed = parseBody(paymentSchema, await req.json().catch(() => null));
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error || "Invalid" }, { status: 400 });
  }
  const db = await readDb();
  const invIdx = db.invoices.findIndex((i) => i.id === parsed.data!.invoiceId);
  if (invIdx < 0) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const row: PaymentRecord = {
    id: `pay-${Date.now()}`,
    invoiceId: parsed.data.invoiceId,
    amount: parsed.data.amount,
    method: parsed.data.method || "upi",
    note: parsed.data.note?.trim(),
    recordedBy: auth.user.id,
    recordedByName: auth.user.name,
    createdAt: new Date().toISOString(),
  };
  db.payments = db.payments || [];
  db.payments.unshift(row);

  const inv = db.invoices[invIdx];
  const paid = Math.min(inv.amount, (inv.paid || 0) + row.amount);
  db.invoices[invIdx] = {
    ...inv,
    paid,
    status: paid <= 0 ? "unpaid" : paid >= inv.amount ? "paid" : "partial",
  };

  pushAudit(db, {
    action: "payment.record",
    entity: "payment",
    detail: `${row.invoiceId} · ₹${row.amount} · ${row.method}`,
    actorId: auth.user.id,
    actorName: auth.user.name,
  });
  await writeDb(db);
  return NextResponse.json({ payment: row, invoice: db.invoices[invIdx] }, { status: 201 });
}
