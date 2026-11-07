import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSession } from "@/lib/auth";
import { pushActivity } from "@/lib/activity";
import { pushAudit } from "@/lib/audit";
import { dutyProgress, normalizeSlot, todayDutyDate } from "@/lib/duty";
import { readDb, writeDb } from "@/lib/db";
import {
  DEFAULT_GEOFENCE_M,
  WEAK_GPS_M,
  distanceMeters,
  effectiveGeofenceM,
  gpsQuality,
  isImpossibleJump,
} from "@/lib/geo";
import { evaluateCheckInTiming } from "@/lib/attendance-rules";
import { photoFingerprint } from "@/lib/photoHash";
import { refreshAllPerformance } from "@/lib/performance";
import type { Attendance, AttendanceSlot, DbShape, SalaryPayout, Staff } from "@/lib/types";

const ADMIN_PLACEHOLDER_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await readDb();
  const { isStaffOpsRole, normalizeRole } = await import("@/lib/permissions");
  if (isStaffOpsRole(normalizeRole(session.role))) {
    return NextResponse.json({
      attendance: db.attendance,
      salaryPayouts: db.salaryPayouts || [],
      bookings: db.bookings.map((b) => ({
        id: b.id,
        patientName: b.patientName,
        lat: b.lat,
        lng: b.lng,
        geofenceRadiusM: b.geofenceRadiusM,
        address: b.address,
        assignedStaffId: b.assignedStaffId,
        status: b.status,
      })),
    });
  }
  if (session.role === "nurse") {
    const { attendanceForStaff, dutiesForStaff, staffForUser } = await import("@/lib/scope");
    const staff = staffForUser(db, session);
    const myDuties = dutiesForStaff(db, staff);
    return NextResponse.json({
      attendance: attendanceForStaff(db, staff, session),
      salaryPayouts: (db.salaryPayouts || []).filter((p) => staff && p.staffId === staff.id),
      bookings: myDuties.map((b) => ({
        id: b.id,
        patientName: b.patientName,
        lat: b.lat,
        lng: b.lng,
        geofenceRadiusM: b.geofenceRadiusM,
        address: b.address,
        assignedStaffId: b.assignedStaffId,
        status: b.status,
      })),
    });
  }
  return NextResponse.json({ attendance: [], salaryPayouts: [] });
}

type Body = {
  bookingId?: string;
  staffId?: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
  photoDataUrl?: string;
  type?: AttendanceSlot | "present" | "checkout";
  demoForceOnSite?: boolean;
  pinCareSite?: boolean;
  sitePin?: string;
  queuedAt?: string;
  adminMark?: boolean;
  adminNote?: string;
  dutyDate?: string;
};

async function savePhoto(photoDataUrl: string, bookingId: string, slot: string) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "attendance");
  await fs.mkdir(uploadsDir, { recursive: true });
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(photoDataUrl);
  if (!match) return null;
  const ext = match[1].includes("png") ? "png" : match[1].includes("svg") ? "svg" : "jpg";
  const fileName = `${bookingId}-${slot}-${Date.now()}.${ext}`;
  await fs.writeFile(path.join(uploadsDir, fileName), Buffer.from(match[2], "base64"));
  return { photoUrl: `/uploads/attendance/${fileName}`, photoHash: photoFingerprint(photoDataUrl) };
}

function applyEveningPayout(
  db: DbShape,
  staff: Staff,
  booking: DbShape["bookings"][number],
  dutyDate: string,
  morningId: string,
  eveningId: string,
  session: { id: string; name: string },
  salaryMultiplier = 1,
) {
  const base =
    typeof booking.staffPayPerShift === "number"
      ? booking.staffPayPerShift
      : staff.salaryPerShift || 700;
  // Explicit booking rate wins; otherwise apply HCMS shift/punctuality multiplier.
  const amount = Math.round(
    (typeof booking.staffPayPerShift === "number" ? base : base * salaryMultiplier) * 100,
  ) / 100;

  const payout: SalaryPayout = {
    id: `pay-${Date.now()}`,
    staffId: staff.id,
    bookingId: booking.id,
    patientName: booking.patientName,
    dutyDate,
    amount,
    morningAttendanceId: morningId,
    eveningAttendanceId: eveningId,
    status: "earned",
    createdAt: new Date().toISOString(),
  };
  if (!db.salaryPayouts) db.salaryPayouts = [];
  db.salaryPayouts.unshift(payout);
  staff.shiftsCompleted = (staff.shiftsCompleted || 0) + 1;
  staff.status = "available";
  if (!booking.endDate || booking.endDate <= dutyDate) {
    booking.status = "completed";
  }
  pushActivity(db, {
    kind: "billing",
    title: `Duty complete · ${staff.name}`,
    detail: `${booking.patientName} · ₹${amount} earned · ${dutyDate}`,
    href: "/dashboard/admin/payroll",
    actorId: session.id,
    actorName: session.name,
  });
  return payout;
}

