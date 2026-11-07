import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readDb, saveDataUrlImage, writeDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await readDb();
  const staff = db.staff.find((s) => s.userId === session.id || s.name === session.name);
  return NextResponse.json({ user: session, staff: staff || null });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "nurse") {
    return NextResponse.json({ error: "Only staff can update this profile" }, { status: 401 });
  }

  const body = (await req.json()) as {
    phone?: string;
    area?: string;
    skills?: string;
    bio?: string;
    password?: string;
    photoDataUrl?: string | null;
  };

  const db = await readDb();
  const sIdx = db.staff.findIndex((s) => s.userId === session.id || s.name === session.name);
  if (sIdx < 0) return NextResponse.json({ error: "Staff profile not found" }, { status: 404 });

  const staff = db.staff[sIdx];
  let photoUrl = staff.photoUrl;

  if (body.photoDataUrl === null) {
    photoUrl = undefined;
  } else if (body.photoDataUrl?.startsWith("data:image/")) {
    photoUrl = await saveDataUrlImage(body.photoDataUrl, "profiles", staff.id);
  }

  db.staff[sIdx] = {
    ...staff,
    phone: body.phone?.trim() || staff.phone,
    area: body.area?.trim() || staff.area,
    bio: body.bio !== undefined ? body.bio.trim() : staff.bio,
    skills:
      body.skills !== undefined
        ? body.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : staff.skills,
    photoUrl,
  };

  if (staff.userId) {
    const uIdx = db.users.findIndex((u) => u.id === staff.userId);
    if (uIdx >= 0) {
      db.users[uIdx] = {
        ...db.users[uIdx],
        phone: db.staff[sIdx].phone,
        password: body.password?.trim()
          ? hashPassword(body.password.trim())
          : db.users[uIdx].password,
      };
    }
  }

  await writeDb(db);
  return NextResponse.json({ staff: db.staff[sIdx] });
}