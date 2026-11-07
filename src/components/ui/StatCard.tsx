import { cn } from "@/lib/utils";

const tones = {
  default: "bg-surface",
  primary: "bg-[var(--primary-soft)]",
  success: "bg-[var(--success-soft)]",
  warning: "bg-[var(--warning-soft)]",
  danger: "bg-[var(--danger-soft)]",
  info: "bg-[var(--info-soft)]",
} as const;

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: keyof typeof tones;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "soft-panel rounded-[var(--radius-md)] border border-[var(--line)] p-2 shadow-[var(--shadow-xs)]",
        tones[tone],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        {icon ? <span className="scale-90 text-primary">{icon}</span> : null}
      </div>
      <p className="font-display mt-0.5 text-lg font-semibold tracking-tight text-heading md:text-xl">
        {value}
      </p>
      {hint ? <p className="mt-0 text-[10px] text-muted">{hint}</p> : null}
    </div>
  );
}
