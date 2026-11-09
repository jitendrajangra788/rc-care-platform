import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-guard";
import { pushAudit } from "@/lib/audit";
import { readDb, writeDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { normalizeRole } from "@/lib/permissions";
import type { Role, User } from "@/lib/types";
import { parseBody, roleSchema } from "@/lib/validation";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(200),
  role: roleSchema,
  phone: z.string().max(30).optional(),
});

export async function GET() {
  const auth = await requirePermission("users.manage");
  if ("error" in auth) return auth.error;
  const db = await readDb();
  const users = db.users.map(({ password: _, ...safe }) => {
    void _;
    return { ...safe, role: normalizeRole(safe.role) };
  });
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const auth = await requirePermission("users.manage");
  if ("error" in auth) return auth.error;
  const parsed = parseBody(createUserSchema, await req.json().catch(() => null));
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error || "Invalid" }, { status: 400 });
  }
  const db = await readDb();
  if (db.users.some((u) => u.email.toLowerCase() === parsed.data!.email.toLowerCase())) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }
  const row: User = {
    id: `u-${Date.now()}`,
    name: parsed.data.name.trim(),
    email: parsed.data.email.trim().toLowerCase(),
    password: hashPassword(parsed.data.password),
    // patient is an alias of family (one home-care portal)
    role: normalizeRole(parsed.data.role) as Role,
    phone: parsed.data.phone?.trim(),
    active: true,
  };
  db.users.unshift(row);
  pushAudit(db, {
    action: "user.create",
    entity: "user",
    detail: `${row.email} · ${row.role}`,
    actorId: auth.user.id,
    actorName: auth.user.name,
  });
  await writeDb(db);
  const { password: _, ...safe } = row;
  void _;
  return NextResponse.json({ user: safe }, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = await requirePermission("users.manage");
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const db = await readDb();
  const idx = db.users.findIndex((u) => u.id === body.id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const cur = db.users[idx];
  const nextEmail =
    typeof body.email === "string" && body.email.trim()
      ? body.email.trim().toLowerCase()
      : cur.email;
  if (
    nextEmail !== cur.email &&
    db.users.some((u) => u.id !== cur.id && u.email.toLowerCase() === nextEmail)
  ) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }
  if (body.password && String(body.password).length > 0 && String(body.password).length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  db.users[idx] = {
    ...cur,
    name: body.name?.trim() || cur.name,
    email: nextEmail,
    role: body.role ? normalizeRole(body.role) : cur.role,
    phone: body.phone !== undefined ? String(body.phone).trim() : cur.phone,
    active: typeof body.active === "boolean" ? body.active : cur.active,
    password: body.password ? hashPassword(String(body.password)) : cur.password,
  };
  pushAudit(db, {
    action: "user.update",
    entity: "user",
    detail: `${db.users[idx].email} · role=${db.users[idx].role} active=${db.users[idx].active !== false}${body.password ? " · password reset" : ""}`,
    actorId: auth.user.id,
    actorName: auth.user.name,
  });
  await writeDb(db);
  const { password: _, ...safe } = db.users[idx];
  void _;
  return NextResponse.json({ user: safe });
}
