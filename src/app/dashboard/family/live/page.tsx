import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FamilyLiveCare } from "@/components/dashboard/FamilyLiveCare";

export default async function FamilyLivePage() {
  const user = await getSession();
  const db = await readDb();
  const bookings = db.bookings.filter((b) => b.familyUserId === user?.id);
  const ids = new Set(bookings.map((b) => b.id));

  return (
    <div className="dash-stack">
      <PageHeader
        eyebrow="Family portal"
        title="Live care"
        subtitle="Duty status from saved check-ins, site photos, medicine, vitals, billing, and emergency SOS."
      />
      <FamilyLiveCare
        bookings={bookings}
        staff={db.staff}
        attendance={db.attendance.filter((a) => ids.has(a.bookingId))}
        notes={db.careNotes.filter((n) => ids.has(n.bookingId))}
        medications={db.medications.filter((m) => ids.has(m.bookingId))}
        schedules={db.medSchedules.filter((m) => ids.has(m.bookingId))}
        invoices={db.invoices.filter((i) => ids.has(i.bookingId))}
      />
    </div>
  );
}
