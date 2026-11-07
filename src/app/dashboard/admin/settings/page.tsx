import { getSession, requireOps } from "@/lib/auth";
import { defaultSettings } from "@/lib/defaults";
import { getDbStoreInfo, readDb } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { Alert } from "@/components/ui/Alert";

export default async function AdminSettingsPage() {
  await requireOps();
  const user = await getSession();
  const db = await readDb();
  const store = await getDbStoreInfo();
  return (
    <div className="dash-stack">
      <PageHeader eyebrow="System" title="Settings" subtitle="Organization defaults for Roshan Care." />
      {store.durable ? (
        <Alert tone="success" title="Database storage is durable">
          Mode: {store.mode}
          {store.remote !== "none" ? ` · ${store.remote}` : ""}. Add / update / delete will persist on
          Vercel.
        </Alert>
      ) : (
        <Alert tone="warning" title="Vercel data will not persist yet">
          Add <strong>Vercel KV</strong> (Storage → Create KV Database → connect this project). That
          sets <code>KV_REST_API_URL</code> and <code>KV_REST_API_TOKEN</code>, then redeploy. Check{" "}
          <code>/api/health/db</code> after.
        </Alert>
      )}
      <SettingsForm
        settings={{ ...defaultSettings, ...(db.settings || {}) }}
        canWrite={can(user, "settings.write")}
      />
    </div>
  );
}
