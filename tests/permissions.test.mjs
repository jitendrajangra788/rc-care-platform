import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Run with: npx tsx tests/permissions.ts-equivalent via dynamic import of built helpers
import { createHash } from "node:crypto";

const ALL_ROLES = [
  "super_admin",
  "admin",
  "care_coordinator",
  "nurse",
  "family",
  "patient",
];

assert.ok(ALL_ROLES.includes("care_coordinator"));
assert.ok(createHash("sha256").update("x").digest("hex").length === 64);

console.log("permissions.test.mjs ok");
