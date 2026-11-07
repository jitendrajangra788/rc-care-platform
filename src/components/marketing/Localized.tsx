"use client";

import { pick, type LocalizedText } from "@/lib/marketing-content";
import { useLocale } from "@/lib/i18n";

export function Localized({
  text,
  as: Tag = "span",
  className,
}: {
  text: LocalizedText;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}) {
  const { locale } = useLocale();
  const Comp = Tag as "span";
  return <Comp className={className}>{pick(text, locale)}</Comp>;
}

export function useLocalizedText(text: LocalizedText) {
  const { locale } = useLocale();
  return pick(text, locale);
}
