/**
 * Production build — refuses to run while dev server is active (prevents .next corruption).
 */
import { spawnSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const prodStamp = path.join(root, ".next-production-stamp");

function isDevServerRunning() {
  try {
    const out = execSync("lsof -ti :3000", { encoding: "utf8" }).trim();
    return Boolean(out);
  } catch {
    return false;
  }
}

if (isDevServerRunning()) {
  console.error("");
  console.error("❌ dev 서버(포트 3000)가 실행 중이라 build를 중단했습니다.");
  console.error("   build와 dev가 .next를 동시에 쓰면 ./301.js 같은 오류가 납니다.");
  console.error("");
  console.error("   → dev 터미널을 먼저 종료한 뒤 npm run build 를 실행하세요.");
  console.error("   → 또는 dev만 쓰려면 npm run dev 를 사용하세요.");
  console.error("");
  process.exit(1);
}

const result = spawnSync("npx", ["next", "build"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

if (result.status === 0) {
  fs.writeFileSync(prodStamp, String(Date.now()));
  console.log("[build] 완료. 다음 npm run dev 시 .next가 자동으로 초기화됩니다.");
}

process.exit(result.status ?? 1);
