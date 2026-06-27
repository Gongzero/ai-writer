import { execSync } from "node:child_process";

const ports = [3000, 3001, 3002];

for (const port of ports) {
  try {
    const out = execSync(`lsof -ti :${port}`, { encoding: "utf8" }).trim();
    if (!out) continue;
    for (const pid of out.split("\n").filter(Boolean)) {
      try {
        process.kill(Number(pid), "SIGTERM");
        console.log(`Stopped process ${pid} on port ${port}`);
      } catch {
        // already gone
      }
    }
  } catch {
    // no process on this port
  }
}
