/** Last 10 digits of an Indian mobile, or empty when the value is too short. */
export function phoneKey(value?: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length < 10) return "";
  return digits.slice(-10);
}

export function phonesMatch(a?: string, b?: string) {
  const left = phoneKey(a);
  const right = phoneKey(b);
  return Boolean(left && left === right);
}
