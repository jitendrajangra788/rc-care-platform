import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { buildNurseDesk, nursePatients } from "@/lib/nurse-desk";
import { NurseOverviewDashboard } from "@/components/dashboard/NurseOverviewDashboard";
import { NurseMobileDock } from "@/components/dashboard/NurseMobileDock";

export default async function NurseOverviewPage() {
  await requireRole("nurse");
  const user = await getSession();
  if (!user) return null;
  const db = await readDb();
  const desk = buildNurseDesk(db, user);
  const patients = nursePatients(db, user);
  const notifications = (db.activities || [])
    .filter(
      (a) =>
        !a.actorId ||
        a.actorId === user.id ||
        (a.href || "").includes("/nurse") ||
        (a.href || "").includes("/attendance"),
    )
    .slice(0, 6);

  return (
    <div className="dash-stack pb-20 md:pb-0">
      <NurseOverviewDashboard
        desk={desk}
        patientCount={patients.length}
        notifications={notifications}
      />
      <NurseMobileDock />
    </div>
  );
}
