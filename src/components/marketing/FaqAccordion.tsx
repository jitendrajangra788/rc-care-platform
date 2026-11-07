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
    <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
      {items.map((f, i) => {
        const isOpen = open === i;
        const question = pick(f.q, locale);
        const answer = pick(f.a, locale);
        return (
          <div key={`${f.category}-${i}`}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 py-5 text-left transition hover:text-primary"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
            >
              <span className="font-display text-[15px] font-semibold tracking-tight text-heading md:text-base">
                {question}
              </span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted transition duration-300",
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
                <p className="pb-5 text-sm leading-relaxed text-muted md:text-[15px]">{answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
