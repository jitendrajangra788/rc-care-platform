import type { Metadata } from "next";
import { CareerApplyForm } from "@/components/marketing/CareerApplyForm";

export const metadata: Metadata = { title: "Apply for a job" };

export default function CareerApplyPage() {
  return <CareerApplyForm />;
}
