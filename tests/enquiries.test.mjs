import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync("npx", ["--yes", "tsx", "tests/enquiries.check.ts"], {
  cwd: root,
  encoding: "utf8",
  shell: true,
});

if (result.status !== 0) {
  console.error(result.stdout);
  console.error(result.stderr);
  process.exit(result.status || 1);
}

assert.match(`${result.stdout || ""}${result.stderr || ""}`, /enquiries-ok/);
console.log("enquiries.test.mjs ok");
