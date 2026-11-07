import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pushActivity } from "@/lib/activity";
import { pushAudit } from "@/lib/audit";
import { readDb, writeDb } from "@/lib/db";
import {
  defaultShiftTimes,
  findAssignmentConflicts,
  validateBookingDates,
  validateShiftTimes,
} from "@/lib/schedule";
import type { Booking, Invoice, Patient, SiteAllotment } from "@/lib/types";

/** Link booking to CRM patient — reuse by id/phone or create. */
function resolveOrCreatePatient(
  db: Awaited<ReturnType<typeof readDb>>,
  input: {
    patientId?: string;
    patientName: string;
    phone: string;
    patientAge?: number;
    gender?: Booking["gender"];
    address?: string;
    area?: string;
    notes?: string;
    familyUserId?: string;
  },
): string | undefined {
  db.patients = db.patients || [];
  const byId = input.patientId
    ? db.patients.find((p) => p.id === input.patientId)
    : undefined;
  if (byId) {
    const idx = db.patients.findIndex((p) => p.id === byId.id);
    const familyIds = new Set(byId.familyUserIds || []);
    if (input.familyUserId) familyIds.add(input.familyUserId);
    db.patients[idx] = {
      ...byId,
      name: input.patientName || byId.name,
      phone: input.phone || byId.phone,
      age: typeof input.patientAge === "number" ? input.patientAge : byId.age,
      gender: input.gender || byId.gender,
      address: input.address !== undefined ? input.address : byId.address,
      area: input.area !== undefined ? input.area : byId.area,
      notes: input.notes !== undefined ? input.notes : byId.notes,
      familyUserIds: Array.from(familyIds),
    };
    return byId.id;
  }

  const phoneKey = input.phone.replace(/\s/g, "");
  const byPhone = db.patients.find(
    (p) => p.phone.replace(/\s/g, "") === phoneKey && phoneKey.length > 0,
  );
  if (byPhone) {
    const idx = db.patients.findIndex((p) => p.id === byPhone.id);
    const familyIds = new Set(byPhone.familyUserIds || []);
    if (input.familyUserId) familyIds.add(input.familyUserId);
    db.patients[idx] = {
      ...byPhone,
      name: input.patientName || byPhone.name,
      age: typeof input.patientAge === "number" ? input.patientAge : byPhone.age,
      gender: input.gender || byPhone.gender,
      address: input.address !== undefined ? input.address : byPhone.address,
      area: input.area !== undefined ? input.area : byPhone.area,
      notes: input.notes !== undefined ? input.notes : byPhone.notes,
      familyUserIds: Array.from(familyIds),
    };
    return byPhone.id;
  }

  if (!input.patientName.trim() || !input.phone.trim()) return undefined;

  const row: Patient = {
    id: `pat-${Date.now()}`,
    name: input.patientName.trim(),
    phone: input.phone.trim(),
    age: input.patientAge,
    gender: input.gender,
    address: input.address?.trim(),
    area: input.area?.trim(),
    notes: input.notes?.trim(),
    familyUserIds: input.familyUserId ? [input.familyUserId] : [],
    status: "active",
    createdAt: new Date().toISOString(),
  };
  db.patients.unshift(row);
  return row.id;
}

/** Only explicit saved location ids allot — never auto-match from GPS. */
function resolveLocationId(
  db: Awaited<ReturnType<typeof readDb>>,
  locationId: string | undefined,
): string | undefined {
  if (!locationId) return undefined;
  return (db.careLocations || []).some((l) => l.id === locationId)
    ? locationId
    : undefined;
}

