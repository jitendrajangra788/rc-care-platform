import { requireOps } from "@/lib/auth";
import { HomeCareRequestsManager } from "@/components/dashboard/HomeCareRequestsManager";
import { PageHeader } from "@/components/ui/PageHeader";
import { readDb } from "@/lib/db";
import { toHomeCareDTO } from "@/lib/enquiries";
import { can } from "@/lib/permissions";

export default async function HomeCareRequestsPage() {
  const user = await requireOps();
  const db = await readDb();
  const requests = (db.homeCareRequests || []).map(toHomeCareDTO);
  const staff = db.staff.map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
  }));

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="CRM & Enquiries"
        title="Home Care Requests"
        subtitle="Review family requests, record contact, assign staff, and convert a confirmed request into a booking."
      />
      <HomeCareRequestsManager
        requests={requests}
        staff={staff}
        canConvert={can(user, "bookings.write") && can(user, "patients.write")}
      />
    </div>
  );
}
