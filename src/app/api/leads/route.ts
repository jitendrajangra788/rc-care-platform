import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pushActivity } from "@/lib/activity";
import { pushAudit } from "@/lib/audit";
import { readDb, writeDb } from "@/lib/db";
import type { Lead, Patient } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  {
    const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
    if (!session || !isStaffOpsRole(normalizeRole(session.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  const db = await readDb();
  return NextResponse.json({ leads: db.leads });
}

export async function POST(req: Request) {
  const session = await getSession();
  {
    const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
    if (!session || !isStaffOpsRole(normalizeRole(session.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = (await req.json().catch(() => null)) as {
    action?: "create" | "convert";
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    careType?: string;
    message?: string;
  } | null;

  if (!body?.action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  const db = await readDb();

  if (body.action === "create") {
    if (!body.name?.trim() || !body.phone?.trim()) {
      return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
    }
    const lead: Lead = {
      id: `L-${String(db.leads.length + 1).padStart(2, "0")}-${Date.now().toString().slice(-4)}`,
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim() || undefined,
      careType: body.careType?.trim() || "Elderly Care",
      message: body.message?.trim() || "Desk enquiry",
      status: "new",
      createdAt: new Date().toISOString(),
    };
    db.leads.unshift(lead);
    pushActivity(db, {
      kind: "lead",
      title: `Lead captured · ${lead.name}`,
      detail: lead.phone,
      href: "/dashboard/admin/leads",
      actorId: session.id,
      actorName: session.name,
    });
    await writeDb(db);
    return NextResponse.json({ lead }, { status: 201 });
  }

  if (body.action === "convert") {
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const idx = db.leads.findIndex((l) => l.id === body.id);
    if (idx < 0) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    const lead = db.leads[idx];
    db.patients = db.patients || [];
    const phoneKey = lead.phone.replace(/\s/g, "");
    let patient =
      db.patients.find((p) => p.phone.replace(/\s/g, "") === phoneKey) ||
      db.patients.find((p) => p.name.toLowerCase() === lead.name.toLowerCase());

    if (!patient) {
      patient = {
        id: `pat-${Date.now()}`,
        name: lead.name,
        phone: lead.phone,
        area: "Bhilwara",
        notes: [lead.careType, lead.message].filter(Boolean).join(" · "),
        familyUserIds: [],
        status: "active",
        createdAt: new Date().toISOString(),
      } satisfies Patient;
      db.patients.unshift(patient);
      pushAudit(db, {
        action: "patient.create",
        entity: "patient",
        detail: `${patient.id} · from lead ${lead.id}`,
        actorId: session.id,
        actorName: session.name,
      });
    }

    db.leads[idx] = { ...lead, status: "converted" };
    pushActivity(db, {
      kind: "lead",
      title: `Lead converted · ${lead.name}`,
      detail: `Patient ${patient.id}`,
      href: `/dashboard/admin/patients/${patient.id}`,
      actorId: session.id,
      actorName: session.name,
    });
    await writeDb(db);
    return NextResponse.json({ lead: db.leads[idx], patient });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  {
    const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
    if (!session || !isStaffOpsRole(normalizeRole(session.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = (await req.json()) as { id?: string; status?: Lead["status"] };
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }
  if (!["new", "contacted", "converted"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = await readDb();
  const idx = db.leads.findIndex((l) => l.id === body.id);
  if (idx < 0) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  db.leads[idx] = { ...db.leads[idx], status: body.status };
  pushActivity(db, {
    kind: "lead",
    title: `Lead ${db.leads[idx].name} → ${body.status}`,
    detail: db.leads[idx].phone,
    href: "/dashboard/admin/leads",
    actorId: session.id,
    actorName: session.name,
  });
  await writeDb(db);
  return NextResponse.json({ lead: db.leads[idx] });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  {
    const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
    if (!session || !isStaffOpsRole(normalizeRole(session.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = await readDb();
  const lead = db.leads.find((l) => l.id === id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.leads = db.leads.filter((l) => l.id !== id);
  pushActivity(db, {
    kind: "lead",
    title: `Lead removed · ${lead.name}`,
    href: "/dashboard/admin/leads",
    actorId: session.id,
    actorName: session.name,
  });
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