/** Accept number or numeric string from mobile form payloads. */
function parseCoord(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.trim());
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function upsertAllotment(
  db: Awaited<ReturnType<typeof readDb>>,
  booking: Booking,
  locationId?: string,
) {
  const resolved = resolveLocationId(db, locationId);
  if (!resolved || !booking.assignedStaffId) return;
  if (!db.siteAllotments) db.siteAllotments = [];
  const existing = db.siteAllotments.findIndex(
    (a) => a.bookingId === booking.id && a.status === "active",
  );
  const row: SiteAllotment = {
    id: existing >= 0 ? db.siteAllotments[existing].id : `allot-${Date.now()}`,
    locationId: resolved,
    staffId: booking.assignedStaffId,
    bookingId: booking.id,
    shift: booking.shift,
    startDate: booking.startDate,
    endDate: booking.endDate,
    status: "active",
    createdAt:
      existing >= 0 ? db.siteAllotments[existing].createdAt : new Date().toISOString(),
  };
  if (existing >= 0) db.siteAllotments[existing] = row;
  else db.siteAllotments.unshift(row);

  const loc = (db.careLocations || []).find((l) => l.id === resolved);
  if (loc) {
    const bi = db.bookings.findIndex((b) => b.id === booking.id);
    if (bi >= 0) {
      // Explicit saved location always refreshes GPS; keep form address if set.
      db.bookings[bi] = {
        ...db.bookings[bi],
        lat: loc.lat,
        lng: loc.lng,
        geofenceRadiusM: loc.geofenceRadiusM ?? db.bookings[bi].geofenceRadiusM ?? 250,
        address: db.bookings[bi].address || loc.address,
        area: db.bookings[bi].area || loc.city || db.bookings[bi].area,
      };
    }
  }
}

function syncAllotmentStaff(
  db: Awaited<ReturnType<typeof readDb>>,
  bookingId: string,
  staffId: string | undefined,
) {
  if (!db.siteAllotments?.length) return;
  if (!staffId) {
    db.siteAllotments = db.siteAllotments.map((a) =>
      a.bookingId === bookingId && a.status === "active"
        ? { ...a, status: "cancelled" as const }
        : a,
    );
    return;
  }
  db.siteAllotments = db.siteAllotments.map((a) =>
    a.bookingId === bookingId && a.status === "active"
      ? { ...a, staffId }
      : a,
  );
}

function defaultRate(shift: Booking["shift"] | undefined) {
  if (shift === "24hr") return 2200;
  if (shift === "12hr") return 1200;
  return 900;
}

