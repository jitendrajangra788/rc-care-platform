"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { pick, type FaqItem } from "@/lib/marketing-content";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function FaqAccordion({
  items,
  defaultOpen = 0,
}: {
  items: FaqItem[];
  defaultOpen?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { locale } = useLocale();

  return (
    <div className="divide-y divide-[var(--line)]">
      {items.map((f, i) => {
        const isOpen = open === i;
        const question = pick(f.q, locale);
        const answer = pick(f.a, locale);
        return (
          <div key={`${f.category}-${i}`}>
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 py-3.5 text-left transition hover:text-primary sm:items-center sm:gap-4 sm:py-4"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
            >
              <span className="min-w-0 text-[13px] font-semibold leading-snug tracking-tight text-heading sm:text-[15px]">
                {question}
              </span>
              <ChevronDown
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0 text-muted transition duration-300 sm:mt-0 sm:h-5 sm:w-5",
                  isOpen && "rotate-180 text-primary",
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="pb-3.5 text-[13px] leading-relaxed text-muted sm:pb-4 sm:text-sm">
                  {answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
