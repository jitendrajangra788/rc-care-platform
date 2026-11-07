import { getSession, requireOps } from "@/lib/auth";
import { defaultSettings } from "@/lib/defaults";
import { readDb } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export default async function AdminSettingsPage() {
  await requireOps();
  const user = await getSession();
  const db = await readDb();
  return (
    <div className="dash-stack">
      <PageHeader eyebrow="System" title="Settings" subtitle="Organization defaults for Roshan Care." />
      <SettingsForm
        settings={{ ...defaultSettings, ...(db.settings || {}) }}
        canWrite={can(user, "settings.write")}
      />
    </div>
  );
}
