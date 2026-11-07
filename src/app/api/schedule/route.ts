import { NextResponse } from "next/server";
import { format, parseISO } from "date-fns";
import { getSession } from "@/lib/auth";
import { pushActivity } from "@/lib/activity";
import { pushAudit } from "@/lib/audit";
import { readDb, writeDb } from "@/lib/db";
import {
  bookingDateSpan,
  calendarRange,
  dailyWorkload,
  findAssignmentConflicts,
  formatShiftLabel,
  nurseStatusOnDay,
  todayISO,
  validateBookingDates,
  validateShiftTimes,
} from "@/lib/schedule";
import type { Booking, NurseAvailability } from "@/lib/types";

function parseAnchor(raw: string | null) {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(`${todayISO()}T12:00:00`);
  return parseISO(raw);
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") || "week") as "day" | "week" | "month";
  const anchor = parseAnchor(url.searchParams.get("date"));
  const staffId = url.searchParams.get("staffId") || "";
  const status = url.searchParams.get("status") || "";
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const range = calendarRange(mode === "day" || mode === "week" || mode === "month" ? mode : "week", anchor);
  const fromISO = format(range.from, "yyyy-MM-dd");
  const toISO = format(range.to, "yyyy-MM-dd");
  const asOf = todayISO();

  const db = await readDb();
  let bookings = db.bookings.filter((b) => {
    const span = bookingDateSpan(b, asOf);
    return span.to >= fromISO && span.from <= toISO;
  });

  const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
  const role = normalizeRole(session.role);
  if (role === "nurse") {
    const { dutiesForStaff, staffForUser } = await import("@/lib/scope");
    const staff = staffForUser(db, session);
    const allowed = new Set(dutiesForStaff(db, staff).map((b) => b.id));
    bookings = bookings.filter((b) => allowed.has(b.id));
  } else if (!isStaffOpsRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (staffId) bookings = bookings.filter((b) => b.assignedStaffId === staffId);
  if (status === "unassigned") bookings = bookings.filter((b) => !b.assignedStaffId);
  else if (status) bookings = bookings.filter((b) => b.status === status);
  if (q) {
    bookings = bookings.filter(
      (b) =>
        b.patientName.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.area.toLowerCase().includes(q) ||
        (b.assignedStaffId &&
          db.staff.find((s) => s.id === b.assignedStaffId)?.name.toLowerCase().includes(q)),
    );
  }

  const days = range.days.map((d) => format(d, "yyyy-MM-dd"));
  const nurseBoard = db.staff.map((staff) => {
    const byDay: Record<string, ReturnType<typeof nurseStatusOnDay>> = {};
    for (const day of days) {
      byDay[day] = nurseStatusOnDay({
        staff,
        day,
        bookings: db.bookings,
        leaves: db.leaves || [],
        availability: db.nurseAvailability || [],
        asOf,
      });
    }
    return { staff, byDay };
  });

  const workloadByDay: Record<string, ReturnType<typeof dailyWorkload>> = {};
  for (const day of days) {
    workloadByDay[day] = dailyWorkload(db.bookings, day, asOf);
  }

  const conflictPreview = bookings
    .filter((b) => b.assignedStaffId && (b.status === "assigned" || b.status === "active"))
    .flatMap((b) =>
      findAssignmentConflicts({
        staffId: b.assignedStaffId!,
        booking: b,
        bookings: db.bookings,
        leaves: db.leaves || [],
        availability: db.nurseAvailability || [],
        asOf,
      }).map((c) => ({ bookingId: b.id, staffId: b.assignedStaffId, ...c })),
    );

  return NextResponse.json({
    mode,
    date: format(anchor, "yyyy-MM-dd"),
    from: fromISO,
    to: toISO,
    days,
    bookings,
    staff: db.staff,
    leaves: db.leaves || [],
    availability: db.nurseAvailability || [],
    nurseBoard,
    workloadByDay,
    conflicts: conflictPreview,
    asOf,
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
  if (!session || !isStaffOpsRole(normalizeRole(session.role))) {
    return NextResponse.json({ error: "Ops only" }, { status: 403 });
  }

  const body = (await req.json()) as {
    action: "assign" | "reassign" | "setAvailability" | "updateShift" | "check";
    bookingId?: string;
    staffId?: string;
    clearStaff?: boolean;
    status?: Booking["status"];
    shift?: Booking["shift"];
    shiftStartTime?: string;
    shiftEndTime?: string;
    startDate?: string;
    endDate?: string | null;
    force?: boolean;
    availability?: {
      staffId: string;
      date: string;
      status: NurseAvailability["status"];
      note?: string;
      shiftHint?: NurseAvailability["shiftHint"];
    };
  };

  const db = await readDb();
  const asOf = todayISO();

  if (body.action === "setAvailability") {
    const a = body.availability;
    if (!a?.staffId || !a.date || !a.status) {
      return NextResponse.json({ error: "staffId, date, status required" }, { status: 400 });
    }
    if (!db.nurseAvailability) db.nurseAvailability = [];
    const existing = db.nurseAvailability.findIndex(
      (x) => x.staffId === a.staffId && x.date === a.date,
    );
    const row: NurseAvailability = {
      id: existing >= 0 ? db.nurseAvailability[existing].id : `nav-${Date.now()}`,
      staffId: a.staffId,
      date: a.date,
      status: a.status,
      note: a.note?.trim() || undefined,
      shiftHint: a.shiftHint,
      createdAt:
        existing >= 0 ? db.nurseAvailability[existing].createdAt : new Date().toISOString(),
    };
    if (existing >= 0) db.nurseAvailability[existing] = row;
    else db.nurseAvailability.unshift(row);

    pushAudit(db, {
      action: "availability.set",
      entity: "nurseAvailability",
      detail: `${a.staffId} · ${a.date} · ${a.status}`,
      actorId: session.id,
      actorName: session.name,
    });
    await writeDb(db);
    return NextResponse.json({ availability: row });
  }

  if (!body.bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }
  const idx = db.bookings.findIndex((b) => b.id === body.bookingId);
  if (idx < 0) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const current = db.bookings[idx];
  const draft: Booking = {
    ...current,
    shift: body.shift || current.shift,
    shiftStartTime:
      body.shiftStartTime !== undefined ? body.shiftStartTime || undefined : current.shiftStartTime,
    shiftEndTime:
      body.shiftEndTime !== undefined ? body.shiftEndTime || undefined : current.shiftEndTime,
    startDate: body.startDate || current.startDate,
    endDate:
      body.endDate === null
        ? undefined
        : body.endDate !== undefined
          ? body.endDate || undefined
          : current.endDate,
    assignedStaffId: body.clearStaff
      ? undefined
      : body.staffId !== undefined
        ? body.staffId || undefined
        : current.assignedStaffId,
    status: body.status || current.status,
  };

  if (body.action === "check") {
    const conflicts = draft.assignedStaffId
      ? findAssignmentConflicts({
          staffId: draft.assignedStaffId,
          booking: draft,
          bookings: db.bookings,
          leaves: db.leaves || [],
          availability: db.nurseAvailability || [],
          asOf,
        })
      : [];
    return NextResponse.json({
      ok: conflicts.length === 0,
      conflicts,
      label: formatShiftLabel(draft),
      span: bookingDateSpan(draft, asOf),
    });
  }

  const dateErr = validateBookingDates(draft.startDate, draft.endDate);
  if (dateErr) return NextResponse.json({ error: dateErr }, { status: 400 });
  const shiftErr = validateShiftTimes(draft.shift, draft.shiftStartTime, draft.shiftEndTime);
  if (shiftErr) return NextResponse.json({ error: shiftErr }, { status: 400 });

  const prevStaffId = current.assignedStaffId;
  const nextStaffId = draft.assignedStaffId;

  if (nextStaffId && !body.force) {
    const conflicts = findAssignmentConflicts({
      staffId: nextStaffId,
      booking: draft,
      bookings: db.bookings,
      leaves: db.leaves || [],
      availability: db.nurseAvailability || [],
      asOf,
    });
    if (conflicts.length) {
      return NextResponse.json(
        { error: conflicts[0].message, conflicts },
        { status: 409 },
      );
    }
  }

  if (
    (body.action === "assign" || body.action === "reassign") &&
    nextStaffId &&
    (draft.status === "pending" || !body.status)
  ) {
    draft.status = draft.status === "pending" ? "assigned" : draft.status;
  }

  db.bookings[idx] = draft;

  if (nextStaffId) {
    db.staff = db.staff.map((s) =>
      s.id === nextStaffId ? { ...s, status: "on-duty" as const } : s,
    );
  }
  if (prevStaffId && prevStaffId !== nextStaffId) {
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

  const actionLabel =
    body.action === "reassign" || (prevStaffId && prevStaffId !== nextStaffId)
      ? "booking.reassign"
      : body.action === "updateShift"
        ? "booking.shift_update"
        : "booking.assign";

  pushAudit(db, {
    action: actionLabel,
    entity: "booking",
    detail: `${draft.id} · ${draft.patientName} · staff ${prevStaffId || "none"} → ${nextStaffId || "none"} · ${formatShiftLabel(draft)}`,
    actorId: session.id,
    actorName: session.name,
  });
  pushActivity(db, {
    kind: "booking",
    title:
      actionLabel === "booking.reassign"
        ? `Duty reassigned · ${draft.id}`
        : `Duty scheduled · ${draft.id}`,
    detail: `${draft.patientName} · ${formatShiftLabel(draft)}`,
    href: "/dashboard/admin/schedule",
    actorId: session.id,
    actorName: session.name,
  });

  await writeDb(db);
  return NextResponse.json({ booking: db.bookings[idx] });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  const { isStaffOpsRole: ops, normalizeRole: norm } = await import("@/lib/permissions");
  if (!session || !ops(norm(session.role))) {
    return NextResponse.json({ error: "Ops only" }, { status: 403 });
  }
  const url = new URL(req.url);
  const staffId = url.searchParams.get("staffId");
  const date = url.searchParams.get("date");
  if (!staffId || !date) {
    return NextResponse.json({ error: "staffId and date required" }, { status: 400 });
  }
  const db = await readDb();
  db.nurseAvailability = (db.nurseAvailability || []).filter(
    (a) => !(a.staffId === staffId && a.date === date),
  );
  pushAudit(db, {
    action: "availability.clear",
    entity: "nurseAvailability",
    detail: `${staffId} · ${date}`,
    actorId: session.id,
    actorName: session.name,
  });
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
