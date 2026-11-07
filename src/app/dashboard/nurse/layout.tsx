import { requireRole } from "@/lib/auth";

/** Nurse role gate — shell theme applied via `.nurse-ops` on DashboardShell. */
export default async function NurseLayout({ children }: { children: React.ReactNode }) {
  await requireRole("nurse");
  return children;
}
