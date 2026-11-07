import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn("mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14", className)}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? <p className="text-label text-primary">{eyebrow}</p> : null}
      <h2
        className={cn(
          "font-display text-display-lg text-heading",
          eyebrow ? "mt-2" : "",
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1.5 text-base leading-relaxed text-muted md:text-lg">{subtitle}</p>
      ) : null}
    </div>
  );
}
