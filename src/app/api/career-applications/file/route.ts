import { NextResponse } from "next/server";
import { jsonError, requirePermission } from "@/lib/api-guard";
import { readDb } from "@/lib/db";
import { readPrivateUpload, safeDownloadName } from "@/lib/private-files";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requirePermission("enquiries.read");
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const fileId = url.searchParams.get("file");
  if (!id || !fileId) return jsonError("id and file are required");

  const db = await readDb();
  const row = (db.careerApplications || []).find((item) => item.id === id);
  const doc = row?.documents.find((item) => item.id === fileId);
  if (!row || !doc) return jsonError("Document not found", 404);

  try {
    const bytes = await readPrivateUpload("careers", doc);
    const name = safeDownloadName(doc.originalName);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": doc.mime || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return jsonError("Document not found", 404);
  }
}