/** Keep 4–6 digit site PIN; empty clears */
function normalizeSitePin(raw: unknown): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  const digits = String(raw).replace(/\D/g, "").slice(0, 6);
  if (!digits) return undefined;
  if (digits.length < 4) return undefined;
  return digits;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await readDb();
  const { bookingsForUser } = await import("@/lib/scope");
  const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
  const bookings = bookingsForUser(db, session);
  if (isStaffOpsRole(normalizeRole(session.role))) {
    return NextResponse.json({ bookings, staff: db.staff });
  }
  return NextResponse.json({ bookings });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Booking> & {
    createLead?: boolean;
    locationId?: string;
    force?: boolean;
    familyUserId?: string;
  };
  if (!body.patientName || !body.phone || !body.careType || !body.address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const session = await getSession();
  const db = await readDb();
  const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
  const isAdmin = session ? isStaffOpsRole(normalizeRole(session.role)) : false;
  const locationId = body.locationId ? String(body.locationId) : undefined;
  const loc = locationId
    ? (db.careLocations || []).find((l) => l.id === locationId)
    : undefined;

  if (!session && !isAdmin) {
    // public booking still allowed
  }

  const shift = body.shift ?? "12hr";
  const dateErr = validateBookingDates(body.startDate, body.endDate);
  if (dateErr) return NextResponse.json({ error: dateErr }, { status: 400 });
  const defaults = defaultShiftTimes(shift);
  const shiftStartTime = body.shiftStartTime || defaults.start;
  const shiftEndTime = body.shiftEndTime || defaults.end;
  const shiftErr = validateShiftTimes(shift, shiftStartTime, shiftEndTime);
  if (shiftErr) return NextResponse.json({ error: shiftErr }, { status: 400 });

  const assignedStaffId = isAdmin ? body.assignedStaffId : undefined;
  let status: Booking["status"] = body.status || "pending";
  if (isAdmin && assignedStaffId && status === "pending") status = "assigned";
  if (isAdmin && body.status) status = body.status;

  const familyUserId =
    session?.role === "family" ? session.id : body.familyUserId || undefined;
  const patientId = isAdmin
    ? resolveOrCreatePatient(db, {
        patientId: body.patientId,
        patientName: body.patientName.trim(),
        phone: body.phone.trim(),
        patientAge: typeof body.patientAge === "number" ? body.patientAge : undefined,
        gender: body.gender,
        address: body.address.trim() || loc?.address || "",
        area: body.area?.trim() || loc?.city || "Bhilwara",
        notes: body.notes?.trim(),
        familyUserId,
      })
    : body.patientId;

  const nextNum =
    db.bookings.reduce((max, b) => {
      const n = Number(String(b.id).replace(/\D/g, "")) || 0;
      return Math.max(max, n);
    }, 1000) + 1;

  const booking: Booking = {
    id: `BK-${nextNum}`,
    patientName: body.patientName.trim(),
    patientId,
    careType: body.careType,
    shift,
    address: body.address.trim() || loc?.address || "",
    area: body.area?.trim() || loc?.city || "Bhilwara",
    startDate: body.startDate || new Date().toISOString().slice(0, 10),
    endDate: body.endDate,
    phone: body.phone.trim(),
    notes: body.notes?.trim(),
    status,
    assignedStaffId,
    familyUserId,
    amount: typeof body.amount === "number" ? body.amount : defaultRate(shift),
    createdAt: new Date().toISOString(),
    lat: parseCoord(body.lat) ?? loc?.lat,
    lng: parseCoord(body.lng) ?? loc?.lng,
    geofenceRadiusM:
      parseCoord(body.geofenceRadiusM) ?? loc?.geofenceRadiusM ?? 250,
    patientAge: typeof body.patientAge === "number" ? body.patientAge : undefined,
    gender: body.gender,
    priority: body.priority || "normal",
    guardianName: body.guardianName?.trim(),
    staffPayPerShift:
      typeof body.staffPayPerShift === "number" ? body.staffPayPerShift : undefined,
    upiId: body.upiId?.trim() || undefined,
    sitePin: normalizeSitePin(body.sitePin),
    shiftStartTime,
    shiftEndTime,
  };

  if (assignedStaffId && isAdmin && !body.force) {
    const conflicts = findAssignmentConflicts({
      staffId: assignedStaffId,
      booking,
      bookings: db.bookings,
      leaves: db.leaves || [],
      availability: db.nurseAvailability || [],
    });
    if (conflicts.length) {
      return NextResponse.json(
        { error: conflicts[0].message, conflicts },
        { status: 409 },
      );
    }
  }

  db.bookings.unshift(booking);

  if (assignedStaffId) {
    db.staff = db.staff.map((s) =>
      s.id === assignedStaffId ? { ...s, status: "on-duty" as const } : s,
    );
  }

  if (!isAdmin || body.createLead) {
    db.leads.unshift({
      id: `L-${String(db.leads.length + 1).padStart(2, "0")}`,
      name: booking.patientName,
      phone: booking.phone,
      careType: booking.careType,
      message: booking.notes || (isAdmin ? "Created by care desk" : "Online booking request"),
      status: "new",
      createdAt: new Date().toISOString(),
    });
  }

  if (isAdmin && !db.invoices.some((i) => i.bookingId === booking.id)) {
    const invoice: Invoice = {
      id: `INV-${String(db.invoices.length + 101).padStart(3, "0")}`,
      bookingId: booking.id,
      patientName: booking.patientName,
      amount: booking.amount,
      paid: 0,
      status: "unpaid",
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    };
    db.invoices.unshift(invoice);
  }

  const allottedId = resolveLocationId(db, locationId);
  upsertAllotment(db, booking, allottedId);

  if (isAdmin && assignedStaffId) {
    pushAudit(db, {
      action: "booking.assign",
      entity: "booking",
      detail: `${booking.id} · ${booking.patientName} → ${assignedStaffId}`,
      actorId: session?.id,
      actorName: session?.name,
    });
  }

  pushActivity(db, {
    kind: "booking",
    title: `Booking ${booking.id} · ${booking.patientName}`,
    detail: `${booking.careType} · ${booking.status}${assignedStaffId ? " · staff assigned" : ""}${allottedId ? " · site allotted" : ""}`,
    href: "/dashboard/admin/bookings",
    actorId: session?.id,
    actorName: session?.name,
  });

  await writeDb(db);
  return NextResponse.json({ booking: db.bookings.find((b) => b.id === booking.id) || booking }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
  if (!session || !isStaffOpsRole(normalizeRole(session.role))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Partial<Booking> & {
    id: string;
    clearStaff?: boolean;
    locationId?: string;
    force?: boolean;
  };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = await readDb();
  const idx = db.bookings.findIndex((b) => b.id === body.id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const current = db.bookings[idx];
  const hasExplicitLocation = Object.prototype.hasOwnProperty.call(body, "locationId");
  const locationId = hasExplicitLocation
    ? body.locationId
      ? String(body.locationId)
      : undefined
    : undefined;
  const loc = locationId
    ? (db.careLocations || []).find((l) => l.id === locationId)
    : undefined;
  const bodyLat = parseCoord(body.lat);
  const bodyLng = parseCoord(body.lng);
  const bodyGeofence = parseCoord(body.geofenceRadiusM);
  const prevStaffId = current.assignedStaffId;
  const nextStaffId = body.clearStaff
    ? undefined
    : body.assignedStaffId !== undefined
      ? body.assignedStaffId || undefined
      : current.assignedStaffId;
  const staffChanged = prevStaffId !== nextStaffId;

  const nextStart = body.startDate || current.startDate;
  const nextEnd =
    body.endDate !== undefined ? body.endDate || undefined : current.endDate;
  const dateErr = validateBookingDates(nextStart, nextEnd);
  if (dateErr) return NextResponse.json({ error: dateErr }, { status: 400 });

  const nextShift = body.shift || current.shift;
  const nextShiftStart =
    body.shiftStartTime !== undefined
      ? body.shiftStartTime || undefined
      : current.shiftStartTime;
  const nextShiftEnd =
    body.shiftEndTime !== undefined
      ? body.shiftEndTime || undefined
      : current.shiftEndTime;
  const shiftErr = validateShiftTimes(nextShift, nextShiftStart, nextShiftEnd);
  if (shiftErr) return NextResponse.json({ error: shiftErr }, { status: 400 });

  const nextPatientName = body.patientName?.trim() || current.patientName;
  const nextPhone = body.phone?.trim() || current.phone;
  const nextAddress =
    body.address !== undefined
      ? body.address.trim() || loc?.address || current.address
      : loc?.address || current.address;
  const nextArea =
    body.area !== undefined
      ? body.area.trim() || loc?.city || current.area
      : loc?.city || current.area;
  const nextNotes = body.notes !== undefined ? body.notes : current.notes;
  const nextAge =
    typeof body.patientAge === "number" ? body.patientAge : current.patientAge;
  const nextGender = body.gender || current.gender;
  const nextFamilyUserId =
    body.familyUserId !== undefined ? body.familyUserId || undefined : current.familyUserId;

  // Only touch CRM patient when the request includes patient fields (not status-only).
  const touchesPatient =
    body.patientName !== undefined ||
    body.phone !== undefined ||
    body.patientId !== undefined ||
    body.address !== undefined ||
    body.area !== undefined ||
    body.patientAge !== undefined ||
    body.gender !== undefined ||
    body.familyUserId !== undefined ||
    body.notes !== undefined;

  const patientId = touchesPatient
    ? resolveOrCreatePatient(db, {
        patientId: body.patientId || current.patientId,
        patientName: nextPatientName,
        phone: nextPhone,
        patientAge: nextAge,
        gender: nextGender,
        address: nextAddress,
        area: nextArea,
        notes: nextNotes,
        familyUserId: nextFamilyUserId,
      })
    : current.patientId;

  const draft: Booking = {
    ...current,
    patientName: nextPatientName,
    patientId: patientId || current.patientId,
    phone: nextPhone,
    careType: body.careType || current.careType,
    shift: nextShift,
    address: nextAddress,
    area: nextArea,
    startDate: nextStart,
    endDate: nextEnd,
    notes: nextNotes,
    status: body.status || current.status,
    assignedStaffId: nextStaffId,
    familyUserId: nextFamilyUserId,
    amount: typeof body.amount === "number" ? body.amount : current.amount,
    // Prefer explicit GPS from the form; else saved location; else keep current.
    lat: bodyLat ?? loc?.lat ?? current.lat,
    lng: bodyLng ?? loc?.lng ?? current.lng,
    geofenceRadiusM: bodyGeofence ?? loc?.geofenceRadiusM ?? current.geofenceRadiusM,
    patientAge: nextAge,
    gender: nextGender,
    priority: body.priority || current.priority,
    guardianName:
      body.guardianName !== undefined ? body.guardianName : current.guardianName,
    backupStaffId:
      body.backupStaffId !== undefined ? body.backupStaffId || undefined : current.backupStaffId,
    staffPayPerShift:
      typeof body.staffPayPerShift === "number" ? body.staffPayPerShift : current.staffPayPerShift,
    upiId: body.upiId !== undefined ? body.upiId || undefined : current.upiId,
    sitePin:
      body.sitePin !== undefined
        ? normalizeSitePin(body.sitePin) || undefined
        : current.sitePin,
    shiftStartTime: nextShiftStart,
    shiftEndTime: nextShiftEnd,
  };

  const scheduleTouched =
    staffChanged ||
    nextStart !== current.startDate ||
    nextEnd !== current.endDate ||
    nextShift !== current.shift ||
    nextShiftStart !== current.shiftStartTime ||
    nextShiftEnd !== current.shiftEndTime;

  if (nextStaffId && scheduleTouched && !body.force) {
    const conflicts = findAssignmentConflicts({
      staffId: nextStaffId,
      booking: draft,
      bookings: db.bookings,
      leaves: db.leaves || [],
      availability: db.nurseAvailability || [],
    });
    if (conflicts.length) {
      return NextResponse.json(
        { error: conflicts[0].message, conflicts },
        { status: 409 },
      );
    }
  }

  db.bookings[idx] = draft;

  if (staffChanged) {
    if (nextStaffId) {
      db.staff = db.staff.map((s) =>
        s.id === nextStaffId ? { ...s, status: "on-duty" as const } : s,
      );
    }
    if (prevStaffId) {
      const stillBusy = db.bookings.some(
        (b) =>
          b.id !== draft.id &&
          b.assignedStaffId === prevStaffId &&
          (b.status === "assigned" || b.status === "active"),
      );
      if (!stillBusy) {
        db.staff = db.staff.map((s) =>
          s.id === prevStaffId && s.status === "on-duty"
            ? { ...s, status: "available" as const }
            : s,
        );
      }
    }
  }

  // Allot only when a saved location is explicitly chosen — never GPS auto-match.
  let allottedId: string | undefined;
  if (hasExplicitLocation) {
    if (locationId) {
      allottedId = resolveLocationId(db, locationId);
      upsertAllotment(db, db.bookings[idx], allottedId);
    } else {
      syncAllotmentStaff(db, draft.id, undefined);
    }
  } else if (staffChanged) {
    syncAllotmentStaff(db, draft.id, nextStaffId);
  }

  if (staffChanged) {
    pushAudit(db, {
      action: prevStaffId ? "booking.reassign" : "booking.assign",
      entity: "booking",
      detail: `${draft.id} · ${draft.patientName} · ${prevStaffId || "none"} → ${nextStaffId || "none"}`,
      actorId: session.id,
      actorName: session.name,
    });
  }

  pushActivity(db, {
    kind: "booking",
    title: `Booking updated · ${db.bookings[idx].id}`,
    detail: `${db.bookings[idx].patientName} · ${db.bookings[idx].status}${allottedId ? " · site allotted" : ""}`,
    href: "/dashboard/admin/bookings",
    actorId: session.id,
    actorName: session.name,
  });

  await writeDb(db);
  return NextResponse.json({ booking: db.bookings[idx] });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
  if (!session || !isStaffOpsRole(normalizeRole(session.role))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = await readDb();
  if (!db.bookings.some((b) => b.id === id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  db.bookings = db.bookings.filter((b) => b.id !== id);
  await writeDb(db);
  return NextResponse.json({ ok: true });
}