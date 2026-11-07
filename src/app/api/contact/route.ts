import { NextResponse } from "next/server";
import { pushActivity } from "@/lib/activity";
import { readDb, writeDb } from "@/lib/db";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name?: string;
    phone?: string;
    email?: string;
    careType?: string;
    message?: string;
  };

  if (!body.name || !body.phone || !body.message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = await readDb();
  const lead = {
    id: `L-${String(db.leads.length + 1).padStart(2, "0")}`,
    name: body.name.trim(),
    phone: body.phone.trim(),
    email: body.email?.trim(),
    careType: body.careType || "General enquiry",
    message: body.message.trim(),
    status: "new" as const,
    createdAt: new Date().toISOString(),
  };
  db.leads.unshift(lead);
  pushActivity(db, {
    kind: "lead",
    title: `New enquiry · ${lead.name}`,
    detail: lead.careType,
    href: "/dashboard/admin/leads",
  });
  await writeDb(db);

  return NextResponse.json({ ok: true, lead });
}