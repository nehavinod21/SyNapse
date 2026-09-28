/**
 * Free SyNAPSE preview ports and start production build for iPad on a fixed port.
 * Usage: node scripts/ipad-serve.mjs
 */
import { execSync, spawn } from "node:child_process";
import os from "node:os";

const PORT = Number(process.env.SYNAPSE_IPAD_PORT || 5180);
const PORTS_TO_CLEAR = [5173, 5174, PORT];

function lanIp() {
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const addr of iface ?? []) {
      if (addr.family !== "IPv4" || addr.internal) continue;
      if (addr.address.startsWith("192.168.56.")) continue;
      return addr.address;
    }
  }
  return "127.0.0.1";
}

function killPort(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`Stopped process ${pid} on port ${port}`);
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* nothing listening */
  }
}

for (const p of PORTS_TO_CLEAR) killPort(p);

const ip = lanIp();
console.log("");
console.log("========================================");
console.log("  SyNAPSE iPad server starting...");
console.log(`  iPad Safari URL: http://${ip}:${PORT}/login`);
console.log("  API is proxied through this port (backend on localhost:8000)");
console.log("========================================");
console.log("");

const child = spawn("npx", ["vite", "preview", "--host", "0.0.0.0", "--port", String(PORT), "--strictPort"], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
