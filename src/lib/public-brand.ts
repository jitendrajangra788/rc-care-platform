import { defaultSettings } from "@/lib/defaults";
import { readDb } from "@/lib/db";

export type PublicBrand = {
  orgName: string;
  logoUrl: string;
  supportPhone: string;
  supportEmail: string;
  city: string;
  tagline: string;
};

export async function getPublicBrand(): Promise<PublicBrand> {
  const db = await readDb();
  const s = { ...defaultSettings, ...(db.settings || {}) };
  return {
    orgName: s.orgName || "Roshan Care",
    logoUrl: s.logoUrl || "",
    supportPhone: s.supportPhone || "+91 70732 31360",
    supportEmail: s.supportEmail || "care@roshancare.in",
    city: s.city || "Bhilwara",
    tagline: s.invoiceTagline || "Trusted Home Healthcare",
  };
}
