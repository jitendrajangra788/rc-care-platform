import { requireRole } from "@/lib/auth";

export default async function FamilyLayout({ children }: { children: React.ReactNode }) {
  await requireRole("family");
  return children;
}