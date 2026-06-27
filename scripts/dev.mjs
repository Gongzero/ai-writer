/**
 * Dev server with automatic recovery from webpack chunk / .next cache corruption.
 * - Clears .next after a production build (stamp file)
 * - Uses Turbopack (fewer chunk mismatches than webpack dev)
 * - Restarts once with a full .next wipe if chunk errors appear in logs
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const nextDir = path.join(root, ".next");
const prodStamp = path.join(root, ".next-production-stamp");
const port = process.env.PORT || "3000";
const MAX_AUTO_RESTARTS = 2;

const CHUNK_ERROR =
  /Cannot find module '\.\/|__webpack_modules__\[moduleId\] is not a function|ChunkLoadError|Loading chunk \d+ failed/i;

function killPorts() {
  execSync("node scripts/kill-dev-ports.mjs", { cwd: root, stdio: "inherit" });
}

function cleanNext() {
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log("[dev] .next 캐시를 삭제했습니다.");
  }
}

function prepareDevStart({ forceClean = false } = {}) {
  if (forceClean || fs.existsSync(prodStamp)) {
    cleanNext();
    if (fs.existsSync(prodStamp)) {
      fs.unlinkSync(prodStamp);
      console.log("[dev] 프로덕션 빌드 흔적을 감지해 캐시를 초기화했습니다.");
    }
  }
}

function startDev(restartCount = 0) {
  const child = spawn("npx", ["next", "dev", "-p", port, "--turbo"], {
    cwd: root,
    stdio: ["inherit", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  let recovering = false;

  const maybeRecover = (text) => {
    if (recovering || restartCount >= MAX_AUTO_RESTARTS) return;
    if (!CHUNK_ERROR.test(text)) return;

    recovering = true;
    console.log(
      "\n[dev] 청크 캐시 오류 감지 — .next 삭제 후 dev 서버를 다시 띄웁니다…\n"
    );
    child.kill("SIGTERM");

    setTimeout(() => {
      prepareDevStart({ forceClean: true });
      startDev(restartCount + 1);
    }, 600);
  };

  child.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
    maybeRecover(chunk.toString());
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
    maybeRecover(chunk.toString());
  });

  child.on("exit", (code, signal) => {
    if (recovering) return;
    if (signal === "SIGTERM" || signal === "SIGKILL") return;
    process.exit(code ?? 1);
  });
}

killPorts();
prepareDevStart();
startDev();
