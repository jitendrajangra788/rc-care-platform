import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-guard";
import { readDb, writeDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import type { Staff, User } from "@/lib/types";

export async function GET() {
  const auth = await requirePermission("staff.read");
  if ("error" in auth) return auth.error;
  const db = await readDb();
  const staff = db.staff.map((s) => {
    const user = db.users.find((u) => u.id === s.userId);
    return {
      ...s,
      email: s.email || user?.email || "",
      hasLogin: Boolean(user),
      loginEmail: user?.email || s.email || "",
    };
  });
  return NextResponse.json({ staff });
}

export async function POST(req: Request) {
  const auth = await requirePermission("staff.write");
  if ("error" in auth) return auth.error;

  const body = (await req.json()) as {
    name?: string;
    role?: Staff["role"];
    phone?: string;
    area?: string;
    skills?: string;
    status?: Staff["status"];
    email?: string;
    password?: string;
    salaryMonthly?: number;
    salaryPerShift?: number;
  };

  if (!body.name || !body.phone || !body.role || !body.email || !body.password) {
    return NextResponse.json(
      { error: "Name, role, phone, email and password are required" },
      { status: 400 },
    );
  }
  if (typeof body.salaryPerShift !== "number" || body.salaryPerShift <= 0) {
    return NextResponse.json({ error: "Per-shift salary is required" }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const db = await readDb();
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const userId = `u-${Date.now()}`;
  const staffId = `s-${Date.now()}`;
  const user: User = {
    id: userId,
    name: body.name.trim(),
    email,
    password: hashPassword(body.password),
    role: "nurse",
    phone: body.phone.trim(),
    active: true,
  };
  const staff: Staff = {
    id: staffId,
    name: body.name.trim(),
    userId,
    email,
    role: body.role,
    phone: body.phone.trim(),
    area: body.area?.trim() || "Bhilwara",
    skills: (body.skills || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    status: body.status || "available",
    rating: 5,
    shiftsCompleted: 0,
    salaryMonthly: typeof body.salaryMonthly === "number" ? body.salaryMonthly : undefined,
    salaryPerShift: body.salaryPerShift,
  };

  db.users.push(user);
  db.staff.unshift(staff);
  await writeDb(db);

  return NextResponse.json(
    { staff: { ...staff, loginEmail: email, password: body.password } },
    { status: 201 },
  );
}

export async function PATCH(req: Request) {
  const auth = await requirePermission("staff.write");
  if ("error" in auth) return auth.error;

  const body = (await req.json()) as {
    id: string;
    name?: string;
    role?: Staff["role"];
    phone?: string;
    area?: string;
    skills?: string;
    status?: Staff["status"];
    email?: string;
    password?: string;
    salaryMonthly?: number;
    salaryPerShift?: number;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Staff id required" }, { status: 400 });
  }

  const db = await readDb();
  const idx = db.staff.findIndex((s) => s.id === body.id);
  if (idx < 0) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  const current = db.staff[idx];
  const email = body.email?.trim().toLowerCase();

  if (email) {
    const clash = db.users.find(
      (u) => u.email.toLowerCase() === email && u.id !== current.userId,
    );
    if (clash) {
      return NextResponse.json({ error: "Email already used by another account" }, { status: 409 });
    }
  }

  const updated: Staff = {
    ...current,
    name: body.name?.trim() || current.name,
    role: body.role || current.role,
    phone: body.phone?.trim() || current.phone,
    area: body.area?.trim() || current.area,
    status: body.status || current.status,
    skills:
      body.skills !== undefined
        ? body.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : current.skills,
    email: email || current.email,
    salaryMonthly:
      typeof body.salaryMonthly === "number" ? body.salaryMonthly : current.salaryMonthly,
    salaryPerShift:
      typeof body.salaryPerShift === "number" ? body.salaryPerShift : current.salaryPerShift || 700,
  };

  // Ensure login user exists / update
  if (current.userId) {
    const uIdx = db.users.findIndex((u) => u.id === current.userId);
    if (uIdx >= 0) {
      db.users[uIdx] = {
        ...db.users[uIdx],
        name: updated.name,
        phone: updated.phone,
        email: email || db.users[uIdx].email,
        password: body.password?.trim()
          ? hashPassword(body.password.trim())
          : db.users[uIdx].password,
        role: "nurse",
      };
      updated.email = db.users[uIdx].email;
    }
  } else if (email && body.password) {
    const userId = `u-${Date.now()}`;
    db.users.push({
      id: userId,
      name: updated.name,
      email,
      password: hashPassword(body.password.trim()),
      role: "nurse",
      phone: updated.phone,
      active: true,
    });
    updated.userId = userId;
    updated.email = email;
  }

  db.staff[idx] = updated;
  await writeDb(db);
  return NextResponse.json({ staff: updated });
}

export async function DELETE(req: Request) {
  const auth = await requirePermission("staff.write");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = await readDb();
  const staff = db.staff.find((s) => s.id === id);
  if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.staff = db.staff.filter((s) => s.id !== id);
  if (staff.userId) {
    db.users = db.users.filter((u) => u.id !== staff.userId);
  }
  db.bookings = db.bookings.map((b) =>
    b.assignedStaffId === id ? { ...b, assignedStaffId: undefined, status: b.status === "active" ? "pending" : b.status } : b,
  );
  await writeDb(db);
  return NextResponse.json({ ok: true });
}