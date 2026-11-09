import { redirect } from "next/navigation";
import { requireOps } from "@/lib/auth";

/** Legacy path → clean print sheet (no dashboard chrome). */
export default async function AdminInvoicePrintRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  await requireOps();
  const { id } = await Promise.resolve(params);
  const sp = await Promise.resolve(searchParams || {});
  const auto = sp.auto === "1" || sp.auto === "true" ? "1" : "0";
  const back = encodeURIComponent("/dashboard/admin/billing");
  redirect(`/print/invoice/${encodeURIComponent(id)}?auto=${auto}&back=${back}`);
}
