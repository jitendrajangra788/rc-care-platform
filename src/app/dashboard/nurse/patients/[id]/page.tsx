import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { patientIdsForUser, staffForUser } from "@/lib/scope";
import { formatPhone } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { NurseMobileDock } from "@/components/dashboard/NurseMobileDock";
import { NursePatientChart } from "@/components/dashboard/NursePatientChart";

export default async function NursePatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams?: Promise<{ tab?: string }> | { tab?: string };
}) {
  await requireRole("nurse");
  const user = await getSession();
  if (!user) return null;
  const { id } = await Promise.resolve(params);
  const sp = await Promise.resolve(searchParams || {});
  const initialTab = typeof sp.tab === "string" ? sp.tab : undefined;
  const db = await readDb();
  const allowed = patientIdsForUser(db, user);
  if (!allowed.has(id)) notFound();

  const patient = (db.patients || []).find((p) => p.id === id);
  if (!patient) notFound();

  const staff = staffForUser(db, user);
  const bookings = db.bookings
    .filter((b) => b.assignedStaffId === staff?.id && b.patientId === id)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  const active = bookings.find((b) => b.status === "active" || b.status === "assigned");
  const bookingIds = new Set(bookings.map((b) => b.id));

  const notes = db.careNotes
    .filter((n) => n.nurseId === user.id && bookingIds.has(n.bookingId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const plans = (db.carePlans || []).filter((p) => p.patientId === id);

  const reports = (db.careReports || [])
    .filter((r) => r.patientId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const vitals = (db.vitals || [])
    .filter((v) => v.patientId === id)
    .sort((a, b) => (b.recordedAt || b.createdAt).localeCompare(a.recordedAt || a.createdAt));

  const meds = (db.medications || [])
    .filter((m) => bookingIds.has(m.bookingId) || m.patientName === patient.name)
    .sort((a, b) => b.timeGiven.localeCompare(a.timeGiven));

  const doctorNotes = (db.doctorNotes || [])
    .filter((n) => bookingIds.has(n.bookingId) || n.patientName === patient.name)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="dash-stack max-w-[1400px] pb-20 md:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PageHeader
          eyebrow="Clinical chart · Assigned care only"
          title={patient.name}
          subtitle={`${formatPhone(patient.phone)}${patient.area ? ` · ${patient.area}` : ""} · hospital workstation`}
        />
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/nurse/reports" className="btn btn-outline btn-sm">
            <FileText className="h-3.5 w-3.5" /> All reports
          </Link>
          <Link href="/dashboard/nurse/patients" className="btn btn-outline btn-sm">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to worklist
          </Link>
        </div>
      </div>

      <NursePatientChart
        patient={patient}
        bookings={bookings}
        active={active}
        reports={reports}
        notes={notes}
        plans={plans}
        vitals={vitals}
        meds={meds}
        doctorNotes={doctorNotes}
        initialTab={initialTab}
      />

      <NurseMobileDock />
    </div>
  );
}
