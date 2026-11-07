import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "tests", "_rbac_check.ts");
fs.writeFileSync(
  script,
  `
import { can, isStaffOpsRole } from '../src/lib/permissions/index.ts';
const superUser = { id: '1', name: 'S', email: 's@x', role: 'super_admin' as const };
const nurse = { id: '2', name: 'N', email: 'n@x', role: 'nurse' as const };
const family = { id: '3', name: 'F', email: 'f@x', role: 'family' as const };
const coord = { id: '4', name: 'C', email: 'c@x', role: 'care_coordinator' as const };
if (!can(superUser, 'settings.write')) throw new Error('super settings');
if (can(nurse, 'bookings.assign')) throw new Error('nurse assign');
if (!can(coord, 'schedule.write')) throw new Error('coord schedule');
if (can(coord, 'payroll.write')) throw new Error('coord payroll write');
if (!can(family, 'complaints.write')) throw new Error('family complain');
if (!isStaffOpsRole('admin') || isStaffOpsRole('nurse')) throw new Error('ops role');
console.log('rbac-ok');
`,
);

const result = spawnSync("npx", ["--yes", "tsx", script], {
  cwd: root,
  encoding: "utf8",
  shell: true,
});
fs.unlinkSync(script);

if (result.status !== 0) {
  console.error(result.stdout);
  console.error(result.stderr);
  process.exit(result.status || 1);
}
assert.match(String(result.stdout || "") + String(result.stderr || ""), /rbac-ok/);
console.log("rbac-matrix.test.mjs ok");
