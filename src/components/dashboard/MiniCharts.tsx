import { cn } from "@/lib/utils";

/** Simple CSS/SVG charts — no extra chart library */
export function BarChart({
  data,
  className,
  color = "var(--primary)",
}: {
  data: { label: string; value: number }[];
  className?: string;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={cn("flex h-36 items-end gap-2", className)}>
      {data.map((d) => (
        <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-28 w-full items-end justify-center">
            <div
              className="w-full max-w-[2.5rem] rounded-t-lg transition-all"
              style={{
                height: `${Math.max((d.value / max) * 100, d.value > 0 ? 8 : 2)}%`,
                background: color,
                opacity: d.value > 0 ? 1 : 0.25,
              }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
            {d.label}
          </p>
        </div>
      ))}
    </div>
  );
}

export function DonutStat({
  value,
  total,
  label,
  className,
}: {
  value: number;
  total: number;
  label: string;
  className?: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--surface-muted)" strokeWidth="10" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div>
        <p className="font-display text-2xl text-heading">{pct}%</p>
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-0.5 text-xs font-semibold text-heading">
          {value}/{total}
        </p>
      </div>
    </div>
  );
}
