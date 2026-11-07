import { NextResponse } from "next/server";
import { getDbStoreInfo, readDb } from "@/lib/db";
import { remoteEnvFlags } from "@/lib/db-remote";

/** Public-ish health probe so we can verify durable storage on Vercel. */
export async function GET() {
  const info = await getDbStoreInfo();
  const env = remoteEnvFlags();
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
        env,
        error: err instanceof Error ? err.message : "read failed",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    ...info,
    env,
    bookings,
    patients,
    hint: info.durable
      ? "Storage is durable — add/update/delete should persist."
      : env.ready
        ? "KV env present but store did not switch to remote — check server logs."
        : "KV env missing at runtime. In Vercel → Project → Settings → Environment Variables, confirm KV_REST_API_URL + KV_REST_API_TOKEN for Production, then Redeploy.",
  });
}
