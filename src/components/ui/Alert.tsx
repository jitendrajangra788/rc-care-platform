import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertTone = "info" | "success" | "warning" | "danger";

const toneClass: Record<AlertTone, string> = {
  info: "border-[var(--info)]/20 bg-[var(--info-soft)] text-primary",
  success: "border-success/20 bg-[var(--success-soft)] text-success",
  warning: "border-warning/25 bg-[var(--warning-soft)] text-warning",
  danger: "border-danger/25 bg-[var(--danger-soft)] text-danger",
};

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const Icon = icons[tone];
  return (
    <div
      role="status"
      className={cn(
        "flex gap-3 rounded-[var(--radius-lg)] border px-4 py-3.5 text-sm",
        toneClass[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title ? <p className="font-semibold text-heading">{title}</p> : null}
        {children ? (
          <div className={cn(title ? "mt-1 text-muted" : "")}>{children}</div>
        ) : null}
      </div>
    </div>
  );
}
