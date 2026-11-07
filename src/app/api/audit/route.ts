import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-guard";
import { readDb } from "@/lib/db";

export async function GET() {
  const auth = await requirePermission("audit.read");
  if ("error" in auth) return auth.error;
  const db = await readDb();
  return NextResponse.json({ auditLogs: db.auditLogs || [] });
}
