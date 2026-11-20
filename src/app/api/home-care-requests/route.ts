import { NextResponse } from "next/server";
import { jsonError, requirePermission } from "@/lib/api-guard";
import { readDb, writeDb } from "@/lib/db";
import {
  convertHomeCareRequest,
  homeCareSubmissionSchema,
  insertHomeCareRequest,
  schemaError,
  toHomeCareDTO,
  updateHomeCareRequest,
} from "@/lib/enquiries";
import { can } from "@/lib/permissions";
import { collectPrivateUploads } from "@/lib/private-files";
import { allowPublicSubmit, clientIp } from "@/lib/public-rate-limit";

export const runtime = "nodejs";

function honeypot(body: unknown) {
  if (!body || typeof body !== "object") return false;
  const website = (body as { website?: unknown }).website;
  return typeof website === "string" && website.trim().length > 0;
}

export async function GET(req: Request) {
  const auth = await requirePermission("enquiries.read");
  if ("error" in auth) return auth.error;
  const db = await readDb();
  const id = new URL(req.url).searchParams.get("id");
  const rows = db.homeCareRequests || [];
  if (id) {
    const row = rows.find((item) => item.id === id);
    if (!row) return jsonError("Request not found", 404);
    return NextResponse.json({ request: toHomeCareDTO(row) });
  }
  return NextResponse.json({ requests: rows.map(toHomeCareDTO) });
}

export async function POST(req: Request) {
  if (!allowPublicSubmit(`home:${clientIp(req)}`)) {
    return jsonError("Too many submissions. Please try again later.", 429);
  }
  const body = await req.json().catch(() => null);
  if (honeypot(body)) return jsonError("Unable to submit this form.");
  const parsed = homeCareSubmissionSchema.safeParse(body);
  if (!parsed.success) return jsonError(schemaError(parsed.error));

  const stored = await collectPrivateUploads("home-care", parsed.data.documents);
  if (!stored.ok) return jsonError(stored.error);

  const db = await readDb();
  const row = insertHomeCareRequest(db, parsed.data, stored.documents);
  await writeDb(db);
  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = await requirePermission("enquiries.write");
  if ("error" in auth) return auth.error;
  const body = (await req.json().catch(() => null)) as {
    id?: string;
    action?: "update" | "convert";
    status?: Parameters<typeof updateHomeCareRequest>[1]["status"];
    adminNotes?: string;
    assignedStaffId?: string | null;
  } | null;
  if (!body || !body.id || !body.action) return jsonError("id and action are required");
  const id = body.id;

  const db = await readDb();
  const actor = { id: auth.user.id, name: auth.user.name };

  if (body.action === "convert") {
    if (!can(auth.user, "bookings.write") || !can(auth.user, "patients.write")) {
      return jsonError("You cannot convert requests into bookings.", 403);
    }
    const result = convertHomeCareRequest(db, id, actor);
    if ("error" in result) return jsonError(result.error ?? "Request failed");
    await writeDb(db);
    return NextResponse.json({
      request: toHomeCareDTO(result.request),
      bookingId: result.booking.id,
      patientId: result.patient.id,
      linkedExisting: result.linkedExisting,
    });
  }

  if (body.action === "update") {
    const result = updateHomeCareRequest(
      db,
      {
        id,
        status: body.status,
        adminNotes: body.adminNotes,
        assignedStaffId: body.assignedStaffId,
      },
      actor,
    );
    if ("error" in result) return jsonError(result.error ?? "Request failed");
    await writeDb(db);
    return NextResponse.json({ request: toHomeCareDTO(result.request) });
  }

  return jsonError("Unknown action");
}