export async function POST(req: Request) {
  const session = await getSession();
  const { isStaffOpsRole: opsRole, normalizeRole: normRole } = await import("@/lib/permissions");
  if (!session || (session.role !== "nurse" && !opsRole(normRole(session.role)))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Body;
  const isAdminMark = opsRole(normRole(session.role)) && body.adminMark === true;

  if (!body.bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }

  const slot = normalizeSlot(body.type || "morning");
  if (!slot) {
    return NextResponse.json({ error: "type must be morning or evening" }, { status: 400 });
  }

  const db = await readDb();
  const booking = db.bookings.find((b) => b.id === body.bookingId);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  let staff: Staff | undefined;
  if (isAdminMark) {
    staff = db.staff.find((s) => s.id === body.staffId || s.id === booking.assignedStaffId);
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    // Desk mark can attach/reassign booking to this staff for the present
    booking.assignedStaffId = staff.id;
  } else {
    if (session.role !== "nurse") {
      return NextResponse.json({ error: "Only staff can mark attendance" }, { status: 401 });
    }
    const { staffForUser } = await import("@/lib/scope");
    staff = staffForUser(db, session);
    if (!staff) {
      return NextResponse.json(
        { error: "Staff profile not linked. Ask admin to assign your login to a staff record." },
        { status: 404 },
      );
    }
    if (!booking.assignedStaffId || booking.assignedStaffId !== staff.id) {
      return NextResponse.json(
        { error: "Present only for your assigned duty. This booking is not assigned to you." },
        { status: 403 },
      );
    }
  }

  if (booking.status !== "active" && booking.status !== "assigned") {
    return NextResponse.json({ error: "Booking is not active for attendance" }, { status: 400 });
  }

  const dutyDate =
    isAdminMark && body.dutyDate && /^\d{4}-\d{2}-\d{2}$/.test(body.dutyDate)
      ? body.dutyDate
      : todayDutyDate();
  const progress = dutyProgress(db.attendance, booking.id, dutyDate);

  if (slot === "morning" && progress.morningDone) {
    return NextResponse.json(
      { error: "Morning present already marked for this date." },
      { status: 409 },
    );
  }
  if (slot === "evening" && !progress.morningDone) {
    return NextResponse.json(
      { error: "Pehle morning present lagao. Evening tabhi open hota hai." },
      { status: 400 },
    );
  }
  if (slot === "evening" && progress.eveningDone) {
    return NextResponse.json(
      { error: "Evening present already marked for this date." },
      { status: 409 },
    );
  }

  let lat: number;
  let lng: number;
  const accuracy = body.accuracy;
  let quality = gpsQuality(body.accuracy);
  let dist = 0;
  let photoDataUrl = body.photoDataUrl;

  if (isAdminMark) {
    lat =
      typeof body.lat === "number"
        ? body.lat
        : typeof booking.lat === "number"
          ? booking.lat
          : 25.3476;
    lng =
      typeof body.lng === "number"
        ? body.lng
        : typeof booking.lng === "number"
          ? booking.lng
          : 74.6408;
    if (typeof booking.lat === "number" && typeof booking.lng === "number") {
      dist = Math.round(distanceMeters(lat, lng, booking.lat, booking.lng));
    }
    quality = "good";
    if (!photoDataUrl?.startsWith("data:image/")) photoDataUrl = ADMIN_PLACEHOLDER_PNG;
  } else {
    if (typeof body.lat !== "number" || typeof body.lng !== "number") {
      return NextResponse.json({ error: "lat, lng required" }, { status: 400 });
    }
    if (!photoDataUrl?.startsWith("data:image/")) {
      return NextResponse.json({ error: "Site photo is required" }, { status: 400 });
    }

    if (booking.sitePin) {
      const entered = String(body.sitePin || "").replace(/\D/g, "");
      if (entered !== booking.sitePin) {
        return NextResponse.json(
          { error: "Galat site PIN. Care address pe likha PIN enter karo." },
          { status: 403 },
        );
      }
    }

    if (body.pinCareSite) {
      booking.lat = body.lat;
      booking.lng = body.lng;
      if (!booking.geofenceRadiusM) booking.geofenceRadiusM = DEFAULT_GEOFENCE_M;
    }

    if (typeof booking.lat !== "number" || typeof booking.lng !== "number") {
      return NextResponse.json(
        { error: "Care location GPS not set for this booking. Ask admin to set it." },
        { status: 400 },
      );
    }

    if (!body.demoForceOnSite && quality === "weak") {
      return NextResponse.json(
        {
          error: `GPS signal weak (±${Math.round(body.accuracy || 0)}m). Open sky me Refresh GPS karo, ya demo mode on karo.`,
          gpsQuality: quality,
          weakGpsThresholdM: WEAK_GPS_M,
        },
        { status: 400 },
      );
    }

    lat = body.lat;
    lng = body.lng;
    if (body.demoForceOnSite) {
      lat = booking.lat;
      lng = booking.lng;
    }

    const lastForStaff = db.attendance.find((a) => a.staffId === staff!.id);
    if (!body.demoForceOnSite && isImpossibleJump(lastForStaff, lat, lng)) {
      return NextResponse.json(
        {
          error:
            "Impossible GPS jump detect hua (bahut door, bahut jaldi). Fake location band karo aur Refresh GPS try karo.",
        },
        { status: 403 },
      );
    }

    dist = distanceMeters(lat, lng, booking.lat, booking.lng);
    const radius = effectiveGeofenceM(booking.geofenceRadiusM, body.accuracy);
    if (dist > radius) {
      return NextResponse.json(
        {
          error: `You are ${Math.round(dist)}m away. Present only allowed within ${radius}m of care address.`,
          distanceMeters: Math.round(dist),
          geofenceRadiusM: radius,
          withinGeofence: false,
          gpsQuality: quality,
        },
        { status: 403 },
      );
    }
  }

  const saved = await savePhoto(photoDataUrl!, booking.id, slot);
  if (!saved) {
    return NextResponse.json({ error: "Invalid photo data" }, { status: 400 });
  }

  if (!isAdminMark) {
    const reused = db.attendance.some(
      (a) => a.staffId === staff!.id && a.photoHash && a.photoHash === saved.photoHash,
    );
    if (reused) {
      return NextResponse.json(
        {
          error:
            "Same photo reused dikha. Nayi site photo lo (camera preferred) — fraud check failed.",
        },
        { status: 400 },
      );
    }
  }

  const timing = evaluateCheckInTiming({
    booking,
    slot,
    dutyDate,
    skipWindow: isAdminMark,
  });
  if (!timing.ok) {
    return NextResponse.json({ error: timing.error, expectedAt: timing.expectedAt?.toISOString() }, { status: 400 });
  }

  const record: Attendance = {
    id: `att-${Date.now()}`,
    bookingId: booking.id,
    staffId: staff!.id,
    nurseId: staff!.userId || session.id,
    type: slot,
    dutyDate,
    lat,
    lng,
    accuracy,
    distanceMeters: Math.round(dist),
    withinGeofence: true,
    photoUrl: saved.photoUrl,
    photoHash: saved.photoHash,
    gpsQuality: quality,
    punctualityStatus: timing.status,
    minutesLate: timing.minutesLate || undefined,
    salaryMultiplier: timing.salaryMultiplier,
    markedByAdmin: isAdminMark || undefined,
    adminNote: isAdminMark ? body.adminNote?.trim() || undefined : undefined,
    createdAt: body.queuedAt || new Date().toISOString(),
  };

  db.attendance.unshift(record);

  let payout: SalaryPayout | null = null;
  let dutyComplete = false;

  if (slot === "morning") {
    staff!.status = "on-duty";
    if (booking.status === "assigned") booking.status = "active";
  }

  if (slot === "evening") {
    dutyComplete = true;
    const morningMult =
      typeof progress.morning?.salaryMultiplier === "number"
        ? progress.morning.salaryMultiplier
        : 1;
    const dayMult = Math.min(morningMult, timing.salaryMultiplier);
    payout = applyEveningPayout(
      db,
      staff!,
      booking,
      dutyDate,
      progress.morning!.id,
      record.id,
      session,
      dayMult,
    );
  }

  pushActivity(db, {
    kind: "attendance",
    title: isAdminMark
      ? `Admin marked ${slot} · ${staff!.name}`
      : `${session.name} · ${slot} present`,
    detail: `${booking.patientName} · ${booking.id}${dutyComplete ? " · DUTY COMPLETE" : ""}${
      isAdminMark ? " · desk mark" : ""
    }`,
    href: "/dashboard/admin/staff",
    actorId: session.id,
    actorName: session.name,
  });
  pushAudit(db, {
    action: isAdminMark ? `attendance.admin.${slot}` : `attendance.${slot}`,
    entity: record.id,
    detail: `${booking.id} · ${dutyDate} · staff=${staff!.id}`,
    actorId: session.id,
    actorName: session.name,
  });
  refreshAllPerformance(db);

  await writeDb(db);

  return NextResponse.json(
    {
      attendance: record,
      dutyComplete,
      payout,
      progress: dutyProgress(db.attendance, booking.id, dutyDate),
      punctualityStatus: timing.status,
      minutesLate: timing.minutesLate,
      salaryMultiplier: timing.salaryMultiplier,
      message: timing.message,
    },
    { status: 201 },
  );
}
