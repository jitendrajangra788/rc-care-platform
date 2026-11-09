import { SiteFooter } from "@/components/marketing/SiteFooter";
import { HomeExperience } from "@/components/marketing/HomeExperience";
import { getPublicBrand } from "@/lib/public-brand";

export default async function HomePage() {
  const brand = await getPublicBrand();
  return (
    <>
      <HomeExperience orgName={brand.orgName} logoUrl={brand.logoUrl} />
      <SiteFooter orgName={brand.orgName} logoUrl={brand.logoUrl} />
    </>
  );
}
