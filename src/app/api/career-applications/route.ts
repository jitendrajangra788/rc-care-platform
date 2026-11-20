import { NextResponse } from "next/server";
import { jsonError, requirePermission } from "@/lib/api-guard";
import { readDb, writeDb } from "@/lib/db";
import {
  careerApplicationSchema,
  hireCareerApplicant,
  insertCareerApplication,
  schemaError,
  toCareerDTO,
  updateCareerApplication,
} from "@/lib/enquiries";
import { can } from "@/lib/permissions";
import { collectPrivateUploads } from "@/lib/private-files";
import { allowPublicSubmit, clientIp } from "@/lib/public-rate-limit";
import type { Staff } from "@/lib/types";

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
  const rows = db.careerApplications || [];
  if (id) {
    const row = rows.find((item) => item.id === id);
    if (!row) return jsonError("Application not found", 404);
    return NextResponse.json({ application: toCareerDTO(row) });
  }
  return NextResponse.json({ applications: rows.map(toCareerDTO) });
}

export async function POST(req: Request) {
  if (!allowPublicSubmit(`career:${clientIp(req)}`)) {
    return jsonError("Too many submissions. Please try again later.", 429);
  }
  const body = await req.json().catch(() => null);
  if (honeypot(body)) return jsonError("Unable to submit this form.");
  const parsed = careerApplicationSchema.safeParse(body);
  if (!parsed.success) return jsonError(schemaError(parsed.error));

  const stored = await collectPrivateUploads("careers", parsed.data.documents);
  if (!stored.ok) return jsonError(stored.error);

  const db = await readDb();
  const row = insertCareerApplication(db, parsed.data, stored.documents);
  await writeDb(db);
  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = await requirePermission("enquiries.write");
  if ("error" in auth) return auth.error;
  const body = (await req.json().catch(() => null)) as {
    id?: string;
    action?: "update" | "hire";
    status?: Parameters<typeof updateCareerApplication>[1]["status"];
    adminRemarks?: string;
    interviewAt?: string;
    interviewNote?: string;
    password?: string;
    staffRole?: Staff["role"];
    salaryPerShift?: number;
    area?: string;
  } | null;
  if (!body || !body.id || !body.action) return jsonError("id and action are required");
  const id = body.id;

  const db = await readDb();
  const actor = { id: auth.user.id, name: auth.user.name };

  if (body.action === "hire") {
    if (!can(auth.user, "staff.write")) {
      return jsonError("You cannot add applicants to staff.", 403);
    }
    const result = hireCareerApplicant(
      db,
      {
        id,
        password: body.password || "",
        staffRole: body.staffRole,
        salaryPerShift: Number(body.salaryPerShift),
        area: body.area,
      },
      actor,
    );
    if ("error" in result) return jsonError(result.error ?? "Request failed");
    await writeDb(db);
    return NextResponse.json({
      application: toCareerDTO(result.application),
      staff: { id: result.staff.id, email: result.email, name: result.staff.name },
    });
  }

  if (body.action === "update") {
    const result = updateCareerApplication(
      db,
      {
        id,
        status: body.status,
        adminRemarks: body.adminRemarks,
        interviewAt: body.interviewAt,
        interviewNote: body.interviewNote,
      },
      actor,
    );
    if ("error" in result) return jsonError(result.error ?? "Request failed");
    await writeDb(db);
    return NextResponse.json({ application: toCareerDTO(result.application) });
  }

  return jsonError("Unknown action");
}
