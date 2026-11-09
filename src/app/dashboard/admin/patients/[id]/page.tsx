import { notFound } from "next/navigation";
import { requireOps } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { normalizeRole } from "@/lib/permissions";
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
  const vitals = (db.vitals || [])
    .filter((v) => v.patientId === patient.id)
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  const careReports = (db.careReports || [])
    .filter((r) => r.patientId === patient.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const invoices = db.invoices.filter(
    (i) =>
      bookingIds.has(i.bookingId) ||
      i.patientName.toLowerCase() === patient.name.toLowerCase(),
  );
  const invoiceIds = new Set(invoices.map((i) => i.id));
  const payments = (db.payments || [])
    .filter((p) => invoiceIds.has(p.invoiceId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const medications = (db.medications || [])
    .filter((m) => bookingIds.has(m.bookingId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const medSchedules = (db.medSchedules || []).filter((m) => bookingIds.has(m.bookingId));
  const doctorNotes = (db.doctorNotes || [])
    .filter((n) => bookingIds.has(n.bookingId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const attendance = (db.attendance || [])
    .filter((a) => bookingIds.has(a.bookingId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const staffById = Object.fromEntries(db.staff.map((s) => [s.id, s]));
  const assignedNurseIds = [
    ...new Set(bookings.map((b) => b.assignedStaffId).filter(Boolean) as string[]),
  ];
  const assignedNurses = assignedNurseIds
    .map((sid) => staffById[sid])
    .filter(Boolean)
    .map((s) => ({ id: s.id, name: s.name, phone: s.phone, role: s.role }));

  const linkedUserIds = new Set<string>([
    ...(patient.familyUserIds || []),
    ...(patient.userId ? [patient.userId] : []),
  ]);
  const familyContacts = db.users
    .filter((u) => linkedUserIds.has(u.id))
    .map(({ password: _, ...safe }) => {
      void _;
      return { ...safe, role: normalizeRole(safe.role) };
    });

  const portalRaw = patient.userId
    ? db.users.find((u) => u.id === patient.userId)
    : undefined;
  const portalUser = portalRaw
    ? (() => {
        const { password: _, ...safe } = portalRaw;
        void _;
        return { ...safe, role: normalizeRole(safe.role) };
      })()
    : null;

  const nameLower = patient.name.toLowerCase();
  const activities = (db.activities || [])
    .filter((a) => {
      const blob = `${a.title} ${a.detail || ""} ${a.href || ""}`.toLowerCase();
      if (blob.includes(patient.id.toLowerCase()) || blob.includes(nameLower)) return true;
      if (a.href && bookingIds.size && [...bookingIds].some((bid) => a.href!.includes(bid))) {
        return true;
      }
      return false;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 40);

  const auditTrail = (db.auditLogs || [])
    .filter((a) => {
      const blob = `${a.action} ${a.entity} ${a.detail || ""}`.toLowerCase();
      return blob.includes(patient.id.toLowerCase()) || blob.includes(nameLower);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);

  const documentAttachments = careReports
    .filter((r) => r.attachmentUrl)
    .map((r) => ({
      id: `att-${r.id}`,
      title: r.attachmentName || "Care report attachment",
      category: "Medical Reports" as const,
      fileUrl: r.attachmentUrl!,
      uploadedBy: r.createdByName,
      uploadedAt: r.createdAt,
      fileType: guessFileType(r.attachmentUrl!, r.attachmentName),
    }));

  return (
    <PatientDetailView
      patient={patient}
      bookings={bookings}
      carePlans={carePlans}
      vitals={vitals}
      careReports={careReports}
      invoices={invoices}
      payments={payments}
      medications={medications}
      medSchedules={medSchedules}
      doctorNotes={doctorNotes}
      attendance={attendance}
      assignedNurses={assignedNurses}
      familyContacts={familyContacts}
      portalUser={portalUser}
      activities={activities}
      auditTrail={auditTrail}
      documents={documentAttachments}
      staffById={Object.fromEntries(
        db.staff.map((s) => [s.id, { id: s.id, name: s.name, phone: s.phone }]),
      )}
    />
  );
}

function guessFileType(url: string, name?: string) {
  const src = (name || url).toLowerCase();
  if (src.includes(".pdf")) return "PDF";
  if (src.match(/\.(png|jpe?g|webp|gif)$/)) return "Image";
  if (src.match(/\.(doc|docx)$/)) return "Document";
  return "File";
}
