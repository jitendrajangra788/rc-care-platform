import { cn } from "@/lib/utils";
import { Badge, type BadgeTone } from "./Badge";

const statusTone: Record<string, BadgeTone> = {
  active: "success",
  available: "success",
  "on-duty": "success",
  completed: "success",
  paid: "success",
  pending: "warning",
  pause: "warning",
  paused: "warning",
  leave: "warning",
  new: "primary",
  assigned: "secondary",
  contacted: "secondary",
  qualified: "primary",
  cancelled: "danger",
  rejected: "danger",
  overdue: "danger",
  open: "danger",
  unpaid: "danger",
  partial: "warning",
  inactive: "neutral",
  converted: "success",
};

export function StatusBadge({
  status,
  className,
  label,
}: {
  status: string;
  className?: string;
  label?: string;
}) {
  const key = String(status || "").toLowerCase();
  const tone = statusTone[key] || "neutral";
  const text = label || status.replace(/-/g, " ");
  return (
    <Badge tone={tone} className={cn("capitalize", className)}>
      {text}
    </Badge>
  );
}
