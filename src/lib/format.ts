/** Display helpers — en-IN. Use only for UI strings; do not change stored data. */

/** ₹ currency (en-IN). Preferred name. */
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** @deprecated Prefer formatCurrency */
export function formatINR(amount: number) {
  return formatCurrency(amount);
}

/** Digits only from any phone-like string */
export function digitsOnly(value: string) {
  return String(value || "").replace(/\D/g, "");
}

/**
 * Display phone as `+91 XXXXX XXXXX`.
 * Accepts 10-digit local or 12-digit with 91 prefix.
 */
export function formatPhone(value: string) {
  let d = digitsOnly(value);
  if (d.startsWith("91") && d.length >= 12) d = d.slice(-10);
  if (d.length === 10) {
    return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  }
  if (d.length === 0) return "—";
  return value.trim() || "—";
}

/** Tel href for Call actions */
export function telHref(value: string) {
  let d = digitsOnly(value);
  if (d.startsWith("91") && d.length >= 12) d = d.slice(-10);
  if (d.length === 10) return `tel:+91${d}`;
  if (d.length > 0) return `tel:+${d}`;
  return undefined;
}

export function formatDate(value: string | Date | undefined | null) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(value: string | Date | undefined | null) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Title Case for names / areas (display only) */
export function titleCase(value: string) {
  const s = String(value || "").trim();
  if (!s) return "—";
  return s
    .toLowerCase()
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

export function initials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
