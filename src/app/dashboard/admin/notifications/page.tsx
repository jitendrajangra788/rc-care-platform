import { getSession, requireOps } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AuditLogPanel } from "@/components/dashboard/AuditLogPanel";
import { NotificationsPanel } from "@/components/dashboard/NotificationsPanel";

export default async function AdminNotificationsPage() {
  await requireOps();
  const user = await getSession();
  const db = await readDb();
  const notifications = (db.notifications || []).filter((n) => n.userId === user?.id);
  return (
    <div className="dash-stack">
      <PageHeader eyebrow="Inbox" title="Notifications" subtitle="Your care desk alerts." />
      <NotificationsPanel notifications={notifications} />
      <AuditLogPanel />
    </div>
  );
}
