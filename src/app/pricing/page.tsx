import { redirect } from "next/navigation";

/** Pricing page removed — send visitors to booking. */
export default function PricingPage() {
  redirect("/book");
}
