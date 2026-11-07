import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-md)] bg-paper-2 px-3 py-4 text-center",
        className,
      )}
    >
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-primary">
        {icon ?? <Inbox className="h-3.5 w-3.5" aria-hidden />}
      </div>
      <h3 className="font-display mt-1.5 text-base text-heading">{title}</h3>
      {description ? (
        <p className="mt-0.5 max-w-sm text-xs leading-snug text-muted">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <Button className="mt-2" variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
