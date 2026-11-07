import Link from "next/link";
import { ClipboardList, FileText, NotebookPen } from "lucide-react";
import { getSession, requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { buildNurseDesk } from "@/lib/nurse-desk";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/DashboardShell";
import { NurseMobileDock } from "@/components/dashboard/NurseMobileDock";
import { NurseNotesList } from "@/components/dashboard/NurseNotesList";
import { StatCard } from "@/components/ui/StatCard";

export default async function NurseNotesPage() {
  await requireRole("nurse");
  const user = await getSession();
  if (!user) return null;
  const db = await readDb();
  const desk = buildNurseDesk(db, user);
  const notes = desk.notes.map((n) => {
    const booking = db.bookings.find((b) => b.id === n.bookingId);
    return { ...n, patientName: booking?.patientName };
  });
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekNotes = notes.filter((n) => new Date(n.createdAt).getTime() >= weekAgo);
  const todayNotes = notes.filter(
    (n) => (n.createdAt || "").slice(0, 10) === desk.today,
  );

  return (
    <div className="dash-stack pb-20 md:pb-0">
      <PageHeader
        eyebrow="Nurse ops · Clinical"
        title="Care notes"
        subtitle="Vitals and shift notes you submitted for family visibility."
        action={
          <Link href="/dashboard/nurse/duties" className="btn btn-primary btn-sm">
            <ClipboardList className="h-3.5 w-3.5" /> Log from duties
          </Link>
        }
      />

      <div className="dash-grid-stats cols-3">
        <StatCard
          label="Today"
          value={String(todayNotes.length)}
          tone="primary"
          icon={<NotebookPen className="h-4 w-4" />}
        />
        <StatCard
          label="This week"
          value={String(weekNotes.length)}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard label="All notes" value={String(notes.length)} />
      </div>

      <Panel title="Note history" subtitle={`${notes.length} entries`}>
        <NurseNotesList notes={notes} />
      </Panel>
      <NurseMobileDock />
    </div>
  );
}
