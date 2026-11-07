import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { isStaffOpsRole, normalizeRole } from "@/lib/permissions";
import type { SearchHit } from "@/lib/search";
import { bookingsForUser, patientIdsForUser, staffForUser } from "@/lib/scope";

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function matches(q: string, ...parts: Array<string | number | undefined | null>) {
  const hay = norm(parts.filter(Boolean).join(" "));
  if (!hay) return false;
  return q.split(" ").every((token) => hay.includes(token));
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const qRaw = new URL(req.url).searchParams.get("q") || "";
  const q = norm(qRaw);
  if (q.length < 1) {
    return NextResponse.json({ results: [] as SearchHit[] });
  }

  const db = await readDb();
  const role = normalizeRole(session.role);
  const ops = isStaffOpsRole(role);
  const results: SearchHit[] = [];

  const allowedPatientIds = patientIdsForUser(db, session);
  const allowedBookings = bookingsForUser(db, session);

  for (const p of db.patients || []) {
    if (!ops && !allowedPatientIds.has(p.id)) continue;
    if (
      !matches(
        q,
        p.id,
        p.name,
        p.phone,
        p.address,
        p.area,
        p.gender,
        p.age != null ? String(p.age) : "",
        p.notes,
      )
    ) {
      continue;
    }
    const href = ops
      ? `/dashboard/admin/patients/${p.id}`
      : role === "nurse"
        ? `/dashboard/nurse/patients/${p.id}`
        : role === "patient"
          ? `/dashboard/patient`
          : `/dashboard/family`;
    results.push({
      id: p.id,
      type: "patient",
      title: p.name,
      subtitle: [p.id, p.phone, p.area || p.address].filter(Boolean).join(" · "),
      href,
      keywords: [p.name, p.phone, p.id, p.address, p.area].filter(Boolean).join(" "),
    });
    if (results.length >= 40) break;
  }

  for (const b of allowedBookings) {
    if (
      !matches(
        q,
        b.id,
        b.patientName,
        b.phone,
        b.address,
        b.area,
        b.careType,
        b.status,
        b.shift,
        b.notes,
        b.guardianName,
      )
    ) {
      continue;
    }
    const href = ops
      ? `/dashboard/admin/bookings?q=${encodeURIComponent(b.id)}`
      : role === "nurse"
        ? `/dashboard/nurse/duties`
        : role === "patient"
          ? `/dashboard/patient/appointments`
          : `/dashboard/family`;
    results.push({
      id: b.id,
      type: "booking",
      title: `${b.id} · ${b.patientName}`,
      subtitle: [b.careType, b.shift, b.status, b.phone, b.area || b.address]
        .filter(Boolean)
        .join(" · "),
      href,
      keywords: [b.id, b.patientName, b.phone, b.address, b.careType, b.status].join(" "),
    });
    if (results.filter((r) => r.type === "booking").length >= 20) break;
  }

  if (ops) {
    for (const s of db.staff || []) {
      if (
        !matches(
          q,
          s.id,
          s.name,
          s.phone,
          s.email,
          s.role,
          s.status,
          s.skills?.join(" "),
          s.area,
        )
      ) {
        continue;
      }
      results.push({
        id: s.id,
        type: "staff",
        title: s.name,
        subtitle: [s.role, s.status, s.phone, s.email].filter(Boolean).join(" · "),
        href: `/dashboard/admin/staff?q=${encodeURIComponent(s.name)}`,
        keywords: [s.name, s.phone, s.email, s.role, s.id].filter(Boolean).join(" "),
      });
      if (results.filter((r) => r.type === "staff").length >= 15) break;
    }

    for (const lead of db.leads || []) {
      if (!matches(q, lead.id, lead.name, lead.phone, lead.careType, lead.status, lead.message)) {
        continue;
      }
      results.push({
        id: lead.id,
        type: "lead",
        title: lead.name,
        subtitle: [lead.phone, lead.careType, lead.status].filter(Boolean).join(" · "),
        href: `/dashboard/admin/leads?q=${encodeURIComponent(lead.name)}`,
        keywords: [lead.name, lead.phone, lead.careType, lead.id].filter(Boolean).join(" "),
      });
      if (results.filter((r) => r.type === "lead").length >= 10) break;
    }

    for (const inv of db.invoices || []) {
      if (!matches(q, inv.id, inv.bookingId, inv.patientName, inv.status, String(inv.amount))) {
        continue;
      }
      results.push({
        id: inv.id,
        type: "invoice",
        title: `${inv.id} · ${inv.patientName}`,
        subtitle: [`₹${inv.amount}`, inv.status, inv.bookingId].filter(Boolean).join(" · "),
        href: `/dashboard/admin/billing?q=${encodeURIComponent(inv.id)}`,
        keywords: [inv.id, inv.patientName, inv.bookingId, inv.status].join(" "),
      });
      if (results.filter((r) => r.type === "invoice").length >= 10) break;
    }
  } else if (role === "nurse") {
    const me = staffForUser(db, session);
    if (me && matches(q, me.id, me.name, me.phone, me.email, me.role)) {
      results.push({
        id: me.id,
        type: "staff",
        title: me.name,
        subtitle: [me.role, me.phone].filter(Boolean).join(" · "),
        href: `/dashboard/nurse/profile`,
        keywords: [me.name, me.phone, me.id].filter(Boolean).join(" "),
      });
    }
  }

  // Prefer exact booking-id / name hits first
  results.sort((a, b) => {
    const aExact = norm(a.title).startsWith(q) || norm(a.id) === q ? 0 : 1;
    const bExact = norm(b.title).startsWith(q) || norm(b.id) === q ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return a.type.localeCompare(b.type) || a.title.localeCompare(b.title);
  });

  return NextResponse.json({
    results: results.slice(0, 40),
    q: qRaw,
  });
}
