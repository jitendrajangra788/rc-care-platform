import { requireOps } from "@/lib/auth";
import { CareerApplicationsManager } from "@/components/dashboard/CareerApplicationsManager";
import { PageHeader } from "@/components/ui/PageHeader";
import { readDb } from "@/lib/db";
import { toCareerDTO } from "@/lib/enquiries";
import { can } from "@/lib/permissions";

export default async function CareerApplicationsPage() {
  const user = await requireOps();
  const db = await readDb();

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="CRM & Enquiries"
        title="Career Applications"
        subtitle="Review applicants, schedule interviews, and add a selected person to staff only after verification."
      />
      <CareerApplicationsManager
        applications={(db.careerApplications || []).map(toCareerDTO)}
        canHire={can(user, "staff.write")}
      />
    </div>
  );
}
