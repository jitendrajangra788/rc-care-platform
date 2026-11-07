import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-guard";
import { pushAudit } from "@/lib/audit";
import { defaultSettings } from "@/lib/defaults";
import { readDb, writeDb } from "@/lib/db";
import { parseBody, settingsSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requirePermission("settings.read");
  if ("error" in auth) return auth.error;
  const db = await readDb();
  return NextResponse.json({ settings: { ...defaultSettings, ...(db.settings || {}) } });
}

export async function PATCH(req: Request) {
  const auth = await requirePermission("settings.write");
  if ("error" in auth) return auth.error;
  const parsed = parseBody(settingsSchema, await req.json().catch(() => null));
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error || "Invalid" }, { status: 400 });
  }
  const db = await readDb();
  db.settings = {
    ...defaultSettings,
    ...(db.settings || {}),
    ...parsed.data,
    supportEmail: parsed.data.supportEmail || db.settings?.supportEmail || defaultSettings.supportEmail,
    updatedAt: new Date().toISOString(),
  };
  pushAudit(db, {
    action: "settings.update",
    entity: "settings",
    detail: "Application settings updated",
    actorId: auth.user.id,
    actorName: auth.user.name,
  });
  await writeDb(db);
  return NextResponse.json({ settings: db.settings });
}
