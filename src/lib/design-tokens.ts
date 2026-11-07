/**
 * Roshan Care design tokens (JS mirror of globals.css).
 * Use for inline styles / charts; prefer CSS vars + Tailwind in components.
 */
export const brand = {
  name: "Roshan Care",
  tagline: "Trusted Home Healthcare",
} as const;

export const colors = {
  primary: "#0F766E",
  primaryDeep: "#0D5F59",
  secondary: "#CCFBF1",
  secondaryDeep: "#99F6E4",
  background: "#F5F7FA",
  surface: "#FFFFFF",
  surfaceMuted: "#EEF2F6",
  heading: "#0F172A",
  muted: "#64748B",
  accent: "#EA580C",
  accentDeep: "#C2410C",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#0284C7",
  sidebar: "#0B1F33",
} as const;

export const statusColors = {
  active: colors.success,
  pending: colors.warning,
  assigned: colors.info,
  completed: colors.muted,
  cancelled: colors.danger,
  paused: colors.warning,
  "on-duty": colors.success,
  available: colors.info,
  leave: colors.warning,
} as const;

/** Safe on server + client — chart fills for lead funnel stages */
export function leadFunnelColors(stage: string, index = 0) {
  if (stage === "new") return statusColors.pending;
  if (stage === "contacted") return statusColors.assigned;
  if (stage === "converted") return statusColors.active;
  const fallback = [colors.info, colors.primary, colors.success] as const;
  return fallback[index % fallback.length];
}

export const radius = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  full: "9999px",
} as const;

export const iconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const spacing = {
  pageX: "1.25rem",
  sectionY: "4rem",
  stack: "1.5rem",
  card: "1.25rem",
} as const;
