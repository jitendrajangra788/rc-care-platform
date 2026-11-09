"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { colors } from "@/lib/design-tokens";
import { formatCurrency } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";

export type RevenuePoint = {
  month: string;
  billed: number;
  collected: number;
};

export type FunnelPoint = {
  name: string;
  value: number;
  fill: string;
};

const axisStyle = {
  fontSize: 11,
  fill: colors.muted,
};

const gridStroke = colors.surfaceMuted;
const tooltipStyle = {
  borderRadius: 12,
  border: `1px solid ${colors.surfaceMuted}`,
  background: colors.surface,
  color: colors.heading,
  fontSize: 12,
};

function currencyTick(v: number) {
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(v);
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const hasSignal = data.some((d) => d.billed > 0 || d.collected > 0);
  if (!hasSignal) {
    return (
      <EmptyState
        title="No revenue yet"
        description="Charts appear once invoices move."
        className="py-2"
      />
    );
  }

  return (
    <div className="h-44 w-full min-w-0 sm:h-52 lg:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            tickFormatter={currencyTick}
            width={40}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => formatCurrency(Number(value ?? 0))}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: colors.muted }} />
          <Bar
            dataKey="billed"
            name="Billed"
            fill={colors.primary}
            radius={[5, 5, 0, 0]}
            maxBarSize={28}
          />
          <Line
            type="monotone"
            dataKey="collected"
            name="Collected"
            stroke={colors.accent}
            strokeWidth={2.25}
            dot={{ r: 2.5, fill: colors.accent }}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LeadFunnelChart({ data }: { data: FunnelPoint[] }) {
  const hasSignal = data.some((d) => d.value > 0);
  if (!hasSignal) {
    return (
      <EmptyState
        title="No leads in funnel"
        description="Enquiries will chart as they arrive."
        className="py-2"
      />
    );
  }

  return (
    <div className="h-44 w-full min-w-0 sm:h-52 lg:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [`${value}`, "Leads"]}
          />
          <Funnel dataKey="value" data={data} isAnimationActive>
            <LabelList
              position="right"
              fill={colors.heading}
              stroke="none"
              dataKey="name"
              style={{ fontSize: 11, fontWeight: 600 }}
            />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminCharts({
  revenue,
  funnel,
}: {
  revenue: RevenuePoint[];
  funnel: FunnelPoint[];
}) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <section className="soft-panel h-full rounded-[0.95rem] p-2 sm:p-2.5">
        <div className="mb-1.5">
          <h2 className="font-display text-base text-heading sm:text-lg">Revenue trend</h2>
          <p className="text-[11px] text-muted">Billed vs collected</p>
        </div>
        <RevenueChart data={revenue} />
      </section>
      <section className="soft-panel h-full rounded-[0.95rem] p-2 sm:p-2.5">
        <div className="mb-1.5">
          <h2 className="font-display text-base text-heading sm:text-lg">Lead funnel</h2>
          <p className="text-[11px] text-muted">Enquiry → conversion</p>
        </div>
        <LeadFunnelChart data={funnel} />
      </section>
    </div>
  );
}
