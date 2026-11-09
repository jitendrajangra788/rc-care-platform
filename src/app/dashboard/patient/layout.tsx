import { redirect } from "next/navigation";

/** Patient portal merged into family — one home-care desk. */
export default function PatientLayout({ children }: { children: React.ReactNode }) {
  void children;
  redirect("/dashboard/family");
}
