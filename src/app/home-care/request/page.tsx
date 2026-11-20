import type { Metadata } from "next";
import { HomeCareRequestForm } from "@/components/marketing/HomeCareRequestForm";

export const metadata: Metadata = { title: "Request home care" };

export default function HomeCareRequestPage() {
  return <HomeCareRequestForm />;
}
