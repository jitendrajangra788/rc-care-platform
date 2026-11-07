import { Syringe, ClipboardList, Pill } from "lucide-react";
import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { buildNurseDesk } from "@/lib/nurse-desk";
import { medicationsForUser } from "@/lib/scope";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { MedicationPanel } from "@/components/dashboard/MedicationPanel";
import { NurseMobileDock } from "@/components/dashboard/NurseMobileDock";
import { StatCard } from "@/components/ui/StatCard";

export default async function NurseMedicationsPage() {
  await requireRole("nurse");
  const user = await getSession();
  if (!user) return null;
  const db = await readDb();
  const desk = buildNurseDesk(db, user);
  // Only this nurse's MAR entries — never other nurses' chart lines
  const logs = medicationsForUser(db, user);

  return (
    <div className="dash-stack pb-20 md:pb-0">
      <PageHeader
        eyebrow="Nurse ops · Clinical"
        title="Medicine"
        subtitle={`Your medicine chart only · ${user.name}. Admin can see every nurse’s entries.`}
      />
      <div className="dash-grid-stats cols-3">
        <StatCard
          label="Active duties"
          value={String(desk.activeDuties.length)}
          tone="primary"
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatCard
          label="Pending today"
          value={String(desk.pendingMedDuties)}
          tone={desk.pendingMedDuties ? "warning" : "success"}
          icon={<Pill className="h-4 w-4" />}
        />
        <StatCard
          label="My logged entries"
          value={String(logs.length)}
          icon={<Syringe className="h-4 w-4" />}
        />
      </div>
      <MedicationPanel duties={desk.activeDuties} logs={logs} />
      <NurseMobileDock />
    </div>
  );
}
