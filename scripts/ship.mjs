/**
 * 변경 사항을 GitHub에 올리면 Vercel이 자동 배포합니다.
 *
 * npm run ship -- "커밋 메시지"
 * npm run ship
 */
import { spawnSync, execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function gitOutput(args) {
  return execSync(["git", ...args].join(" "), {
    cwd: root,
    encoding: "utf8",
  }).trim();
}

const messageArg = process.argv.slice(2).join(" ").trim();
const message =
  messageArg ||
  `update ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`;

try {
  gitOutput(["rev-parse", "--is-inside-work-tree"]);
} catch {
  console.error("❌ Git 저장소가 아닙니다.");
  process.exit(1);
}

console.log("");
console.log("📦 GitHub에 올리는 중…");
console.log(`   메시지: ${message}`);
console.log("");

run("git", ["add", "."]);

const pending = gitOutput(["status", "--porcelain"]);
if (pending) {
  run("git", ["commit", "-m", message]);
} else {
  console.log("ℹ️  새로 커밋할 변경 없음 → push만 시도합니다.");
}

run("git", ["push"]);

console.log("");
console.log("✅ 완료. Vercel이 자동으로 다시 배포합니다.");
console.log("");
