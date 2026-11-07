import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pushActivity } from "@/lib/activity";
import { readDb, writeDb } from "@/lib/db";
import type { CareLocation, SiteAllotment } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await readDb();
  return NextResponse.json({
    locations: db.careLocations || [],
    allotments: db.siteAllotments || [],
    staff: db.staff.map((s) => ({ id: s.id, name: s.name, role: s.role, status: s.status })),
    bookings: db.bookings.map((b) => ({
      id: b.id,
      patientName: b.patientName,
      address: b.address,
      status: b.status,
      assignedStaffId: b.assignedStaffId,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
  if (!session || !isStaffOpsRole(normalizeRole(session.role))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const action = String(body.action || "location");

  const db = await readDb();
  if (!db.careLocations) db.careLocations = [];
  if (!db.siteAllotments) db.siteAllotments = [];

  if (action === "allot") {
    const locationId = String(body.locationId || "");
    const staffId = String(body.staffId || "");
    const shift = String(body.shift || "Day") as SiteAllotment["shift"];
    const startDate = String(body.startDate || new Date().toISOString().slice(0, 10));
    const bookingId = body.bookingId ? String(body.bookingId) : undefined;
    const endDate = body.endDate ? String(body.endDate) : undefined;

    if (!locationId || !staffId) {
      return NextResponse.json({ error: "locationId and staffId required" }, { status: 400 });
    }
    const loc = db.careLocations.find((l) => l.id === locationId);
    const staff = db.staff.find((s) => s.id === staffId);
    if (!loc || !staff) {
      return NextResponse.json({ error: "Location or staff not found" }, { status: 404 });
    }

    const allot: SiteAllotment = {
      id: `allot-${Date.now()}`,
      locationId,
      staffId,
      bookingId,
      shift,
      startDate,
      endDate,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    db.siteAllotments.unshift(allot);

    if (bookingId) {
      const bi = db.bookings.findIndex((b) => b.id === bookingId);
      if (bi >= 0) {
        db.bookings[bi] = {
          ...db.bookings[bi],
          assignedStaffId: staffId,
          status:
            db.bookings[bi].status === "pending" ? "assigned" : db.bookings[bi].status,
          lat: loc.lat,
          lng: loc.lng,
          geofenceRadiusM: loc.geofenceRadiusM || db.bookings[bi].geofenceRadiusM || 250,
        };
      }
    }

    staff.status = "on-duty";
    pushActivity(db, {
      kind: "staff",
      title: `Site allotted · ${staff.name}`,
      detail: `${loc.locationName} · ${shift}`,
      href: "/dashboard/admin/locations",
      actorId: session.id,
      actorName: session.name,
    });
    await writeDb(db);
    return NextResponse.json({ allotment: allot });
  }

  const locationName = String(body.locationName || "").trim();
  const address = String(body.address || "").trim();
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!locationName || !address || Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      { error: "locationName, address, lat, lng required" },
      { status: 400 },
    );
  }

  const loc: CareLocation = {
    id: `loc-${Date.now()}`,
    locationName,
    address,
    city: body.city ? String(body.city) : "Bhilwara",
    lat,
    lng,
    geofenceRadiusM: body.geofenceRadiusM ? Number(body.geofenceRadiusM) : 250,
    notes: body.notes ? String(body.notes) : undefined,
    createdAt: new Date().toISOString(),
  };
  db.careLocations.unshift(loc);
  pushActivity(db, {
    kind: "system",
    title: `Location added · ${loc.locationName}`,
    detail: loc.address,
    href: "/dashboard/admin/locations",
    actorId: session.id,
    actorName: session.name,
  });
  await writeDb(db);
  return NextResponse.json({ location: loc });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  {
    const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
    if (!session || !isStaffOpsRole(normalizeRole(session.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = (await req.json()) as Record<string, unknown>;
  const db = await readDb();

  if (body.resource === "allotment") {
    const id = String(body.id || "");
    const idx = (db.siteAllotments || []).findIndex((a) => a.id === id);
    if (idx < 0) return NextResponse.json({ error: "Allotment not found" }, { status: 404 });
    if (body.status) {
      db.siteAllotments[idx] = {
        ...db.siteAllotments[idx],
        status: body.status as SiteAllotment["status"],
      };
    }
    await writeDb(db);
    return NextResponse.json({ allotment: db.siteAllotments[idx] });
  }

  const id = String(body.id || "");
  const idx = (db.careLocations || []).findIndex((l) => l.id === id);
  if (idx < 0) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  const cur = db.careLocations[idx];
  db.careLocations[idx] = {
    ...cur,
    locationName: body.locationName ? String(body.locationName) : cur.locationName,
    address: body.address ? String(body.address) : cur.address,
    city: body.city != null ? String(body.city) : cur.city,
    lat: body.lat != null ? Number(body.lat) : cur.lat,
    lng: body.lng != null ? Number(body.lng) : cur.lng,
    geofenceRadiusM:
      body.geofenceRadiusM != null ? Number(body.geofenceRadiusM) : cur.geofenceRadiusM,
    notes: body.notes != null ? String(body.notes) : cur.notes,
  };
  await writeDb(db);
  return NextResponse.json({ location: db.careLocations[idx] });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  {
    const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
    if (!session || !isStaffOpsRole(normalizeRole(session.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = await readDb();
  db.careLocations = (db.careLocations || []).filter((l) => l.id !== id);
  db.siteAllotments = (db.siteAllotments || []).filter((a) => a.locationId !== id);
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
