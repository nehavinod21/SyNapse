/**
 * Build (no PWA) + serve on fixed port 5180 for iPad demos.
 */
import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

console.log("Building production app (PWA disabled for iPad)...");
execSync("npm run build", {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, VITE_DISABLE_PWA: "1", VITE_API_RELATIVE: "1" },
});

console.log("Starting iPad preview server...");
const child = spawn("node", ["scripts/ipad-serve.mjs"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});
child.on("exit", (code) => process.exit(code ?? 0));
