import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { staffForUser } from "@/lib/scope";
import { ProfileEditor } from "@/components/dashboard/ProfileEditor";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { NurseMobileDock } from "@/components/dashboard/NurseMobileDock";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function NurseProfilePage() {
  await requireRole("nurse");
  const user = await getSession();
  if (!user) return null;
  const db = await readDb();
  const staff = staffForUser(db, user);

  if (!staff) {
    return (
      <div className="dash-stack pb-20 md:pb-0">
        <PageHeader
          eyebrow="Nurse ops · Account"
          title="My profile"
          subtitle="Photo, contact details, skills, bio, and password."
        />
        <EmptyState
          title="Staff profile not linked"
          description="Ask admin to create or link your staff record to this login."
        />
        <NurseMobileDock />
      </div>
    );
  }

  return (
    <div className="dash-stack pb-20 md:pb-0">
      <PageHeader
        eyebrow="Nurse ops · Account"
        title="My profile"
        subtitle="Photo, contact details, skills, bio, and password — keep your desk identity current."
      />
      <ProfileEditor name={user.name} email={user.email} staff={staff} />
      <NurseMobileDock />
    </div>
  );
}
