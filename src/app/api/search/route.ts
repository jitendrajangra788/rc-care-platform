import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { isStaffOpsRole, normalizeRole } from "@/lib/permissions";
import {
  filterSearchHits,
  recordMatches,
  type SearchHit,
} from "@/lib/search";
import { bookingsForUser, patientIdsForUser, staffForUser } from "@/lib/scope";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const qRaw = new URL(req.url).searchParams.get("q") || "";
  const mode = new URL(req.url).searchParams.get("mode") || "query";

  const db = await readDb();
  const role = normalizeRole(session.role);
  const ops = isStaffOpsRole(role);
  const catalog: SearchHit[] = [];

  const allowedPatientIds = patientIdsForUser(db, session);
  const allowedBookings = bookingsForUser(db, session);

  for (const p of db.patients || []) {
    if (!ops && !allowedPatientIds.has(p.id)) continue;
    const href = ops
      ? `/dashboard/admin/patients/${p.id}`
      : role === "nurse"
        ? `/dashboard/nurse/patients/${p.id}`
        : role === "patient"
          ? `/dashboard/patient`
          : `/dashboard/family`;
    catalog.push({
      id: p.id,
      type: "patient",
      title: p.name,
      subtitle: [p.id, p.phone, p.area || p.address].filter(Boolean).join(" · "),
      href,
      keywords: [p.name, p.phone, p.id, p.address, p.area, p.notes, p.gender]
        .filter(Boolean)
        .join(" "),
    });
  }

  for (const b of allowedBookings) {
    const href = ops
      ? `/dashboard/admin/bookings?q=${encodeURIComponent(b.id)}`
      : role === "nurse"
        ? `/dashboard/nurse/duties`
        : role === "patient"
          ? `/dashboard/patient/appointments`
          : `/dashboard/family`;
    catalog.push({
      id: b.id,
      type: "booking",
      title: `${b.id} · ${b.patientName}`,
      subtitle: [b.careType, b.shift, b.status, b.phone, b.area || b.address]
        .filter(Boolean)
        .join(" · "),
      href,
      keywords: [
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
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  if (ops) {
    for (const s of db.staff || []) {
      catalog.push({
        id: s.id,
        type: "staff",
        title: s.name,
        subtitle: [s.role, s.status, s.phone, s.email].filter(Boolean).join(" · "),
        href: `/dashboard/admin/staff?q=${encodeURIComponent(s.name)}`,
        keywords: [s.name, s.phone, s.email, s.role, s.id, s.area, s.skills?.join(" ")]
          .filter(Boolean)
          .join(" "),
      });
    }

    for (const lead of db.leads || []) {
      catalog.push({
        id: lead.id,
        type: "lead",
        title: lead.name,
        subtitle: [lead.phone, lead.careType, lead.status].filter(Boolean).join(" · "),
        href: `/dashboard/admin/leads?q=${encodeURIComponent(lead.name)}`,
        keywords: [lead.name, lead.phone, lead.careType, lead.id, lead.message, lead.status]
          .filter(Boolean)
          .join(" "),
      });
    }

    for (const inv of db.invoices || []) {
      catalog.push({
        id: inv.id,
        type: "invoice",
        title: `${inv.id} · ${inv.patientName}`,
        subtitle: [`₹${inv.amount}`, inv.status, inv.bookingId].filter(Boolean).join(" · "),
        href: `/dashboard/admin/billing?q=${encodeURIComponent(inv.id)}`,
        keywords: [inv.id, inv.patientName, inv.bookingId, inv.status, String(inv.amount)].join(
          " ",
        ),
      });
    }
  } else if (role === "nurse") {
    const me = staffForUser(db, session);
    if (me) {
      catalog.push({
        id: me.id,
        type: "staff",
        title: me.name,
        subtitle: [me.role, me.phone].filter(Boolean).join(" · "),
        href: `/dashboard/nurse/profile`,
        keywords: [me.name, me.phone, me.id, me.email].filter(Boolean).join(" "),
      });
    }
  }

  // Full catalog for client-side typeahead (website-style instant filter)
  if (mode === "index") {
    return NextResponse.json({ results: catalog, total: catalog.length });
  }

  const q = qRaw.trim();
  if (!q) return NextResponse.json({ results: [] as SearchHit[] });

  // Server-side filter uses same matcher as list pages / client
  const filtered = filterSearchHits(
    catalog.filter((hit) =>
      recordMatches(q, hit.title, hit.subtitle, hit.keywords, hit.id),
    ),
    q,
    40,
  );

  return NextResponse.json({ results: filtered, q: qRaw, total: catalog.length });
}
