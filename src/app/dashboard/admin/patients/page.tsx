import { requireOps } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { PatientsManager } from "@/components/patients/PatientsManager";

export default async function AdminPatientsPage() {
  await requireOps();
  const db = await readDb();
  const familyUsers = db.users
    .filter((u) => u.role === "family")
    .map(({ password: _, ...safe }) => {
      void _;
      return safe;
    });

  const bookingCounts: Record<string, number> = {};
  for (const b of db.bookings) {
    if (b.patientId) {
      bookingCounts[b.patientId] = (bookingCounts[b.patientId] || 0) + 1;
      continue;
    }
    const hit = (db.patients || []).find(
      (p) =>
        p.phone.replace(/\s/g, "") === b.phone.replace(/\s/g, "") ||
        p.name.toLowerCase() === b.patientName.toLowerCase(),
    );
    if (hit) bookingCounts[hit.id] = (bookingCounts[hit.id] || 0) + 1;
  }

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="CRM"
        title="Patient directory"
        subtitle="Search, filter, and manage care profiles."
      />
      <PatientsManager
        patients={db.patients || []}
        familyUsers={familyUsers}
        bookingCounts={bookingCounts}
      />
    </div>
  );
}
