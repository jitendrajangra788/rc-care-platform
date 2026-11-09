import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { ContactCallbackSection } from "@/components/marketing/ContactCallbackSection";
import { getPublicBrand } from "@/lib/public-brand";

export const metadata: Metadata = {
  title: "Contact — Home Nurse Callback",
  description:
    "Contact Roshan Care Bhilwara for home nurse, elderly care, and 12/24 hour shifts. Call 70732 31360 or request a callback.",
};

export default async function ContactPage() {
  const brand = await getPublicBrand();
  return (
    <>
      <SiteHeader tone="light" orgName={brand.orgName} logoUrl={brand.logoUrl} />
      <ContactCallbackSection />
      <SiteFooter orgName={brand.orgName} logoUrl={brand.logoUrl} />
    </>
  );
}
