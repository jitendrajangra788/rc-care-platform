import { notFound } from "next/navigation";
import { requireOps } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PatientDetailView } from "@/components/patients/PatientDetailView";

export default async function AdminPatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  await requireOps();
  const { id } = await Promise.resolve(params);
  const db = await readDb();
  const patient = (db.patients || []).find((p) => p.id === id);
  if (!patient) notFound();

  const bookings = db.bookings.filter(
    (b) =>
      b.patientId === patient.id ||
      b.phone.replace(/\s/g, "") === patient.phone.replace(/\s/g, "") ||
      b.patientName.toLowerCase() === patient.name.toLowerCase(),
  );
  const bookingIds = new Set(bookings.map((b) => b.id));
  const carePlans = (db.carePlans || []).filter((p) => p.patientId === patient.id);
  const vitals = (db.vitals || []).filter((v) => v.patientId === patient.id);
  const invoices = db.invoices.filter(
    (i) =>
      bookingIds.has(i.bookingId) ||
      i.patientName.toLowerCase() === patient.name.toLowerCase(),
  );
  const familyUsers = db.users
    .filter((u) => u.role === "family")
    .map(({ password: _, ...safe }) => {
      void _;
      return safe;
    });

  return (
    <PatientDetailView
      patient={patient}
      bookings={bookings}
      carePlans={carePlans}
      vitals={vitals}
      invoices={invoices}
      familyUsers={familyUsers}
    />
  );
}
