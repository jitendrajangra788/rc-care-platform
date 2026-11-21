"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ViewToggle<T extends string>({
  value,
  onChange,
  options,
  label = "View",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string; icon: LucideIcon }[];
  label?: string;
}) {
  return (
    <div className="inline-flex items-center gap-1.5" role="group" aria-label={label}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-label={opt.label}
            aria-pressed={active}
            title={opt.label}
            onClick={() => onChange(opt.id)}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
              active
                ? "border-primary bg-primary text-white shadow-[0_8px_18px_-8px_rgba(8,127,140,0.9)]"
                : "border-[#e4ebf2] bg-white text-[#243447] shadow-sm hover:border-[#c5d0dc] hover:bg-[#f7fafc]",
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </button>
        );
      })}
    </div>
  );
}
