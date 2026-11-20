import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOps } from "@/lib/auth";
import { HomeCareRequestDetail } from "@/components/dashboard/HomeCareRequestDetail";
import { PageHeader } from "@/components/ui/PageHeader";
import { readDb } from "@/lib/db";
import { toHomeCareDTO } from "@/lib/enquiries";
import { can } from "@/lib/permissions";

export default async function HomeCareRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const user = await requireOps();
  const { id } = await Promise.resolve(params);
  const db = await readDb();
  const request = (db.homeCareRequests || []).map(toHomeCareDTO).find((row) => row.id === id);
  if (!request) notFound();

  const staff = db.staff.map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
  }));

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow={request.id}
        title={request.patientName}
        subtitle={`${request.service} · ${request.area}, ${request.city}`}
        action={
          <Link href="/dashboard/admin/home-care-requests" className="btn btn-outline btn-sm">
            All requests
          </Link>
        }
      />
      <HomeCareRequestDetail
        request={request}
        staff={staff}
        canConvert={can(user, "bookings.write") && can(user, "patients.write")}
      />
    </div>
  );
}
