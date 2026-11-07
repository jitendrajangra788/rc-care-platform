import { NextResponse } from "next/server";
import { getDbStoreInfo, readDb } from "@/lib/db";

/** Public-ish health probe so we can verify durable storage on Vercel. */
export async function GET() {
  const info = await getDbStoreInfo();
  let bookings = 0;
  let patients = 0;
  try {
    const db = await readDb();
    bookings = db.bookings?.length || 0;
    patients = db.patients?.length || 0;
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        ...info,
        error: err instanceof Error ? err.message : "read failed",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    ...info,
    bookings,
    patients,
    hint: info.durable
      ? "Storage is durable — add/update/delete should persist."
      : "Add Vercel KV: Storage → Create KV Database → connect to project (sets KV_REST_API_URL + KV_REST_API_TOKEN).",
  });
}
