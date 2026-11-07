import { cn } from "@/lib/utils";

export function NurseStatusPill({
  label,
  ok,
  compact,
}: {
  label: string;
  ok: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-full font-semibold",
        compact ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        ok
          ? "bg-[var(--success-soft)] text-success"
          : "bg-paper-2 text-muted",
      )}
    >
      {label} {ok ? "done" : "open"}
    </span>
  );
}
