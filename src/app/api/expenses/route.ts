import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-guard";
import { pushAudit } from "@/lib/audit";
import { readDb, writeDb } from "@/lib/db";
import type { Expense } from "@/lib/types";
import { expenseSchema, parseBody } from "@/lib/validation";

export async function GET() {
  const auth = await requirePermission("expenses.read");
  if ("error" in auth) return auth.error;
  const db = await readDb();
  return NextResponse.json({ expenses: db.expenses || [], staff: db.staff });
}

export async function POST(req: Request) {
  const auth = await requirePermission("expenses.write");
  if ("error" in auth) return auth.error;
  const parsed = parseBody(expenseSchema, await req.json().catch(() => null));
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error || "Invalid" }, { status: 400 });
  }
  const db = await readDb();
  const row: Expense = {
    id: `exp-${Date.now()}`,
    category: parsed.data.category.trim(),
    amount: parsed.data.amount,
    date: parsed.data.date,
    note: parsed.data.note?.trim(),
    staffId: parsed.data.staffId,
    createdBy: auth.user.id,
    createdAt: new Date().toISOString(),
  };
  db.expenses = db.expenses || [];
  db.expenses.unshift(row);
  pushAudit(db, {
    action: "expense.create",
    entity: "expense",
    detail: `${row.category} · ₹${row.amount}`,
    actorId: auth.user.id,
    actorName: auth.user.name,
  });
  await writeDb(db);
  return NextResponse.json({ expense: row }, { status: 201 });
}
