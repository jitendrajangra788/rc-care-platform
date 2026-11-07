import Link from "next/link";
import {
  Activity,
  CreditCard,
  HeartPulse,
  PlusCircle,
  Radio,
  Syringe,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { dutyProgress, todayDutyDate } from "@/lib/duty";
import { formatINR } from "@/lib/utils";
import { Panel, StatCard } from "@/components/dashboard/DashboardShell";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListTile, ListTileHeader, ListTileMeta } from "@/components/ui/ListTile";

export default async function FamilyDashboardPage() {
  const user = await getSession();
  const db = await readDb();
  const today = todayDutyDate();
  const bookings = db.bookings.filter((b) => b.familyUserId === user?.id);
  const bookingIds = new Set(bookings.map((b) => b.id));
  const notes = db.careNotes.filter((n) => bookingIds.has(n.bookingId));
  const invoices = db.invoices.filter((i) => bookingIds.has(i.bookingId));
  const outstanding = invoices.reduce((s, i) => s + (i.amount - i.paid), 0);
  const active = bookings.filter((b) => b.status === "active" || b.status === "assigned");
  const primary = active[0] || bookings[0];
  const nurse = primary
    ? db.staff.find((s) => s.id === primary.assignedStaffId)
    : undefined;
  const progress = primary ? dutyProgress(db.attendance, primary.id, today) : null;
  const latestNote = notes[0];

  return (
    <div className="dash-stack pb-24 md:pb-0">
      <PageHeader
        eyebrow="Family care portal"
        title="Care overview"
        subtitle="See your loved one’s nurse, today’s duty status, updates, and billing at a glance."
        action={
          <Link href="/book" className="btn btn-primary hidden sm:inline-flex">
            <PlusCircle className="h-4 w-4" /> Request more care
          </Link>
        }
      />

      <div className="dash-grid-stats cols-3">
        <StatCard
          label="Active bookings"
          value={String(bookings.filter((b) => b.status === "active").length)}
          tone="primary"
        />
        <StatCard label="Care notes" value={String(notes.length)} />
        <StatCard
          label="Amount due"
          value={formatINR(outstanding)}
          tone={outstanding > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { href: "/dashboard/family/live", label: "Live care", icon: Radio },
          { href: "/dashboard/family/updates", label: "Updates", icon: Activity },
          { href: "/dashboard/family/medications", label: "Medicine", icon: Syringe },
          { href: "/dashboard/family/billing", label: "Billing", icon: CreditCard },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="soft-panel flex min-h-[4.5rem] flex-col items-start justify-center gap-2 rounded-[var(--radius-xl)] p-4 transition hover:bg-paper-2"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-heading">{a.label}</span>
            </Link>
          );
        })}
      </div>

      {primary ? (
        <section className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-[#0d2130] p-2.5 text-white md:p-3">
          <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative">
            <p className="text-label text-[var(--secondary-deep)]">Patient overview · {today}</p>
            <h2 className="font-name mt-2 text-3xl tracking-[-0.02em]">{primary.patientName}</h2>
            <p className="mt-2 text-sm text-white/65">
              {primary.careType} · {primary.shift} · {primary.address}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-2xl bg-white/8 px-2.5 py-2">
                <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-white/15 text-sm font-semibold">
                  {nurse?.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={nurse.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (nurse?.name || "?").slice(0, 1)
                  )}
                </div>
                <div>
                  <p className="text-xs text-white/55">Assigned nurse</p>
                  <p className="font-name text-lg">{nurse?.name || "Assigning soon"}</p>
                  <p className="text-xs text-white/55">{nurse?.role || "Pending assignment"}</p>
                </div>
              </div>
              <Badge tone={primary.status === "active" ? "success" : "primary"} className="!normal-case">
                {primary.status}
              </Badge>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <CareStatus label="Morning present" ok={Boolean(progress?.morningDone)} />
              <CareStatus label="Evening present" ok={Boolean(progress?.eveningDone)} />
              <CareStatus label="Duty complete today" ok={Boolean(progress?.complete)} />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link href="/dashboard/family/live" className="btn btn-primary">
                <HeartPulse className="h-4 w-4" /> Open live care
              </Link>
              <Link href="/book" className="btn btn-outline !border-white/20 !text-white hover:!bg-white/10">
                Request additional care
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <Panel title="Care bookings" subtitle="All bookings linked to your family account.">
        {bookings.length === 0 ? (
          <div className="space-y-2">
            <EmptyState
              title="No bookings yet"
              description="Request nursing care to start tracking your loved one’s duty status."
            />
            <div className="flex justify-center">
              <Link href="/book" className="btn btn-primary">
                Request care
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {bookings.map((b) => {
              const s = db.staff.find((x) => x.id === b.assignedStaffId);
              return (
                <ListTile key={b.id} className="animate-dash-in">
                  <ListTileHeader>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-name text-lg text-heading">{b.patientName}</p>
                        <Badge
                          tone={
                            b.status === "active"
                              ? "success"
                              : b.status === "pending"
                                ? "warning"
                                : "primary"
                          }
                        >
                          {b.status}
                        </Badge>
                      </div>
                      <ListTileMeta>
                        {b.careType} · {b.shift} · Start {b.startDate}
                      </ListTileMeta>
                      <p className="mt-2 text-sm text-heading">
                        Nurse: {s?.name || "Assigning soon"}
                        {s?.phone ? ` · ${s.phone}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-primary">{formatINR(b.amount)}/day</p>
                  </ListTileHeader>
                </ListTile>
              );
            })}
          </div>
        )}
      </Panel>

      {latestNote ? (
        <Panel
          title="Latest family update"
          action={
            <Link href="/dashboard/family/updates" className="btn btn-ghost btn-sm">
              All updates
            </Link>
          }
        >
          <p className="text-sm text-muted">
            {latestNote.bookingId} · {new Date(latestNote.createdAt).toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-sm text-muted">
            BP {latestNote.vitals.bp || "—"} · Sugar {latestNote.vitals.sugar || "—"} · Pulse{" "}
            {latestNote.vitals.pulse || "—"}
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-heading">{latestNote.notes}</p>
        </Panel>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-surface/95 px-3 py-2.5 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-[1200px] grid-cols-3 gap-2">
          <Link href="/dashboard/family/live" className="btn btn-primary btn-sm justify-center">
            Live
          </Link>
          <Link href="/dashboard/family/billing" className="btn btn-outline btn-sm justify-center">
            Billing
          </Link>
          <Link href="/book" className="btn btn-outline btn-sm justify-center">
            Request
          </Link>
        </div>
      </div>
    </div>
  );
}

function CareStatus({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`rounded-2xl px-2.5 py-2 ${ok ? "bg-primary/20" : "bg-white/8"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">{label}</p>
      <p className="mt-1 text-sm font-semibold">{ok ? "Done" : "Waiting"}</p>
    </div>
  );
}
