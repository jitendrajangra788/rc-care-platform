import { cn } from "@/lib/utils";

export type IconBadgeTone = "primary" | "secondary" | "accent" | "success" | "warning" | "danger";

const toneClass: Record<IconBadgeTone, string> = {
  primary: "bg-[var(--primary-soft)] text-primary",
  secondary: "bg-secondary text-primary-deep",
  accent: "bg-[var(--accent-soft)] text-accent",
  success: "bg-[var(--success-soft)] text-success",
  warning: "bg-[var(--warning-soft)] text-warning",
  danger: "bg-[var(--danger-soft)] text-danger",
};

export function IconBadge({
  tone = "primary",
  size = "md",
  className,
  children,
}: {
  tone?: IconBadgeTone;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-[var(--radius-md)]",
        size === "sm" && "h-8 w-8",
        size === "md" && "h-10 w-10",
        size === "lg" && "h-12 w-12 rounded-[var(--radius-lg)]",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
