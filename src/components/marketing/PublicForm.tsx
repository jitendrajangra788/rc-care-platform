import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormSection({
  title,
  children,
  cols = 2,
}: {
  title: string;
  children: React.ReactNode;
  cols?: 2 | 3;
}) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-white px-3 py-3 sm:px-3.5">
      <h2 className="text-[13px] font-semibold text-[#172D3A]">{title}</h2>
      <div className={cn("mt-2.5 grid gap-2.5", cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {children}
      </div>
    </section>
  );
}

export function Honeypot() {
  return (
    <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function ReferencePanel({
  title,
  reference,
  children,
}: {
  title: string;
  reference: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-[var(--line)] bg-white p-6 text-center sm:p-8">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#DDF5EC] text-[#087F8C]">
        <CheckCircle2 className="h-6 w-6" />
      </span>
      <h2 className="font-display mt-4 text-2xl text-[#172D3A]">{title}</h2>
      <p className="mt-2 text-sm text-muted">Reference number</p>
      <p className="font-display mt-1 text-3xl tracking-tight text-[#087F8C]">{reference}</p>
      <div className="mt-4 space-y-2 text-sm leading-relaxed text-muted">{children}</div>
      <Link href="/" className="btn btn-primary mt-6 inline-flex">
        Back to home
      </Link>
    </div>
  );
}

export const fileAccept = ".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png";

export function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected file"));
    reader.readAsDataURL(file);
  });
}

export async function optionalFile(input: HTMLInputElement | null, label: string, required = false) {
  const file = input?.files?.[0];
  if (!file) {
    if (required) throw new Error(`${label} is required`);
    return null;
  }
  if (file.size > 2 * 1024 * 1024) throw new Error(`${label} must be 2 MB or smaller`);
  return { label, name: file.name, dataUrl: await readAsDataUrl(file) };
}
