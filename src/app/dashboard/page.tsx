import { redirect } from "next/navigation";
import { dashboardPathForRole, getSession } from "@/lib/auth";

export default async function DashboardIndexPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  redirect(dashboardPathForRole(user.role));
}