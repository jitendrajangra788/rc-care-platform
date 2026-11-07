import { readDb } from "@/lib/db";
import { BookingsWorkspace } from "@/components/dashboard/BookingsWorkspace";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams?:
    | Promise<{ patientId?: string; q?: string }>
    | { patientId?: string; q?: string };
}) {
  const db = await readDb();
  const params = await Promise.resolve(searchParams);
  const familyUsers = db.users
    .filter((u) => u.role === "family")
    .map(({ password: _, ...safe }) => {
      void _;
      return safe;
    });

  return (
    <BookingsWorkspace
      bookings={db.bookings}
      staff={db.staff}
      locations={db.careLocations || []}
      patients={db.patients || []}
      familyUsers={familyUsers}
      initialPatientId={params?.patientId}
      initialQuery={params?.q}
    />
  );
}
