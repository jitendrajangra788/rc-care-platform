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
    area?: string;
    shift?: string;
  };

  if (!body.name || !body.phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  const message =
    body.message?.trim() ||
    `Callback request · ${body.careType || "Home care"}${body.shift ? ` · ${body.shift}` : ""}${
      body.area ? ` · Area: ${body.area}` : ""
    }`;

  const db = await readDb();
  const lead = {
    id: `L-${String(db.leads.length + 1).padStart(2, "0")}`,
    name: body.name.trim(),
    phone: body.phone.trim(),
    email: body.email?.trim(),
    careType: body.careType || "General enquiry",
    message,
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