import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "tests", "_password_check.ts");
fs.writeFileSync(
  script,
  `
import { hashPassword, verifyPassword, isHashedPassword } from '../src/lib/password.ts';
const h = hashPassword('admin123');
if (!isHashedPassword(h)) throw new Error('not hashed');
if (!verifyPassword('admin123', h)) throw new Error('verify fail');
if (verifyPassword('wrong', h)) throw new Error('false positive');
if (!verifyPassword('legacy', 'legacy')) throw new Error('legacy fail');
console.log('password-ok');
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
assert.match(String(result.stdout || "") + String(result.stderr || ""), /password-ok/);
console.log("password.test.mjs ok");
