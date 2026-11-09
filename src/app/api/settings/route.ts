import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-guard";
import { pushAudit } from "@/lib/audit";
import { defaultSettings } from "@/lib/defaults";
import { readDb, saveDataUrlImage, writeDb } from "@/lib/db";
import { parseBody, settingsSchema } from "@/lib/validation";

async function resolveLogoUrl(
  next: string | undefined,
  prev: string | undefined,
): Promise<string> {
  if (next === undefined) return prev || "";
  if (!next) return "";
  if (next.startsWith("/uploads/")) return next;
  if (next.startsWith("data:image/")) {
    try {
      return await saveDataUrlImage(next, "branding", "org-logo");
    } catch (err) {
      console.error("[settings] logo save failed", err);
      throw new Error("Could not save logo image");
    }
  }
  // Reject random remote URLs — keep relative upload paths only
  if (next.startsWith("http://") || next.startsWith("https://")) {
    return next.slice(0, 500);
  }
  return prev || "";
}

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
  const prev = { ...defaultSettings, ...(db.settings || {}) };

  let logoUrl = prev.logoUrl || "";
  try {
    logoUrl = await resolveLogoUrl(parsed.data.logoUrl, prev.logoUrl);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Logo save failed" },
      { status: 400 },
    );
  }

  db.settings = {
    ...prev,
    ...parsed.data,
    supportEmail:
      parsed.data.supportEmail !== undefined
        ? parsed.data.supportEmail || prev.supportEmail
        : prev.supportEmail,
    logoUrl,
    updatedAt: new Date().toISOString(),
  };
  pushAudit(db, {
    action: "settings.update",
    entity: "settings",
    detail: logoUrl ? "Settings updated (logo set)" : "Application settings updated",
    actorId: auth.user.id,
    actorName: auth.user.name,
  });
  await writeDb(db);
  return NextResponse.json({ settings: db.settings });
}
