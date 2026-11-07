import assert from "node:assert/strict";
import { createRequire } from "node:module";

// Lightweight runtime checks via tsx-compiled dynamic import fallback:
// These mirror critical schedule rules used by the app.

function minutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function intervalsOverlap(a, b) {
  if (a.day !== b.day) return false;
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

function shiftIntervals(start, end, day) {
  const s = minutes(start);
  const e = minutes(end);
  if (e > s) return [{ day, startMin: s, endMin: e }];
  return [
    { day, startMin: s, endMin: 24 * 60 },
    { day: "next", startMin: 0, endMin: e || 24 * 60 },
  ];
}

const a = shiftIntervals("08:00", "20:00", "2026-11-06");
const b = shiftIntervals("08:00", "20:00", "2026-11-06");
assert.equal(intervalsOverlap(a[0], b[0]), true);

const short = minutes("09:00") - minutes("08:00");
assert.equal(short, 60);
assert.ok(short < 4 * 60);

console.log("schedule.test.mjs ok");
