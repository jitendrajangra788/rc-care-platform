import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await readDb();
  const items = (db.activities || []).slice(0, 40);
  const unread = items.filter((a) => !(a.readBy || []).includes(session.id)).length;

  return NextResponse.json({ activities: items, unread });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { markAllRead?: boolean; id?: string };
  const db = await readDb();
  if (!db.activities) db.activities = [];

  if (body.markAllRead) {
    db.activities = db.activities.map((a) => ({
      ...a,
      readBy: Array.from(new Set([...(a.readBy || []), session.id])),
    }));
  } else if (body.id) {
    db.activities = db.activities.map((a) =>
      a.id === body.id
        ? { ...a, readBy: Array.from(new Set([...(a.readBy || []), session.id])) }
        : a,
    );
  } else {
    return NextResponse.json({ error: "id or markAllRead required" }, { status: 400 });
  }

  await writeDb(db);
  return NextResponse.json({ ok: true });
}
