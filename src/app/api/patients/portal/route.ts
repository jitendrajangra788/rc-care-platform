import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-guard";
import { pushAudit } from "@/lib/audit";
import { readDb, writeDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import type { User } from "@/lib/types";
import { z } from "zod";

const schema = z.object({
  patientId: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).max(200),
});

/** Create or reset family/patient portal login for a CRM patient. */
export async function POST(req: Request) {
  const auth = await requirePermission("patients.write");
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Email and password (min 6) required" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;
  const db = await readDb();
  const pIdx = (db.patients || []).findIndex((p) => p.id === parsed.data.patientId);
  if (pIdx < 0) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const patient = db.patients[pIdx];
  let user = patient.userId ? db.users.find((u) => u.id === patient.userId) : undefined;

  if (!user) {
    const clash = db.users.find((u) => u.email.toLowerCase() === email);
    if (clash) {
      // Reuse existing family account if email already exists
      user = clash;
      if (clash.role !== "family" && clash.role !== "patient") {
        return NextResponse.json(
          { error: "Email belongs to a staff account — use another email" },
          { status: 409 },
        );
      }
      user = {
        ...clash,
        password: hashPassword(password),
        role: "family",
        active: true,
        phone: clash.phone || patient.phone,
        name: clash.name || patient.name,
      };
      const uIdx = db.users.findIndex((u) => u.id === clash.id);
      if (uIdx >= 0) db.users[uIdx] = user;
    } else {
      user = {
        id: `u-${Date.now()}`,
        name: patient.name,
        email,
        password: hashPassword(password),
        role: "family",
        phone: patient.phone,
        active: true,
      } satisfies User;
      db.users.unshift(user);
    }
  } else {
    const emailTaken = db.users.some(
      (u) => u.id !== user!.id && u.email.toLowerCase() === email,
    );
    if (emailTaken) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    const uIdx = db.users.findIndex((u) => u.id === user!.id);
    user = {
      ...user,
      email,
      password: hashPassword(password),
      role: "family",
      active: true,
      phone: user.phone || patient.phone,
    };
    if (uIdx >= 0) db.users[uIdx] = user;
  }

  const familyIds = new Set(patient.familyUserIds || []);
  familyIds.add(user.id);
  db.patients[pIdx] = {
    ...patient,
    userId: user.id,
    familyUserIds: Array.from(familyIds),
  };

  pushAudit(db, {
    action: "patient.portal",
    entity: "patient",
    detail: `${patient.id} · ${email}`,
    actorId: auth.user.id,
    actorName: auth.user.name,
  });
  await writeDb(db);

  // Never echo password back — client already has the one-time value it submitted
  return NextResponse.json({
    ok: true,
    email,
    userId: user.id,
    patientId: patient.id,
  });
}
