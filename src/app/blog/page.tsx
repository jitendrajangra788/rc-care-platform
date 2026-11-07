import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { BlogIndexClient } from "@/components/marketing/BlogIndexClient";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Roshan Care guides — home nursing, elderly care, GPS attendance, and medicine safety for Bhilwara families.",
};

export default function BlogIndexPage() {
  return (
    <>
      <PageHero
        title="Care guides & insights"
        subtitle="Practical home-nursing notes for Bhilwara families — recovery, elderly safety, medicines, and trust systems."
        image="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=2000&q=80"
      />
      <BlogIndexClient />
      <SiteFooter />
    </>
  );
}
