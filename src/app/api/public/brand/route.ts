import { NextResponse } from "next/server";
import { getPublicBrand } from "@/lib/public-brand";

export async function GET() {
  const brand = await getPublicBrand();
  return NextResponse.json(brand, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
