/** Lightweight fingerprint to flag reused attendance photos. */
export function photoFingerprint(dataUrl: string) {
  const raw = dataUrl.slice(0, 1200) + dataUrl.slice(-400);
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `ph-${Math.abs(hash)}`;
}
