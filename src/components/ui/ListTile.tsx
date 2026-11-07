import { cn } from "@/lib/utils";

export function ListTile({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <article className={cn("list-tile", className)} {...props}>
      {children}
    </article>
  );
}

export function ListTileHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-wrap items-start justify-between gap-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ListTileMeta({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1 text-sm text-muted", className)} {...props}>
      {children}
    </p>
  );
}
