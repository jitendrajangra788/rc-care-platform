import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? <p className="text-label text-primary">{eyebrow}</p> : null}
        <h1
          className={cn(
            "font-display text-display-lg text-heading",
            eyebrow ? "mt-0" : "",
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 max-w-2xl text-xs leading-snug text-muted sm:text-sm">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-1.5 sm:w-auto [&_.btn]:w-full sm:[&_.btn]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}
